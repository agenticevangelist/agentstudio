from django.urls import path
from . import views

urlpatterns = [
    path('connections', views.create_connected_account, name='connections-create'),
    path('connections/oauth/initiate', views.initiate_oauth, name='connections-initiate-oauth'),
    path('connections/list', views.list_connected_accounts, name='connections-list'),
    # Triggers webhook (no trailing slash)
    path('triggers/composio', views.composio_webhook, name='composio-webhook'),
    # Developer/agent tooling
    path('toolkits/connected', views.list_connected_toolkits, name='toolkits-connected'),
    path('toolkits/<slug:slug>/triggers', views.list_triggers, name='toolkits-triggers'),
    path('toolkits/<slug:slug>/triggers/<slug:trigger_slug>', views.get_trigger_schema, name='toolkits-trigger-schema'),
]
