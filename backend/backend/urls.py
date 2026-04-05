from django.contrib import admin
from django.urls import include, path
from api.views import create_admin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('create-admin/', create_admin, name='create-admin'),
    path('api/', include('api.urls')),
]
