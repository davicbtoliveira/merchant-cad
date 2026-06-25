"""WSGI config for merchant_cad."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "merchant_cad.settings")

application = get_wsgi_application()

