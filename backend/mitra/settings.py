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
    'apps.termine.apps.TermineConfig',
    'apps.kontakte',
    'apps.angebote',
    'apps.ki',
    'apps.push',
    'apps.wissen',
    'apps.artikel',
    'apps.bautagebuch',
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
        'HOST': os.getenv('ARTIKELSTAMM_DB_HOST', '85.215.195.50'),
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

# CORS
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost(:\d+)?$',
    r'^http://127\.0\.0\.1(:\d+)?$',
    r'^http://192\.168\.\d+\.\d+(:\d+)?$',
    r'^http://10\.\d+\.\d+\.\d+(:\d+)?$',
]
CORS_ALLOW_CREDENTIALS = True

# Ollama (Embedding-Server für Artikelsuche)
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://10.0.0.2:11434')
OLLAMA_EMBED_MODEL = os.getenv('OLLAMA_EMBED_MODEL', 'nomic-embed-text:latest')

# Anthropic / Claude CLI
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')

# RAGflow
RAGFLOW_URL = os.getenv('RAGFLOW_URL', '')
RAGFLOW_API_KEY = os.getenv('RAGFLOW_API_KEY', '')
RAGFLOW_CHAT_ID = os.getenv('RAGFLOW_CHAT_ID', '')
RAGFLOW_DATASET_ID = os.getenv('RAGFLOW_DATASET_ID', '')
RAGFLOW_ANGEBOTE_CHAT_ID = os.getenv('RAGFLOW_ANGEBOTE_CHAT_ID', '528d3de647df11f18b6ebe8980b100ab')

# HERO CRM
HERO_API_TOKEN = os.getenv('HERO_API_TOKEN', '')

# IDS Connect (Großhändler — gutonlineplus.de)
IDS_CONNECT_URL = os.getenv('IDS_CONNECT_URL', 'https://www.gutonlineplus.de/ids.aspx')
IDS_CONNECT_KUNDENNUMMER = os.getenv('IDS_CONNECT_KUNDENNUMMER', '')
IDS_CONNECT_USER = os.getenv('IDS_CONNECT_USER', '')
IDS_CONNECT_PASSWORD = os.getenv('IDS_CONNECT_PASSWORD', '')

# Web Push (VAPID)
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', '')
VAPID_SUBJECT = os.getenv('VAPID_SUBJECT', 'mailto:admin@mitra-app.de')

if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
    import logging as _logging
    _logging.getLogger('django').warning(
        "VAPID_PRIVATE_KEY oder VAPID_PUBLIC_KEY nicht gesetzt — "
        "Push-Notifications werden NICHT funktionieren!"
    )

# Media / Static
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

USE_TZ = True
TIME_ZONE = 'Europe/Berlin'
LANGUAGE_CODE = 'de-de'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {name} {levelname}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'angebote.ki_pipeline': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'apps.termine': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'apps.push': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
