"""
ASGI config for djapp project (Channels-enabled).

Ensures Django is configured before importing modules that define models
(`chat.routing` -> `chat.consumers` -> `agents.services.*` -> `chat.models`).
"""

import os

# Configure settings ASAP to avoid ImproperlyConfigured during imports
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djapp.settings")

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Initialize Django first so apps/models are ready
django_asgi_app = get_asgi_application()

# Now it's safe to import routing which touches models via consumers
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})
