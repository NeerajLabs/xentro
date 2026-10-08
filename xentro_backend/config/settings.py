"""
XENTRO Django Configuration Settings
Modular Monolith Architecture
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "xentro-dev-secret-key-2026")
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,.onrender.com").split(",") if h.strip()]
if ".onrender.com" not in ALLOWED_HOSTS and "*" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(".onrender.com")

# Core Applications
# django.contrib.auth + contenttypes are framework-level stubs required by DRF
# at import time. They write NOTHING to any database — DATABASES is empty.
# All real auth logic goes through XentroJWTAuthentication + MongoDB.
INSTALLED_APPS = [
    # Channels (must be before django.contrib.staticfiles)
    "daphne",
    "channels",

    # Required by Django REST Framework internally (import-time dependency only)
    "django.contrib.contenttypes",
    "django.contrib.auth",

    "django.contrib.staticfiles",

    # Third Party
    "rest_framework",
    "corsheaders",

    # Xentro Modular Monolith Apps
    "apps.accounts",
    "apps.authentication",
    "apps.admin_ops",
    "apps.verification",
    "apps.entities",
    "apps.memberships",
    "apps.startups",
    "apps.investors",
    "apps.mentors",
    "apps.esps",
    "apps.opportunities",
    "apps.feed",
    "apps.messaging",
    "apps.notifications",
    "apps.meetings",
    "apps.diligence",
    "apps.finance",
    "apps.entitlements",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# No SQL database — MongoDB Atlas is the sole data store for all Xentro data.
# Django ORM and migrations are not used; all reads/writes go through pymongo.
# (django.contrib.auth, sessions, contenttypes, messages are NOT installed)
DATABASES = {}

# Rest Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "common.jwt_auth.XentroJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
    # Override DRF's default AnonymousUser (which comes from django.contrib.auth)
    # with a lightweight no-op class. This ensures unauthenticated requests
    # never trigger a DB query or auth model import at runtime.
    "UNAUTHENTICATED_USER": "common.jwt_auth.XentroAnonymousUser",
    "UNAUTHENTICATED_TOKEN": None,
}

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
    r"^https:\/\/.*\.xentro\.in$",
]

# Realtime Channels & Redis Layer
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer" if DEBUG else "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        } if not DEBUG else {},
    },
}

# Email & Zoho Configuration
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.zoho.in")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() in ("true", "1")
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").lower() in ("true", "1")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "no-reply@xentro.in")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@xentro.in")
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "15"))

# Password validation is handled by Xentro's own logic in apps.accounts — not Django auth.

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
