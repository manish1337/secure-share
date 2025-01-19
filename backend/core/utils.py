import os
from cryptography.fernet import Fernet
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import base64
import magic
from io import BytesIO

ALLOWED_EXTENSIONS = {
    'pdf', 'doc', 'docx', 'txt',
    'png', 'jpg', 'jpeg', 'gif'
}

def generate_encryption_key():
    """Generate a new encryption key."""
    return Fernet.generate_key()

def encrypt_file(file_data, key):
    """Encrypt file data using the provided key."""
    if not isinstance(file_data, bytes):
        file_data = file_data.encode()
    f = Fernet(key)
    encrypted_data = f.encrypt(file_data)
    return encrypted_data

def decrypt_file(encrypted_data, key):
    """Decrypt file data using the provided key."""
    if not isinstance(encrypted_data, bytes):
        encrypted_data = encrypted_data.encode()
    f = Fernet(key)
    decrypted_data = f.decrypt(encrypted_data)
    return decrypted_data

def validate_file_extension(filename):
    """Validate file extension."""
    ext = filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File extension .{ext} is not allowed")
    return ext

def save_encrypted_file(file, owner, content_type=None):
    """Save an encrypted file and return the EncryptedFile instance."""
    from .models import EncryptedFile
    
    # Validate file extension
    validate_file_extension(file.name)
    
    # Read file content as bytes
    file_content = file.read()
    if not isinstance(file_content, bytes):
        file_content = file_content.encode()
    
    # Generate encryption key
    key = generate_encryption_key()
    
    # Encrypt file content
    encrypted_content = encrypt_file(file_content, key)
    
    # Create a temporary file path
    file_path = f'encrypted_files/{owner.id}/{file.name}'
    
    # Save encrypted content
    saved_path = default_storage.save(
        file_path,
        ContentFile(encrypted_content)
    )
    
    # Create EncryptedFile instance
    encrypted_file = EncryptedFile.objects.create(
        owner=owner,
        name=file.name,
        file=saved_path,
        encryption_key=key,
        content_type=content_type or file.content_type,
        size=len(file_content)  # Use actual content length
    )
    
    try:
        return encrypted_file
    except Exception as e:
        # Clean up any temporary files in case of error
        if 'saved_path' in locals():
            default_storage.delete(saved_path)
        raise e

def get_decrypted_file(encrypted_file):
    """Get the decrypted content of an encrypted file."""
    # Read encrypted content
    with default_storage.open(encrypted_file.file.name, 'rb') as f:
        encrypted_content = f.read()
    
    # Decrypt content
    decrypted_content = decrypt_file(encrypted_content, encrypted_file.encryption_key)
    
    return decrypted_content

def validate_file_type(file_content):
    """Validate file type using magic numbers"""
    allowed_types = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
    ]
    
    mime = magic.Magic(mime=True)
    file_type = mime.from_buffer(file_content)
    
    if file_type not in allowed_types:
        raise ValueError(f"File type {file_type} is not allowed")
    
    return file_type 