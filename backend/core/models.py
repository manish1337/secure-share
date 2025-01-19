from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from datetime import datetime
import os

class User(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('user', 'Regular User'),
        ('guest', 'Guest'),
    )
    
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLES, default='user')
    mfa_secret = models.CharField(max_length=32, blank=True)
    mfa_enabled = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def has_file_access(self, file):
        if self.role == 'admin':
            return True
        if file.owner == self:
            return True
        return file.shares.filter(shared_with=self).exists()

class EncryptedFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='encrypted_files/')
    encryption_key = models.BinaryField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    content_type = models.CharField(max_length=100)
    size = models.BigIntegerField()

    def __str__(self):
        return f"{self.name} ({self.owner.username})"

    class Meta:
        ordering = ['-uploaded_at']

    def delete(self, *args, **kwargs):
        # Delete the actual file
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

class FileShare(models.Model):
    PERMISSIONS = (
        ('view', 'View Only'),
        ('download', 'Download'),
    )
    
    file = models.ForeignKey(EncryptedFile, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files')
    permission = models.CharField(max_length=10, choices=PERMISSIONS, default='view')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('file', 'shared_with')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file.name} shared with {self.shared_with.username}"

class ShareableLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(EncryptedFile, on_delete=models.CASCADE, related_name='links')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    access_count = models.IntegerField(default=0)
    max_access = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-expires_at']

    @property
    def is_valid(self):
        return (
            self.expires_at > datetime.now() and
            (self.max_access is None or self.access_count < self.max_access)
        )

    def __str__(self):
        return f"Link for {self.file.name} (expires: {self.expires_at})" 

# Add new model for audit logs
class AuditLog(models.Model):
    ACTION_TYPES = (
        ('upload', 'File Upload'),
        ('download', 'File Download'),
        ('share', 'File Share'),
        ('delete', 'File Delete'),
        ('access', 'Link Access'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    file = models.ForeignKey(EncryptedFile, on_delete=models.SET_NULL, null=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp'] 