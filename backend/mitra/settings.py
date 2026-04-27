"""
MitraApp Django Settings
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'apps.notizen',
    'apps.termine',
    'apps.kontakte',
    'apps.angebote',
    'apps.ki',
    'apps.push',
    'apps.wissen',
    'apps.artikel',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ROOT_URLCONF = 'mitra.urls'
WSGI_APPLICATION = 'mitra.wsgi.application'
ASGI_APPLICATION = 'mitra.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'mitra'),
        'USER': os.getenv('DB_USER', 'mitra'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'mitra2024'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    },
    'artikelstamm': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('ARTIKELSTAMM_DB_NAME', 'artikelstamm'),
        'USER': os.getenv('ARTIKELSTAMM_DB_USER', 'artikelstamm'),
        'PASSWORD': os.getenv('ARTIKELSTAMM_DB_PASSWORD', 'artikelstamm2024'),
        'HOST': os.getenv('ARTIKELSTAMM_DB_HOST', 'localhost'),
        'PORT': os.getenv('ARTIKELSTAMM_DB_PORT', '5433'),
    }
}

DATABASE_ROUTERS = ['mitra.db_router.ArtikelstammRouter']

AUTH_USER_MODEL = 'auth.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# JWT Auth
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS (Angular Dev Server)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
]
CORS_ALLOW_CREDENTIALS = True

# Anthropic / Claude CLI
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')

# RAGflow
RAGFLOW_URL = os.getenv('RAGFLOW_URL', '')
RAGFLOW_API_KEY = os.getenv('RAGFLOW_API_KEY', '')
RAGFLOW_CHAT_ID = os.getenv('RAGFLOW_CHAT_ID', '')
RAGFLOW_DATASET_ID = os.getenv('RAGFLOW_DATASET_ID', '')

# HERO CRM
HERO_API_TOKEN = os.getenv('HERO_API_TOKEN', '')

# Web Push
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_SUBJECT = os.getenv('VAPID_SUBJECT', 'mailto:admin@mitra-app.de')

# Media / Static
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

USE_TZ = True
TIME_ZONE = 'Europe/Berlin'
LANGUAGE_CODE = 'de-de'
