from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import (
    UserViewSet, EncryptedFileViewSet,
    FileShareViewSet, ShareableLinkViewSet
)

router = DefaultRouter()
router.register(r'files', EncryptedFileViewSet, basename='file')
router.register(r'shares', FileShareViewSet, basename='share')
router.register(r'links', ShareableLinkViewSet, basename='link')

# Create a router specifically for auth endpoints
auth_router = DefaultRouter()
auth_router.register(r'auth', UserViewSet, basename='auth')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include(auth_router.urls)),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 