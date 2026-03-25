"""
URL configuration for analytics app.
"""

from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    # Overview endpoint
    path('overview/', views.overview_view, name='overview'),
    
    # Traffic data endpoint
    path('traffic/', views.traffic_view, name='traffic'),
    
    # Pages data endpoint
    path('pages/', views.pages_view, name='pages'),
    
    # Sync endpoint
    path('sync/', views.sync_view, name='sync'),
    
    # Health check endpoint
    path('health/', views.health_check, name='health_check'),
]
