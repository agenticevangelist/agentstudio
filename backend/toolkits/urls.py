from django.urls import path
from . import views

urlpatterns = [
    path('tools', views.list_tools, name='tools-list'),
    path('toolkits/', views.list_toolkits, name='toolkits-list'),
    path('toolkits/cache', views.list_toolkits_cache, name='toolkits-cache'),
    path('toolkits/<slug:slug>/', views.get_toolkit_details, name='toolkits-detail'),
    # Wizard-focused endpoints (relocated from agents app)
    path('toolkits/<slug:slug>/details', views.wizard_toolkit_details, name='toolkits-wizard-details'),
    path('toolkits/<slug:slug>/tools', views.wizard_toolkit_tools, name='toolkits-wizard-tools'),
]
