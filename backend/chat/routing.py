from django.urls import re_path
from .consumers import ThreadConsumer, InboxConsumer


websocket_urlpatterns = [
    re_path(r"^ws/chat/(?P<thread_id>[0-9a-f\-]+)/$", ThreadConsumer.as_asgi()),
    re_path(r"^ws/inbox/(?P<user_id>[0-9a-f\-]+)/$", InboxConsumer.as_asgi()),
]


