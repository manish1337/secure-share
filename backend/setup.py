#!/usr/bin/env python
import os
import sys
import django
from django.core.management import execute_from_command_line

def setup():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
    django.setup()
    
    # Create superuser
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            'admin',
            'admin@example.com',
            'adminpassword',
            role='admin'
        )
        print('Superuser created successfully')
    
    # Run migrations
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Create media directory if it doesn't exist
    media_dir = os.path.join(os.path.dirname(__file__), 'media')
    if not os.path.exists(media_dir):
        os.makedirs(media_dir)
        print('Media directory created')

if __name__ == '__main__':
    setup() 