# Secure File Sharing Application

A secure file-sharing web application built with Django and React that enables users to upload, download, and share files with robust security measures.

## Features

- User Authentication with Multi-Factor Authentication (MFA)
- Role-Based Access Control (RBAC)
- File Encryption at Rest (AES-256)
- Secure File Sharing with Expiring Links
- JWT-based Authentication
- Rate Limiting and Security Headers

## Prerequisites

- Docker and Docker Compose
- Git

## Quick Start

1. Clone the repository:

```bash
git clone <repository-url>
cd secure-share
```

2. Create environment files:

   - Copy `.env.example` to `.env` and update the values
   - Never commit the actual `.env` file

3. Build and start the containers:

```bash
docker-compose up --build
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Interface: http://localhost:8000/admin

## Development Setup

### Backend (Django)

The backend will automatically reload when changes are made to the code.

To run migrations:

```bash
docker-compose exec backend python manage.py migrate
```

To create a superuser:

```bash
docker-compose exec backend python manage.py createsuperuser
```

### Frontend (React)

The frontend will automatically reload when changes are made to the code.

To install new npm packages:

```bash
docker-compose exec frontend npm install <package-name>
```

## Security Notes

1. In production:

   - Change all secret keys and passwords
   - Enable SSL/TLS
   - Set DEBUG=0
   - Enable secure cookie settings
   - Use proper domain names in ALLOWED_HOSTS

2. File Upload Security:

   - Maximum file size is limited to 5MB
   - Only allowed file types: .pdf, .doc, .docx, .txt, .jpg, .jpeg, .png
   - All files are encrypted at rest

3. Authentication:
   - Passwords are hashed using bcrypt
   - JWT tokens expire after 60 minutes
   - MFA is required for all users

## API Documentation

The API documentation is available at:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Testing

To run backend tests:

```bash
docker-compose exec backend pytest
```

To run frontend tests:

```bash
docker-compose exec frontend npm test
```

## License

MIT License
