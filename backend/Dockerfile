FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create media directory
RUN mkdir -p /app/media && chmod 777 /app/media

# Add logs directory
RUN mkdir -p /app/logs && chmod 777 /app/logs

# Create static directory
RUN mkdir -p /app/static && chmod 777 /app/static

# Expose port
EXPOSE 8000

# Start server
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --workers 3 app.wsgi:application"] 