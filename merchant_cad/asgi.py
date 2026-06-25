"""ASGI config for merchant_cad."""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "merchant_cad.settings")

application = get_asgi_application()

