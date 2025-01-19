from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, EncryptedFile, FileShare, ShareableLink
import pyotp
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'confirm_password', 'role', 'mfa_enabled')
        extra_kwargs = {
            'email': {'required': True},
            'role': {'read_only': True},
            'mfa_enabled': {'read_only': True}
        }

    def validate(self, attrs):
        if 'confirm_password' in attrs:
            if attrs['password'] != attrs.pop('confirm_password'):
                raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        user.mfa_secret = pyotp.random_base32()
        user.save()
        return user

class EncryptedFileSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    download_url = serializers.SerializerMethodField()
    content_type = serializers.CharField(read_only=True)
    size = serializers.IntegerField(read_only=True)

    class Meta:
        model = EncryptedFile
        fields = ('id', 'name', 'file', 'owner', 'uploaded_at', 
                 'content_type', 'size', 'download_url')
        read_only_fields = ('id', 'owner', 'uploaded_at', 'download_url', 
                          'content_type', 'size')

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request and request.user.has_file_access(obj):
            return request.build_absolute_uri(f'/api/files/{obj.id}/download/')
        return None

    def validate_file(self, value):
        # 10MB file size limit
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "File size cannot exceed 10MB"
            )
        return value

class FileShareSerializer(serializers.ModelSerializer):
    file = EncryptedFileSerializer(read_only=True)
    file_id = serializers.UUIDField(write_only=True)
    shared_with = UserSerializer(read_only=True)
    shared_with_username = serializers.CharField(write_only=True)

    class Meta:
        model = FileShare
        fields = ('id', 'file', 'file_id', 'shared_with', 
                 'shared_with_username', 'permission', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_shared_with_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

    def create(self, validated_data):
        shared_with = validated_data.pop('shared_with_username')
        file_id = validated_data.pop('file_id')
        
        try:
            file = EncryptedFile.objects.get(id=file_id)
        except EncryptedFile.DoesNotExist:
            raise serializers.ValidationError({"file_id": "File not found"})

        if file.owner != self.context['request'].user:
            raise serializers.ValidationError({"file_id": "You don't own this file"})

        return FileShare.objects.create(
            file=file,
            shared_with=shared_with,
            **validated_data
        )

class ShareableLinkSerializer(serializers.ModelSerializer):
    file = EncryptedFileSerializer(read_only=True)
    file_id = serializers.UUIDField(write_only=True)
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = ShareableLink
        fields = ('id', 'file', 'file_id', 'expires_at', 'access_count', 
                 'max_access', 'is_valid', 'share_url')
        read_only_fields = ('id', 'access_count', 'share_url')

    def get_share_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/share/{obj.id}')
        return None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data) 