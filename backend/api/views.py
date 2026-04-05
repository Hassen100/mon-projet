from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import render
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
def register(request):
    username = (request.data.get('username') or request.data.get('email') or '').strip().lower()
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    if not username or not email or not password:
        return Response({'message': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User(
        username=username,
        email=email,
        last_login=timezone.now(),
    )
    user.set_password(password)
    user.save()

    return Response(
        {
            'message': 'User created',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
def login(request):
    username = (request.data.get('username') or request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    if not username or not password:
        return Response({'message': 'Missing credentials'}, status=status.HTTP_400_BAD_REQUEST)

    lookup_user = User.objects.filter(username=username).first()

    if lookup_user is None and '@' in username:
        lookup_user = User.objects.filter(email=username).first()

    if lookup_user is None:
        return Response({'message': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)

    user = authenticate(username=username, password=password)

    if user is None and '@' in username:
        user = authenticate(username=lookup_user.username, password=password)

    if user is not None:
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        return Response(
            {
                'message': 'Login success',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_staff or user.is_superuser,
                },
            }
        )

    return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def auth_users(request):
    admin_email = (request.GET.get('admin_email') or '').strip().lower()

    if not admin_email:
        return Response({'message': 'Missing admin email'}, status=status.HTTP_400_BAD_REQUEST)

    admin_user = User.objects.filter(email=admin_email).first() or User.objects.filter(username=admin_email).first()

    if admin_user is None:
        return Response({'message': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    if not (admin_user.is_staff or admin_user.is_superuser):
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.exclude(last_login__isnull=True).order_by('-last_login')

    return Response(
        {
            'users': [
                {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'is_admin': user.is_staff or user.is_superuser,
                }
                for user in users
            ]
        }
    )


def create_admin(request):
    context = {
        'error': '',
        'success': '',
        'username': '',
        'email': '',
    }

    if request.method == 'POST':
        username = (request.POST.get('username') or '').strip().lower()
        email = (request.POST.get('email') or '').strip().lower()
        password = request.POST.get('password') or ''
        confirm_password = request.POST.get('confirm_password') or ''

        context['username'] = username
        context['email'] = email

        if not username or not email or not password or not confirm_password:
            context['error'] = 'Veuillez remplir tous les champs.'
        elif password != confirm_password:
            context['error'] = 'Les mots de passe ne correspondent pas.'
        elif User.objects.filter(username=username).exists():
            context['error'] = 'Ce nom d utilisateur existe deja.'
        elif User.objects.filter(email=email).exists():
            context['error'] = 'Cet email existe deja.'
        else:
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            context['success'] = 'Compte admin cree avec succes. Vous pouvez maintenant vous connecter sur /admin/.'
            context['username'] = ''
            context['email'] = ''

    return render(request, 'api/create_admin.html', context)
