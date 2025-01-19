from rest_framework import permissions
from .models import ShareableLink

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to access it.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        # Check if the object has an owner field
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        # For FileShare objects
        if hasattr(obj, 'file'):
            return obj.file.owner == request.user or obj.shared_with == request.user
        
        return False

class HasFileAccess(permissions.BasePermission):
    """
    Permission to check if user has access to a file through sharing.
    """
    def has_object_permission(self, request, view, obj):
        # Admin has full access
        if request.user.role == 'admin':
            return True
            
        # Owner has full access
        if obj.owner == request.user:
            return True
            
        # Check if file is shared with user
        share = obj.shares.filter(shared_with=request.user).first()
        if share:
            if request.method in permissions.SAFE_METHODS:
                return True
            return share.permission == 'download'
            
        return False 

class GuestPermission(permissions.BasePermission):
    """
    Permission class for guest users.
    Guests can only:
    - View shared files
    - Download files if explicitly permitted
    - Access files through valid shareable links
    """
    def has_permission(self, request, view):
        # Allow viewing shared files and accessing through links
        if request.method in permissions.SAFE_METHODS:
            return True
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role != 'guest':
            return True

        # For EncryptedFile objects
        if hasattr(obj, 'shares'):
            share = obj.shares.filter(shared_with=user).first()
            if share and share.permission == 'download':
                return True

        # For ShareableLink objects
        if isinstance(obj, ShareableLink):
            return obj.is_valid

        return False 