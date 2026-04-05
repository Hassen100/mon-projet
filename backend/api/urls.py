from django.urls import path

from .views import auth_users, login, register

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('auth-users/', auth_users, name='auth-users'),
]
