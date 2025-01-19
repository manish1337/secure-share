from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import models
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from .models import User, EncryptedFile, FileShare, ShareableLink
from .serializers import (
    UserSerializer, EncryptedFileSerializer,
    FileShareSerializer, ShareableLinkSerializer
)
from .permissions import IsOwnerOrAdmin, HasFileAccess, GuestPermission
from .utils import save_encrypted_file, get_decrypted_file, validate_file_type
import pyotp
from datetime import datetime, timedelta
import os
from django.core.exceptions import ValidationError, ObjectDoesNotExist
import logging
from django.core.files import File
from io import BytesIO
import urllib.parse

logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'login', 'register']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        
        # Store token in response and set cookie
        response = Response({
            'user': UserSerializer(user).data,
            'token': token
        })
        
        return response

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Registration successful',
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def enable_mfa(self, request, pk=None):
        user = self.get_object()
        if user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.mfa_enabled = True
        user.save()
        
        totp = pyotp.TOTP(user.mfa_secret)
        provisioning_uri = totp.provisioning_uri(
            user.email,
            issuer_name="Secure File Share"
        )
        
        return Response({
            'mfa_secret': user.mfa_secret,
            'provisioning_uri': provisioning_uri
        })

    @action(detail=True, methods=['get'])
    def mfa_qr(self, request, pk=None):
        """Generate QR code for MFA setup"""
        import qrcode
        import io
        from django.http import HttpResponse
        
        user = self.get_object()
        if user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        totp = pyotp.TOTP(user.mfa_secret)
        provisioning_uri = totp.provisioning_uri(
            user.email,
            issuer_name="Secure File Share"
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return HttpResponse(
            img_byte_arr.getvalue(),
            content_type='image/png'
        )

class EncryptedFileViewSet(viewsets.ModelViewSet):
    serializer_class = EncryptedFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.IsAuthenticated(), HasFileAccess(), GuestPermission()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return EncryptedFile.objects.all()
        return EncryptedFile.objects.filter(
            models.Q(owner=user) |
            models.Q(shares__shared_with=user)
        ).distinct()
    
    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        if not file:
            raise serializers.ValidationError({'file': 'No file was submitted'})
        
        # Read file content for validation
        file_content = file.read()
        file.seek(0)  # Reset file pointer
        
        try:
            # Validate file type
            content_type = validate_file_type(file_content)
            # Save encrypted file
            encrypted_file = save_encrypted_file(file, self.request.user, content_type)
            # Update serializer instance
            serializer.instance = encrypted_file
        except ValueError as e:
            raise serializers.ValidationError({'file': str(e)})
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        file = self.get_object()
        
        # Check if user has download permission
        if request.user != file.owner:
            share = file.shares.filter(shared_with=request.user).first()
            if not share or share.permission != 'download':
                return Response(
                    {'error': 'Download not permitted'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        decrypted_content = get_decrypted_file(file)
        
        response = FileResponse(
            decrypted_content,
            content_type=file.content_type,
            as_attachment=True,
            filename=file.name
        )
        return response

    @action(detail=False, methods=['post'])
    def chunk_upload(self, request):
        """Handle chunked file upload."""
        chunk = request.FILES.get('chunk')
        chunk_number = int(request.POST.get('chunk_number'))
        total_chunks = int(request.POST.get('total_chunks'))
        file_id = request.POST.get('file_id')
        filename = request.POST.get('filename')
        
        if not chunk:
            return Response(
                {'error': 'No chunk provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create upload session or get existing one
        upload_path = f'tmp/uploads/{request.user.id}/{file_id}/'
        os.makedirs(upload_path, exist_ok=True)
        
        # Save chunk
        with open(f'{upload_path}{chunk_number}', 'wb') as f:
            for chunk_data in chunk.chunks():
                f.write(chunk_data)
        
        # Check if all chunks are uploaded
        if chunk_number == total_chunks - 1:
            # Combine chunks
            with open(f'{upload_path}{filename}', 'wb') as outfile:
                for i in range(total_chunks):
                    chunk_path = f'{upload_path}{i}'
                    with open(chunk_path, 'rb') as infile:
                        outfile.write(infile.read())
                    os.remove(chunk_path)  # Clean up chunk
            
            # Create file object
            with open(f'{upload_path}{filename}', 'rb') as f:
                file_obj = File(f)
                file_obj.name = filename
                
                # Process the complete file
                try:
                    file_content = file_obj.read()
                    file_obj.seek(0)
                    content_type = validate_file_type(file_content)
                    encrypted_file = save_encrypted_file(file_obj, request.user, content_type)
                    
                    # Clean up
                    os.remove(f'{upload_path}{filename}')
                    os.rmdir(upload_path)
                    
                    return Response(
                        EncryptedFileSerializer(encrypted_file).data,
                        status=status.HTTP_201_CREATED
                    )
                except Exception as e:
                    return Response(
                        {'error': str(e)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        return Response({'message': 'Chunk uploaded successfully'})

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Generate preview for supported file types."""
        file = self.get_object()
        
        # Check if preview is supported
        if not file.content_type.startswith(('image/', 'application/pdf')):
            return Response(
                {'error': 'Preview not supported for this file type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            decrypted_content = get_decrypted_file(file)
            
            # For images, return the image data
            if file.content_type.startswith('image/'):
                return HttpResponse(
                    decrypted_content,
                    content_type=file.content_type
                )
            
            # For PDFs, return first page as image
            if file.content_type == 'application/pdf':
                import fitz  # PyMuPDF
                from PIL import Image
                import io
                
                # Convert PDF to image
                pdf = fitz.open(stream=decrypted_content, filetype="pdf")
                pix = pdf[0].get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Save image to buffer
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                return HttpResponse(
                    img_buffer.getvalue(),
                    content_type='image/png'
                )
                
        except Exception as e:
            return Response(
                {'error': f'Error generating preview: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def handle_exception(self, exc):
        if isinstance(exc, (ValidationError, PermissionError)):
            return Response(
                {'error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if isinstance(exc, ObjectDoesNotExist):
            return Response(
                {'error': 'Resource not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Log unexpected errors
        logger.error(f"Unexpected error: {exc}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class FileShareViewSet(viewsets.ModelViewSet):
    serializer_class = FileShareSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        return FileShare.objects.filter(
            models.Q(file__owner=self.request.user) |
            models.Q(shared_with=self.request.user)
        )

class ShareableLinkViewSet(viewsets.ModelViewSet):
    serializer_class = ShareableLinkSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_permissions(self):
        if self.action in ['retrieve', 'download']:
            return []  # No permissions required for public access
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        if self.action in ['retrieve', 'download']:
            return ShareableLink.objects.all()
        return ShareableLink.objects.filter(
            models.Q(file__owner=self.request.user) |
            models.Q(created_by=self.request.user)
        )
    
    def perform_create(self, serializer):
        expires_at = datetime.now() + timedelta(days=7)  # Default 7 days
        if 'expires_at' in self.request.data:
            expires_at = datetime.fromisoformat(self.request.data['expires_at'])
            
        serializer.save(
            created_by=self.request.user,
            expires_at=expires_at
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        link = get_object_or_404(ShareableLink, id=pk)
        
        if not link.is_valid:
            return Response(
                {'error': 'Link has expired'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        link.access_count += 1
        link.save()
        
        file = link.file
        decrypted_content = get_decrypted_file(file)
        
        # Create a BytesIO object from the decrypted content
        file_content = BytesIO(decrypted_content)
        
        # Create response with proper filename
        response = FileResponse(
            file_content,
            content_type=file.content_type,
            as_attachment=True  # This ensures the file is downloaded
        )
        
        # URL encode the filename to handle special characters
        encoded_filename = urllib.parse.quote(file.name)
        
        # Set Content-Disposition with both filename and filename* parameters
        response['Content-Disposition'] = f'attachment; filename="{encoded_filename}"; filename*=UTF-8\'\'{encoded_filename}'
        response['Content-Length'] = len(decrypted_content)
        
        return response

    def retrieve(self, request, *args, **kwargs):
        link = self.get_object()
        if not link.is_valid:
            return Response(
                {'error': 'Link has expired'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs) 