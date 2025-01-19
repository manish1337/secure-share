from .models import AuditLog
import json

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log only API requests
        if request.path.startswith('/api/'):
            if request.user.is_authenticated:
                try:
                    # Extract file ID from URL if present
                    file_id = None
                    if 'files' in request.path:
                        parts = request.path.split('/')
                        if len(parts) > 3:
                            file_id = parts[3]
                    
                    AuditLog.objects.create(
                        user=request.user,
                        action=self._get_action_type(request),
                        file_id=file_id,
                        details={
                            'method': request.method,
                            'path': request.path,
                            'status_code': response.status_code,
                        },
                        ip_address=self._get_client_ip(request)
                    )
                except Exception as e:
                    print(f"Error logging audit: {e}")
        
        return response
    
    def _get_action_type(self, request):
        if 'files' in request.path:
            if request.method == 'POST':
                return 'upload'
            elif request.method == 'GET' and 'download' in request.path:
                return 'download'
            elif request.method == 'DELETE':
                return 'delete'
            return 'access'  # Default action for other file operations
        elif 'shares' in request.path and request.method == 'POST':
            return 'share'
        elif 'links' in request.path and 'access' in request.path:
            return 'access'
        return 'access'  # Default action type
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR') 