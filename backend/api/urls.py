from django.urls import path

from .views import auth_users, health, login, register

urlpatterns = [
    path('health/', health, name='health'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('auth-users/', auth_users, name='auth-users'),
]
