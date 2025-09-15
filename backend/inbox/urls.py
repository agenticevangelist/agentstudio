from django.urls import path
from . import views

urlpatterns = [
    path("inbox/", views.inbox_list, name="inbox_list"),
    path("inbox/<uuid:id>/mark_read", views.inbox_mark_read, name="inbox_mark_read"),
    path("inbox/<uuid:id>/respond", views.inbox_respond, name="inbox_respond"),
    path("inbox/<uuid:id>", views.inbox_delete, name="inbox_delete"),
]
