import os
from pathlib import Path
import json
from urllib.parse import urlparse

import dj_database_url
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

if load_dotenv is not None and os.getenv('DJANGO_USE_DOTENV', 'true').strip().lower() == 'true':
    load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-seo-dashboard-dev-key')

DEBUG = os.getenv('DJANGO_DEBUG', 'True').strip().lower() == 'true'


def parse_csv_env(name, default=''):
    raw_value = os.getenv(name, default)
    return [item.strip() for item in raw_value.split(',') if item.strip()]


def normalize_origin(value):
    parsed = urlparse(value)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return value


allowed_hosts = parse_csv_env('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost')

# Always allow Render domains in production, even when DJANGO_ALLOWED_HOSTS is misconfigured.
allowed_hosts.extend(['127.0.0.1', 'localhost', '.onrender.com'])

render_hostname = os.getenv('RENDER_EXTERNAL_HOSTNAME', '').strip()
if render_hostname:
    allowed_hosts.append(render_hostname)

ALLOWED_HOSTS = list(dict.fromkeys(allowed_hosts))

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'api',
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
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

database_url = os.getenv('DATABASE_URL')
if database_url:
    DATABASES = {
        'default': dj_database_url.config(
            default=database_url,
            conn_max_age=600,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'Europe/Paris'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL_ORIGINS', 'True').strip().lower() == 'true'

raw_cors_origins = parse_csv_env('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(normalize_origin(origin) for origin in raw_cors_origins))

raw_csrf_origins = parse_csv_env('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(normalize_origin(origin) for origin in raw_csrf_origins))

ENABLE_CREATE_ADMIN_PAGE = os.getenv('ENABLE_CREATE_ADMIN_PAGE', 'True').strip().lower() == 'true'

# Google Analytics & Search Console Configuration
GA_PROPERTY_ID = os.getenv('GA_PROPERTY_ID', '')
GA_CREDENTIALS_JSON = os.getenv('GA_CREDENTIALS_JSON', '{}')
GSC_SITE_URL = os.getenv('GSC_SITE_URL', '')
GSC_CREDENTIALS_JSON = os.getenv('GSC_CREDENTIALS_JSON', '{}')

# Parse credentials
try:
    GA_CREDENTIALS = json.loads(GA_CREDENTIALS_JSON) if GA_CREDENTIALS_JSON else {}
except (json.JSONDecodeError, ValueError):
    GA_CREDENTIALS = {}

try:
    GSC_CREDENTIALS = json.loads(GSC_CREDENTIALS_JSON) if GSC_CREDENTIALS_JSON else {}
except (json.JSONDecodeError, ValueError):
    GSC_CREDENTIALS = {}

# REST Framework authentication settings.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}


PAGESPEED_API_KEY = os.getenv('PAGESPEED_API_KEY', '')
PAGESPEED_REQUEST_REFERER = os.getenv('PAGESPEED_REQUEST_REFERER', '').strip()
