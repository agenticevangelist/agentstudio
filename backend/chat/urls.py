from django.urls import path
from . import views

urlpatterns = [
    path("chat/interactive/stream", views.interactive_stream, name="interactive_stream"),
    path("chat/sessions", views.sessions, name="chat_sessions"),
    path("chat/sessions/<uuid:session_id>", views.session_detail, name="chat_session_detail"),
    path("tts", views.tts, name="tts"),
]
