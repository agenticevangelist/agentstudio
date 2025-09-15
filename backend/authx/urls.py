from django.urls import path
from . import views

urlpatterns = [
    path("login", views.login_view, name="auth_login"),
    path("signup", views.signup_view, name="auth_signup"),
    path("logout", views.logout_view, name="auth_logout"),
    path("me", views.me_view, name="auth_me"),
]
