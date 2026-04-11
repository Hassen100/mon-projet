from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from api.views import create_admin

def api_home(request):
    return JsonResponse({
        'message': 'SEO Dashboard API',
        'version': '1.0.0',
        'endpoints': {
            'api': '/api/',
            'admin': '/admin/',
            'create_admin': '/create-admin/',
            'health': '/api/health/',
            'docs': '/api/docs/'
        }
    })

urlpatterns = [
    path('', api_home, name='api-home'),
    path('admin/', admin.site.urls),
    path('create-admin/', create_admin, name='create-admin'),
    path('api/', include('api.urls')),
]
