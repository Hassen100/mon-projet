from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import Http404
from django.shortcuts import render
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.db.models import Sum, Avg
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
import json
import hashlib
import requests
import time
import threading
from urllib.parse import urlparse, urlunparse
from .models import (
    GoogleAnalyticsData,
    GoogleAnalyticsPageData,
    GoogleSearchConsoleData,
    GoogleSearchConsolePageData,
    GoogleIntegrationConfig,
    ContentAnalysis,
)
from .models_url import (
    URLAnalysisData,
    URLPageData,
    URLKeywordData
)
from .google_analytics_service import GoogleAnalyticsService
from .google_search_console_service import GoogleSearchConsoleService
from .url_analysis_service import URLAnalysisService
from .serializers import AnalyticsSerializer, AnalyticsResponseSerializer
from .serializers_content import ContentAnalysisListSerializer, ContentAnalysisDetailSerializer
from .serializers_url import URLAnalysisSerializer, URLAnalysisResponseSerializer
from .serializers_ai import (
    PageRecommendationRequestSerializer,
    PageRecommendationResponseSerializer,
    AIChatMessageSerializer,
    AIChatResponseSerializer,
    AIQuickAnalysisSerializer,
)
from .ai_recommendation_service import SEORecommendationService
from .ollama_service import OllamaService
from .content_analyzer import refresh_all_analyses
from datetime import datetime, timedelta
import os


def resolve_google_user(request, user_id=None):
    if getattr(request, 'user', None) and request.user.is_authenticated:
        return request.user

    resolved_user_id = user_id or request.GET.get('user_id') or request.data.get('user_id')
    if resolved_user_id:
        try:
            return User.objects.get(id=resolved_user_id)
        except User.DoesNotExist:
            pass

    config = GoogleIntegrationConfig.objects.select_related('user').first()
    if config:
        return config.user

    # Fallback: Use the first available user or create a test user
    first_user = User.objects.first()
    if first_user:
        return first_user
    
    # Last resort: Create a test user
    test_user, created = User.objects.get_or_create(
        username='test_ai_user',
        defaults={'email': 'test@ai.local', 'is_active': True}
    )
    return test_user


def resolve_google_context(request, user_id=None):
    requested_user = resolve_google_user(request, user_id)

    try:
        config = GoogleIntegrationConfig.objects.get(user=requested_user)
        return requested_user, config
    except GoogleIntegrationConfig.DoesNotExist:
        fallback_config = GoogleIntegrationConfig.objects.select_related('user').first()
        if fallback_config:
            return fallback_config.user, fallback_config
        return requested_user, None


def parse_mode_and_days(request):
    mode = request.GET.get('mode', 'period')
    raw_days = request.GET.get('days', 30)

    try:
        days = int(raw_days)
    except (TypeError, ValueError):
        days = 30

    if mode == 'today':
        return mode, 1
    if mode == 'yesterday':
        return mode, 1

    return mode, max(days, 1)


def should_refresh_google_data(request):
    return request.GET.get('refresh') in {'1', 'true', 'True'}


def get_effective_ga_config(config):
    ga_property_id = ''
    ga_credentials = {}

    if config:
        ga_property_id = (config.ga_property_id or '').strip()
        ga_credentials = config.ga_credentials_json or {}

    if not ga_property_id:
        ga_property_id = (getattr(settings, 'GA_PROPERTY_ID', '') or '').strip()

    if not ga_credentials:
        ga_credentials = getattr(settings, 'GA_CREDENTIALS', {}) or {}

    return ga_property_id, ga_credentials


def get_effective_gsc_config(config):
    gsc_site_url = ''
    gsc_credentials = {}

    if config:
        gsc_site_url = (config.gsc_site_url or '').strip()
        gsc_credentials = config.gsc_credentials_json or {}

    if not gsc_site_url:
        gsc_site_url = (getattr(settings, 'GSC_SITE_URL', '') or '').strip()

    if not gsc_credentials:
        gsc_credentials = getattr(settings, 'GSC_CREDENTIALS', {}) or {}

    return gsc_site_url, gsc_credentials


def build_analytics_db_daily_data(user, mode, days):
    if mode in {'today', 'yesterday'}:
        target_date = datetime.now().date() if mode == 'today' else datetime.now().date() - timedelta(days=1)
        queryset = GoogleAnalyticsData.objects.filter(user=user, date=target_date).order_by('date')
    else:
        start_date = datetime.now().date() - timedelta(days=days)
        queryset = GoogleAnalyticsData.objects.filter(user=user, date__gte=start_date).order_by('date')

    return [
        {
            'date': item.date.isoformat(),
            'sessions': item.sessions,
            'active_users': item.active_users,
            'page_views': item.screen_page_views,
        }
        for item in queryset
    ]


def build_search_db_daily_data(user, mode, days):
    if mode in {'today', 'yesterday'}:
        target_date = datetime.now().date() if mode == 'today' else datetime.now().date() - timedelta(days=1)
        queryset = GoogleSearchConsoleData.objects.filter(user=user, date=target_date)
    else:
        start_date = datetime.now().date() - timedelta(days=days)
        queryset = GoogleSearchConsoleData.objects.filter(user=user, date__gte=start_date)

    grouped = queryset.values('date').annotate(
        total_clicks=Coalesce(Sum('clicks'), 0),
        total_impressions=Coalesce(Sum('impressions'), 0),
        avg_ctr=Coalesce(Avg('ctr'), 0.0),
        avg_position=Coalesce(Avg('position'), 0.0),
    ).order_by('date')

    return [
        {
            'date': item['date'].isoformat(),
            'clicks': item['total_clicks'] or 0,
            'impressions': item['total_impressions'] or 0,
            'ctr': float(item['avg_ctr'] or 0),
            'position': float(item['avg_position'] or 0),
        }
        for item in grouped
    ]


def build_search_db_summary(user, mode, days):
    if mode in {'today', 'yesterday'}:
        target_date = datetime.now().date() if mode == 'today' else datetime.now().date() - timedelta(days=1)
        queryset = GoogleSearchConsoleData.objects.filter(user=user, date=target_date)
    else:
        start_date = datetime.now().date() - timedelta(days=days)
        queryset = GoogleSearchConsoleData.objects.filter(user=user, date__gte=start_date)

    totals = queryset.aggregate(
        clicks=Coalesce(Sum('clicks'), 0),
        impressions=Coalesce(Sum('impressions'), 0),
    )

    clicks = totals['clicks'] or 0
    impressions = totals['impressions'] or 0

    if impressions > 0:
        ctr = clicks / impressions
        total_position_weighted = 0
        for item in queryset.values('position', 'impressions'):
            total_position_weighted += float(item['position'] or 0) * float(item['impressions'] or 0)
        position = total_position_weighted / impressions if impressions > 0 else 0
    else:
        ctr = 0.0
        position = 0.0

    return {
        'clicks': clicks,
        'impressions': impressions,
        'ctr': ctr,
        'position': position,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
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
    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            'message': 'User created',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_staff or user.is_superuser,
                'is_superuser': user.is_superuser,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
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
        
        # Générer ou récupérer le token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response(
            {
                'message': 'Login success',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_staff or user.is_superuser,
                    'is_superuser': user.is_superuser,
                },
            }
        )

    return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_users(request):
    admin_user = request.user

    if not admin_user.is_superuser:
        return Response({'message': 'Superuser access required'}, status=status.HTTP_403_FORBIDDEN)

    # Include newly created accounts even if they have never logged in yet.
    users = User.objects.filter(is_active=True).order_by('-date_joined', '-last_login')

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


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})


@api_view(['GET'])
def debug_config(request):
    """Debug endpoint - affiche la config Google pour un utilisateur"""
    user_id = request.GET.get('user_id')
    
    if not user_id:
        return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        config = GoogleIntegrationConfig.objects.get(user=user)
        
        return Response({
            'user_id': user.id,
            'username': user.username,
            'has_ga_property_id': bool(config.ga_property_id),
            'ga_property_id': config.ga_property_id,
            'has_ga_credentials': bool(config.ga_credentials_json),
            'ga_credentials_keys': list(config.ga_credentials_json.keys()) if config.ga_credentials_json else [],
            'has_gsc_site_url': bool(config.gsc_site_url),
            'gsc_site_url': config.gsc_site_url,
            'has_gsc_credentials': bool(config.gsc_credentials_json),
            'gsc_credentials_keys': list(config.gsc_credentials_json.keys()) if config.gsc_credentials_json else [],
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except GoogleIntegrationConfig.DoesNotExist:
        return Response({'error': 'Google config not found for user'}, status=status.HTTP_404_NOT_FOUND)


def _is_valid_http_url(value):
    if not value:
        return False

    try:
        parsed = urlparse(value)
    except Exception:
        return False

    return parsed.scheme in {'http', 'https'} and bool(parsed.netloc)


def _extract_web_vitals(report):
    def simplify_metrics(raw_metrics):
        metrics = {}

        key_map = {
            'LARGEST_CONTENTFUL_PAINT_MS': 'lcp',
            'FIRST_CONTENTFUL_PAINT_MS': 'fcp',
            'CUMULATIVE_LAYOUT_SHIFT_SCORE': 'cls',
            'INTERACTION_TO_NEXT_PAINT': 'inp',
            'FIRST_INPUT_DELAY_MS': 'fid',
        }

        for source_key, target_key in key_map.items():
            metric = raw_metrics.get(source_key)
            if not metric:
                continue

            metrics[target_key] = {
                'id': source_key,
                'percentile': metric.get('percentile'),
                'category': metric.get('category'),
                'distributions': metric.get('distributions', []),
            }

        return metrics

    loading_experience = report.get('loadingExperience', {})
    origin_loading_experience = report.get('originLoadingExperience', {})

    return {
        'loadingExperience': {
            'overallCategory': loading_experience.get('overall_category'),
            'metrics': simplify_metrics(loading_experience.get('metrics', {})),
        },
        'originLoadingExperience': {
            'overallCategory': origin_loading_experience.get('overall_category'),
            'metrics': simplify_metrics(origin_loading_experience.get('metrics', {})),
        },
    }


def _normalize_pagespeed_url(value):
    try:
        parsed = urlparse(value.strip())
    except Exception:
        return value

    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path or '/'

    if path != '/' and path.endswith('/'):
        path = path.rstrip('/')

    return urlunparse((scheme, netloc, path, '', parsed.query, ''))


def _trim_lighthouse_result(lighthouse_result):
    if not lighthouse_result:
        return {}

    audits = lighthouse_result.get('audits', {})
    kept_audit_keys = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'speed-index',
        'total-blocking-time',
        'cumulative-layout-shift',
        'interactive',
        'render-blocking-resources',
        'unused-javascript',
        'unused-css-rules',
        'image-delivery-insight',
        'network-requests',
        'modern-image-formats',
        'uses-optimized-images',
        'uses-text-compression',
        'uses-responsive-images',
        'server-response-time',
        'uses-rel-preconnect',
        'font-display',
        'viewport',
        'meta-description',
        'document-title',
        'http-status-code',
        'is-crawlable',
        'robots-txt',
        'link-text',
        'tap-targets',
        'aria-allowed-attr',
        'color-contrast',
        'image-alt',
        'label',
        'valid-lang',
        'errors-in-console',
        'no-document-write',
        'third-party-cookies',
        'uses-http2',
        'final-screenshot',
    ]

    trimmed_audits = {}
    for key in kept_audit_keys:
        if key not in audits:
            continue

        audit = audits.get(key) or {}
        trimmed_audit = {
            'id': audit.get('id'),
            'title': audit.get('title'),
            'score': audit.get('score'),
            'scoreDisplayMode': audit.get('scoreDisplayMode'),
            'displayValue': audit.get('displayValue'),
            'description': audit.get('description'),
        }

        if key == 'final-screenshot':
            details = audit.get('details', {}) or {}
            trimmed_audit['details'] = {'data': details.get('data')}

        trimmed_audits[key] = trimmed_audit

    return {
        'fetchTime': lighthouse_result.get('fetchTime'),
        'finalUrl': lighthouse_result.get('finalUrl'),
        'requestedUrl': lighthouse_result.get('requestedUrl'),
        'lighthouseVersion': lighthouse_result.get('lighthouseVersion'),
        'userAgent': lighthouse_result.get('userAgent'),
        'runWarnings': lighthouse_result.get('runWarnings'),
        'categories': lighthouse_result.get('categories', {}),
        'categoryGroups': lighthouse_result.get('categoryGroups', {}),
        'audits': trimmed_audits,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pagespeed_insights(request):
    started = time.perf_counter()
    target_url = (request.GET.get('url') or '').strip()
    strategy = (request.GET.get('strategy') or 'mobile').strip().lower()
    force_refresh = request.GET.get('refresh') in {'1', 'true', 'True'}

    if not target_url:
        return Response({'message': 'Query param "url" is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not _is_valid_http_url(target_url):
        return Response({'message': 'Invalid URL. Use a full URL starting with http:// or https://'}, status=status.HTTP_400_BAD_REQUEST)

    normalized_url = _normalize_pagespeed_url(target_url)

    if strategy not in {'mobile', 'desktop'}:
        return Response({'message': 'Invalid strategy. Use "mobile" or "desktop"'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = (getattr(settings, 'PAGESPEED_API_KEY', '') or '').strip()

    cache_key_raw = f'pagespeed::{normalized_url}::{strategy}'
    cache_key = 'ps_' + hashlib.sha256(cache_key_raw.encode('utf-8')).hexdigest()
    stale_cache_key = 'ps_stale_' + hashlib.sha256(cache_key_raw.encode('utf-8')).hexdigest()

    if not force_refresh:
        cached = cache.get(cache_key)
        if cached:
            cached['cached'] = True
            cached['analysisDurationMs'] = 0
            return Response(cached)

        stale_cached = cache.get(stale_cache_key)
        if stale_cached:
            stale_cached['cached'] = True
            stale_cached['staleCache'] = True
            stale_cached['analysisDurationMs'] = 0
            return Response(stale_cached)

    endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    params = [
        ('url', normalized_url),
        ('strategy', strategy),
        ('category', 'performance'),
        ('category', 'accessibility'),
        ('category', 'best-practices'),
        ('category', 'seo'),
    ]

    if api_key:
        params.append(('key', api_key))

    request_headers = {
        'User-Agent': 'SEO-Dashboard-Backend/1.0',
        'Accept': 'application/json',
    }

    configured_referer = (getattr(settings, 'PAGESPEED_REQUEST_REFERER', '') or '').strip()
    if configured_referer:
        request_headers['Referer'] = configured_referer

    try:
        google_response = requests.get(endpoint, params=params, headers=request_headers, timeout=70)
    except requests.RequestException:
        fallback = cache.get(stale_cache_key)
        if fallback:
            fallback['cached'] = True
            fallback['staleCache'] = True
            fallback['analysisDurationMs'] = 0
            return Response(fallback)
        return Response({'message': 'Failed to reach Google PageSpeed API'}, status=status.HTTP_502_BAD_GATEWAY)

    if google_response.status_code == 429 and api_key:
        retry_params = [item for item in params if item[0] != 'key']
        try:
            retry_response = requests.get(endpoint, params=retry_params, headers=request_headers, timeout=70)
            if retry_response.status_code == 200:
                google_response = retry_response
        except requests.RequestException:
            pass

    if google_response.status_code != 200:
        error_message = 'PageSpeed API request failed'
        try:
            error_payload = google_response.json()
            error_message = error_payload.get('error', {}).get('message') or error_message
        except ValueError:
            error_payload = {'raw': google_response.text[:500]}

        response_payload = {
            'message': error_message,
            'statusCode': google_response.status_code,
            'details': error_payload,
        }

        reason = error_payload.get('error', {}).get('details', [{}])[0].get('reason') if isinstance(error_payload, dict) else None
        lowered_error_message = (error_message or '').lower()
        is_referer_blocked = (
            reason == 'API_KEY_HTTP_REFERRER_BLOCKED'
            or 'referer' in lowered_error_message
            or 'referrer' in lowered_error_message
        )

        if is_referer_blocked:
            response_payload['message'] = (
                'La cle API PageSpeed est restreinte par referer HTTP. '
                'Autorisez ce domaine dans Google Cloud API restrictions ou utilisez une cle serveur.'
            )

        fallback = cache.get(stale_cache_key)
        if fallback:
            fallback['cached'] = True
            fallback['staleCache'] = True
            fallback['analysisDurationMs'] = 0
            return Response(fallback)

        return Response(response_payload, status=status.HTTP_502_BAD_GATEWAY)

    try:
        payload = google_response.json()
    except ValueError:
        return Response({'message': 'Invalid response from PageSpeed API'}, status=status.HTTP_502_BAD_GATEWAY)

    lighthouse_result = payload.get('lighthouseResult', {})
    lighthouse_categories = lighthouse_result.get('categories', {})

    categories = {
        'performance': int(round((lighthouse_categories.get('performance', {}).get('score') or 0) * 100)),
        'seo': int(round((lighthouse_categories.get('seo', {}).get('score') or 0) * 100)),
        'accessibility': int(round((lighthouse_categories.get('accessibility', {}).get('score') or 0) * 100)),
        'bestPractices': int(round((lighthouse_categories.get('best-practices', {}).get('score') or 0) * 100)),
    }

    clean_response = {
        'url': normalized_url,
        'strategy': strategy,
        'cached': False,
        'analysisDurationMs': int((time.perf_counter() - started) * 1000),
        'analysisTimestamp': payload.get('analysisUTCTimestamp'),
        'categories': categories,
        'coreWebVitals': _extract_web_vitals(payload),
        'lighthouseResult': _trim_lighthouse_result(lighthouse_result),
    }

    cache.set(cache_key, clean_response, 1800)
    cache.set(stale_cache_key, clean_response, 86400)
    return Response(clean_response)


@api_view(['GET'])
def api_root(request):
    """API Root - Liste tous les endpoints disponibles"""
    return Response({
        'message': 'SEO Dashboard API - Google Analytics & Search Console Integration',
        'endpoints': {
            'auth': {
                'register': '/api/register/',
                'login': '/api/login/',
                'auth-users': '/api/auth-users/'
            },
            'config': {
                'set-google-config': 'POST /api/google-config/',
                'debug-config': '/api/debug-config/?user_id=1'
            },
            'google-analytics': {
                'summary': '/api/analytics/summary/?user_id=1&days=30',
                'top-pages': '/api/analytics/top-pages/?user_id=1&days=30&limit=20',
                'graph-data': '/api/analytics/graph/?user_id=1&days=30'
            },
            'google-search-console': {
                'summary': '/api/search/summary/?user_id=1&days=30',
                'top-queries': '/api/search/top-queries/?user_id=1&days=30&limit=20',
                'pages': '/api/search/pages/?user_id=1&days=30',
                'graph-data': '/api/search/graph/?user_id=1&days=30'
            },
            'pagespeed': {
                'analyze': '/api/pagespeed/?url=https://example.com&strategy=mobile'
            },
            'content-optimizer': {
                'list': 'GET /api/content-analysis/',
                'detail': 'GET /api/content-analysis/<id>/',
                'refresh': 'POST /api/content-analysis/refresh/'
            },
            'health': '/api/health/'
        },
        'ai': {
            'recommend-page': 'POST /api/ai/recommend/page/'
        }
    })


def create_admin(request):
    if not settings.ENABLE_CREATE_ADMIN_PAGE:
        raise Http404()

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


# ==================== GOOGLE ANALYTICS ENDPOINTS ====================

@api_view(['POST'])
def set_google_config(request):
    """Configure les credentials Google Analytics et Google Search Console"""
    print(f"\n=== DEBUG set_google_config ===")
    print(f"Request data: {request.data}")
    
    user_id = request.data.get('user_id')
    ga_property_id = request.data.get('ga_property_id', '')
    ga_credentials = request.data.get('ga_credentials', {})
    gsc_site_url = request.data.get('gsc_site_url', '')
    gsc_credentials = request.data.get('gsc_credentials', {})
    
    print(f"user_id={user_id}, ga_property_id={ga_property_id}")
    print(f"gsc_site_url={gsc_site_url}")
    
    try:
        user = User.objects.get(id=user_id)
        print(f"User found: {user.username}")
    except User.DoesNotExist:
        print(f"User not found: {user_id}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    config, created = GoogleIntegrationConfig.objects.get_or_create(user=user)
    print(f"Config created={created}, config_id={config.id}")
    
    if ga_property_id:
        config.ga_property_id = ga_property_id
        print(f"Set ga_property_id to: {ga_property_id}")
    if ga_credentials:
        config.ga_credentials_json = ga_credentials
        print(f"Set ga_credentials with keys: {list(ga_credentials.keys())}")
    if gsc_site_url:
        config.gsc_site_url = gsc_site_url
        print(f"Set gsc_site_url to: {gsc_site_url}")
    if gsc_credentials:
        config.gsc_credentials_json = gsc_credentials
        print(f"Set gsc_credentials with keys: {list(gsc_credentials.keys())}")
    
    config.save()
    print(f"Config saved successfully")
    
    return Response({
        'message': 'Configuration saved successfully',
        'config': {
            'ga_property_id': config.ga_property_id,
            'gsc_site_url': config.gsc_site_url,
        }
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_analytics_summary(request):
    """Récupère le résumé des données Google Analytics depuis la base MySQL"""
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    mode, days = parse_mode_and_days(request)
    
    try:
        if should_refresh_google_data(request):
            ga_property_id, ga_credentials = get_effective_ga_config(config)
            if ga_property_id and ga_credentials:
                ga_service = GoogleAnalyticsService(ga_credentials, ga_property_id)
                if mode in {'today', 'yesterday'}:
                    saved_data = ga_service.save_analytics_data(user, days=1, mode=mode)
                    return Response({
                        'sessions': saved_data['sessions'],
                        'users': saved_data['active_users'],
                        'page_views': saved_data['screen_page_views'],
                        'bounce_rate': round(saved_data['bounce_rate'], 2),
                        'avg_session_duration': 120
                    })
                else:
                    live_data = ga_service.get_analytics_data(days=days, mode=mode)
                    return Response({
                        'sessions': live_data['sessions'],
                        'users': live_data['active_users'],
                        'page_views': live_data['screen_page_views'],
                        'bounce_rate': round(live_data['bounce_rate'], 2),
                        'avg_session_duration': 120
                    })

        # Récupérer les données depuis la base MySQL
        if mode in {'today', 'yesterday'}:
            target_date = datetime.now().date() if mode == 'today' else datetime.now().date() - timedelta(days=1)
            analytics_data = GoogleAnalyticsData.objects.filter(
                user=user,
                date=target_date
            ).order_by('-date')
        else:
            # Mode "Période" : données sur la période spécifiée
            start_date = datetime.now().date() - timedelta(days=days)
            analytics_data = GoogleAnalyticsData.objects.filter(
                user=user,
                date__gte=start_date
            ).order_by('-date')
        
        if not analytics_data.exists():
            return Response({'error': 'No analytics data found'}, status=status.HTTP_404_NOT_FOUND)
        
        if mode in {'today', 'yesterday'}:
            latest_data = analytics_data.first()
            total_sessions = latest_data.sessions
            total_users = latest_data.active_users
            total_page_views = latest_data.screen_page_views
            avg_bounce_rate = latest_data.bounce_rate
        else:
            # Mode "Période" : calculer les totaux correctement
            total_sessions = sum(data.sessions for data in analytics_data)
            total_page_views = sum(data.screen_page_views for data in analytics_data)
            
            # Pour les utilisateurs, prendre la valeur la plus récente (utilisateurs uniques)
            latest_data = analytics_data.first()
            total_users = latest_data.active_users if latest_data else 0
            
            # Calculer le taux de rebond moyen
            bounce_rates = [data.bounce_rate for data in analytics_data if data.bounce_rate is not None]
            avg_bounce_rate = sum(bounce_rates) / len(bounce_rates) if bounce_rates else 0
        
        # Durée moyenne de session - valeur par défaut car le champ n'existe pas
        avg_session_duration = 120  # 2 minutes par défaut
        
        return Response({
            'sessions': total_sessions,
            'users': total_users,
            'page_views': total_page_views,
            'bounce_rate': round(avg_bounce_rate, 2),
            'avg_session_duration': avg_session_duration
        })
    except Exception as e:
        print(f"Error in get_analytics_summary: {e}")
        print(f"Details: mode={mode}, days={days}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_top_pages(request):
    """Récupère les pages les plus consultées depuis la base MySQL"""
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    mode, days = parse_mode_and_days(request)
    limit = int(request.GET.get('limit', 20))
    
    try:
        if should_refresh_google_data(request):
            ga_property_id, ga_credentials = get_effective_ga_config(config)
            if ga_property_id and ga_credentials:
                ga_service = GoogleAnalyticsService(ga_credentials, ga_property_id)
                if mode in {'today', 'yesterday'}:
                    ga_service.save_analytics_data(user, days=1, mode=mode)
                    live_pages = ga_service.get_top_pages(limit=limit, days=1, mode=mode)
                    return Response({
                        'pages': [
                            {
                                'page_path': page['page_path'],
                                'views': page['views'],
                                'avg_session_duration': 120
                            }
                            for page in live_pages
                        ]
                    })
                else:
                    live_pages = ga_service.get_top_pages(limit=limit, days=days, mode=mode)
                    return Response({
                        'pages': [
                            {
                                'page_path': page['page_path'],
                                'views': page['views'],
                                'avg_session_duration': 120
                            }
                            for page in live_pages
                        ]
                    })

        # Récupérer les données depuis la base MySQL
        page_queryset = GoogleAnalyticsPageData.objects.filter(user=user)

        if mode in {'today', 'yesterday'}:
            target_date = datetime.now().date() if mode == 'today' else datetime.now().date() - timedelta(days=1)
            page_queryset = page_queryset.filter(date=target_date)
        else:
            start_date = datetime.now().date() - timedelta(days=days)
            page_queryset = page_queryset.filter(date__gte=start_date)

        pages_data = page_queryset.values('page_path').annotate(
            total_views=Sum('screen_page_views'),
            total_sessions=Sum('sessions')
        ).order_by('-total_views')[:limit]
        
        if not pages_data:
            return Response({'pages': []})
        
        # Formater les données
        pages = []
        for page in pages_data:
            pages.append({
                'page_path': page['page_path'],
                'views': page['total_views'],
                'avg_session_duration': 120  # Valeur par défaut
            })
        
        return Response({'pages': pages})
    except Exception as e:
        print(f"Error in get_top_pages: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_analytics_graph_data(request):
    """Récupère les données journalières pour les graphiques"""
    mode, days = parse_mode_and_days(request)
    
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'Configuration not found'}, status=status.HTTP_404_NOT_FOUND)

    ga_property_id, ga_credentials = get_effective_ga_config(config)
    if not ga_property_id or not ga_credentials:
        return Response({'error': 'Google Analytics not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        ga_service = GoogleAnalyticsService(ga_credentials, ga_property_id)
        daily_data = ga_service.get_daily_data(days=days, mode=mode)
        if not daily_data:
            daily_data = build_analytics_db_daily_data(user, mode, days)
        return Response({'daily_data': daily_data})
    except Exception as e:
        daily_data = build_analytics_db_daily_data(user, mode, days)
        if daily_data:
            return Response({'daily_data': daily_data})
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==================== GOOGLE SEARCH CONSOLE ENDPOINTS ====================

@api_view(['GET'])
def get_search_summary(request):
    """Récupère le résumé des données Google Search Console"""
    mode, days = parse_mode_and_days(request)
    
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'Configuration not found'}, status=status.HTTP_404_NOT_FOUND)

    gsc_site_url, gsc_credentials = get_effective_gsc_config(config)
    if not gsc_site_url or not gsc_credentials:
        return Response({'error': 'Google Search Console not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        gsc_service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
        data = gsc_service.save_search_data(user, days=days, mode=mode)
        
        return Response({
            'search': {
                'clicks': data['clicks'],
                'impressions': data['impressions'],
                'ctr': round(data['ctr'] * 100, 2),  # Convertir en pourcentage
                'position': round(data['position'], 2),
            }
        })
    except Exception as e:
        summary = build_search_db_summary(user, mode, days)
        if summary['clicks'] > 0 or summary['impressions'] > 0:
            return Response({
                'search': {
                    'clicks': summary['clicks'],
                    'impressions': summary['impressions'],
                    'ctr': round(summary['ctr'] * 100, 2),
                    'position': round(summary['position'], 2),
                }
            })

        daily_data = build_search_db_daily_data(user, mode, days)
        if daily_data:
            formatted_data = []
            for day in daily_data:
                formatted_data.append({
                    'date': day['date'],
                    'clicks': day['clicks'],
                    'impressions': day['impressions'],
                    'ctr': round(day['ctr'] * 100, 2),
                    'position': round(day['position'], 2),
                })
            return Response({'daily_data': formatted_data})
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_top_queries(request):
    """Récupère les mots-clés les plus performants depuis la base MySQL"""
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    mode, days = parse_mode_and_days(request)
    limit = int(request.GET.get('limit', 20))
    
    try:
        if should_refresh_google_data(request):
            gsc_site_url, gsc_credentials = get_effective_gsc_config(config)
            if gsc_site_url and gsc_credentials:
                gsc_service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
                if mode == 'today':
                    live_queries = gsc_service.get_top_queries(limit=limit, days=days, mode=mode)
                    return Response({
                        'queries': [
                            {
                                'query': query['query'],
                                'clicks': query['clicks'],
                                'impressions': query['impressions'],
                                'ctr': f"{round(query['ctr'] * 100, 2)}%" if query['ctr'] else "0%",
                                'position': round(query['position'], 2) if query['position'] else 0,
                            }
                            for query in live_queries
                        ]
                    })
                else:
                    gsc_service.save_search_data(user, days=days, mode=mode)
                    live_queries = gsc_service.get_top_queries(limit=limit, days=days, mode=mode)
                    return Response({
                        'queries': [
                            {
                                'query': query['query'],
                                'clicks': query['clicks'],
                                'impressions': query['impressions'],
                                'ctr': f"{round(query['ctr'] * 100, 2)}%" if query['ctr'] else "0%",
                                'position': round(query['position'], 2) if query['position'] else 0,
                            }
                            for query in live_queries
                        ]
                    })

        # Récupérer les données depuis la base MySQL
        query_queryset = GoogleSearchConsoleData.objects.filter(user=user)

        if mode in {'today', 'yesterday'}:
            target_date = datetime.now().date() if mode == 'today' else datetime.now().date() - timedelta(days=1)
            query_queryset = query_queryset.filter(date=target_date)
        else:
            start_date = datetime.now().date() - timedelta(days=days)
            query_queryset = query_queryset.filter(date__gte=start_date)

        queries_data = query_queryset.values('query').annotate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions')
        ).order_by('-total_clicks')[:limit]
        
        if not queries_data:
            return Response({'queries': []})
        
        # Formater les données
        queries = []
        for query_agg in queries_data:
            query_name = query_agg['query']
            total_clicks = query_agg['total_clicks'] or 0
            total_impressions = query_agg['total_impressions'] or 0
            # Calculer CTR correctement : (clicks / impressions) * 100
            ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0.0
            
            # Calculer la position moyenne pondérée
            query_records = query_queryset.filter(query=query_name)
            total_position_weighted = sum(q.position * q.impressions for q in query_records)
            avg_position = (total_position_weighted / total_impressions) if total_impressions > 0 else 0.0
            
            queries.append({
                'query': query_name,
                'clicks': total_clicks,
                'impressions': total_impressions,
                'ctr': f"{round(ctr, 2)}%" if ctr > 0 else "0%",
                'position': round(avg_position, 2) if avg_position > 0 else 0
            })
        
        return Response({'queries': queries})
    except Exception as e:
        print(f"Error in get_top_queries: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_search_pages(request):
    """Récupère les pages les plus performantes en recherche"""
    mode, days = parse_mode_and_days(request)
    limit = int(request.GET.get('limit', 20))
    
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'Configuration not found'}, status=status.HTTP_404_NOT_FOUND)

    gsc_site_url, gsc_credentials = get_effective_gsc_config(config)
    if not gsc_site_url or not gsc_credentials:
        return Response({'error': 'Google Search Console not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        gsc_service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
        top_pages = gsc_service.get_top_pages(limit=limit, days=days, mode=mode)
        
        # Format les données
        formatted_pages = []
        for page in top_pages:
            formatted_pages.append({
                'page_url': page['page_url'],
                'clicks': page['clicks'],
                'impressions': page['impressions'],
                'ctr': round(page['ctr'] * 100, 2),
                'position': round(page['position'], 2),
            })
        
        return Response({'pages': formatted_pages})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_search_graph_data(request):
    """Récupère les données journalières pour les graphiques GSC"""
    mode, days = parse_mode_and_days(request)
    
    try:
        user, config = resolve_google_context(request)
    except User.DoesNotExist:
        return Response({'error': 'Configuration not found'}, status=status.HTTP_404_NOT_FOUND)

    gsc_site_url, gsc_credentials = get_effective_gsc_config(config)
    if not gsc_site_url or not gsc_credentials:
        return Response({'error': 'Google Search Console not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        gsc_service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
        daily_data = gsc_service.get_daily_data(days=days, mode=mode)
        if not daily_data:
            daily_data = build_search_db_daily_data(user, mode, days)
        
        # Format les données
        formatted_data = []
        for day in daily_data:
            formatted_data.append({
                'date': day['date'],
                'clicks': day['clicks'],
                'impressions': day['impressions'],
                'ctr': round(day['ctr'] * 100, 2),
                'position': round(day['position'], 2),
            })
        
        return Response({'daily_data': formatted_data})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==================== ANALYTICS API WITH TOKEN AUTH ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_data(request):
    """
    Endpoint API sécurisé pour récupérer les données analytics
    URL: GET /api/analytics/?period=30
    Headers: Authorization: Token <token>
    """
    serializer = AnalyticsSerializer(data=request.GET)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    period = serializer.validated_data['period']
    user = request.user
    
    try:
        # Vérifier la configuration Google Analytics
        config = GoogleIntegrationConfig.objects.get(user=user)
        
        if not config.ga_property_id or not config.ga_credentials_json:
            return Response({
                'error': 'Google Analytics not configured',
                'message': 'Veuillez configurer Google Analytics dans les paramètres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer les données depuis la base de données
        start_date = datetime.now().date() - timedelta(days=period)
        
        analytics_data = GoogleAnalyticsData.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('-date')
        
        if not analytics_data.exists():
            return Response({
                'sessions': 0,
                'users': 0,
                'page_views': 0,
                'bounce_rate': 0.0,
                'period': period,
                'message': 'Aucune donnée disponible pour cette période'
            })
        
        # Agréger les données
        total_sessions = sum(data.sessions for data in analytics_data)
        total_users = sum(data.active_users for data in analytics_data)
        total_page_views = sum(data.screen_page_views for data in analytics_data)
        avg_bounce_rate = sum(data.bounce_rate for data in analytics_data) / len(analytics_data)
        
        response_data = {
            'sessions': total_sessions,
            'users': total_users,
            'page_views': total_page_views,
            'bounce_rate': round(avg_bounce_rate, 2),
            'period': period,
            'data_points': len(analytics_data),
            'last_updated': analytics_data.first().date.isoformat() if analytics_data.exists() else None
        }
        
        # Valider et retourner la réponse
        response_serializer = AnalyticsResponseSerializer(data=response_data)
        if response_serializer.is_valid():
            return Response(response_serializer.data)
        else:
            return Response(response_data)
            
    except GoogleIntegrationConfig.DoesNotExist:
        return Response({
            'error': 'Configuration not found',
            'message': 'Veuillez configurer les intégrations Google'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Internal server error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==================== URL ANALYSIS API ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_url(request):
    """
    Endpoint pour analyser une URL spécifique
    URL: POST /api/analyze-url/
    Headers: Authorization: Token <token>
    Body: { "url": "https://exemple.com", "period": 30 }
    """
    serializer = URLAnalysisSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    url = serializer.validated_data['url']
    period = serializer.validated_data['period']
    user = request.user
    
    try:
        # Créer le service d'analyse
        analysis_service = URLAnalysisService(url)
        
        # Générer les données
        result = analysis_service.generate_realistic_data(user, period)
        
        # Formatter la réponse
        response_serializer = URLAnalysisResponseSerializer(data=result)
        if response_serializer.is_valid():
            return Response(response_serializer.data)
        else:
            return Response(result)
            
    except Exception as e:
        return Response({
            'error': 'Analysis failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_url_history(request):
    """
    Endpoint pour récupérer l'historique des analyses d'URL
    URL: GET /api/url-history/?limit=10
    """
    user = request.user
    limit = int(request.GET.get('limit', 10))
    
    try:
        analyses = URLAnalysisData.objects.filter(user=user)[:limit]
        
        history = []
        for analysis in analyses:
            history.append({
                'url': analysis.url,
                'date': analysis.date,
                'sessions': analysis.sessions,
                'users': analysis.users,
                'page_views': analysis.page_views,
                'bounce_rate': analysis.bounce_rate,
                'last_updated': analysis.updated_at
            })
        
        return Response({'history': history})
        
    except Exception as e:
        return Response({
            'error': 'Failed to load history',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recommend_page(request):
    """
    Endpoint pour generer des recommandations SEO de page a partir de metriques structurees.
    URL: POST /api/ai/recommend/page/
    """
    serializer = PageRecommendationRequestSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    service = SEORecommendationService()
    recommendations = service.recommend_page(
        url=data['url'],
        bounce_rate=data['bounce_rate'],
        avg_duration=data['avg_duration'],
        sessions=data['sessions'],
        position=data.get('position'),
        impressions=data.get('impressions', 0),
        ctr=data.get('ctr', 0),
    )

    response_data = {'recommendations': recommendations}
    response_serializer = PageRecommendationResponseSerializer(data=response_data)
    response_serializer.is_valid(raise_exception=True)
    return Response(response_serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def content_analysis_list(request):
    """List content analyses for current user."""
    user = request.user
    queryset = ContentAnalysis.objects.filter(user=user).order_by('-last_updated')

    serializer = ContentAnalysisListSerializer(queryset, many=True)
    analyses = serializer.data
    avg_semantic_score = 0.0
    if analyses:
        avg_semantic_score = round(sum(item['semantic_score'] for item in analyses) / len(analyses), 2)

    return Response(
        {
            'count': len(analyses),
            'average_semantic_score': avg_semantic_score,
            'results': analyses,
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def content_analysis_detail(request, analysis_id):
    """Return one content analysis detail."""
    try:
        analysis = ContentAnalysis.objects.get(id=analysis_id, user=request.user)
    except ContentAnalysis.DoesNotExist:
        return Response({'error': 'Content analysis not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ContentAnalysisDetailSerializer(analysis)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_content_analysis(request):
    """Trigger content analyses refresh in background."""
    max_urls = request.data.get('urls', request.data.get('max_urls', 50))
    target_url = (request.data.get('target_url') or '').strip()
    try:
        max_urls = int(max_urls)
    except (TypeError, ValueError):
        max_urls = 50
    max_urls = max(1, min(max_urls, 200))

    try:
        user_id = request.user.id

        def _background_refresh():
            try:
                background_user = User.objects.filter(id=user_id).first()
                if background_user is not None:
                    refresh_all_analyses(max_urls=max_urls, user=background_user, target_url=target_url)
            except Exception as exc:
                print(f"Content analysis background refresh failed: {exc}")

        thread = threading.Thread(target=_background_refresh, daemon=True)
        thread.start()

        return Response(
            {
                'message': 'Content analyses refresh started',
                'result': {
                    'started': True,
                    'max_urls': max_urls,
                    'target_url': target_url,
                },
            },
            status=status.HTTP_202_ACCEPTED,
        )
    except Exception as exc:
        return Response(
            {
                'error': 'Refresh failed',
                'message': str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ========================================
# AI ASSISTANT ENDPOINTS
# ========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def ai_chat(request):
    """
    AI Assistant Chat endpoint
    POST /api/ai/chat/
    Request body: {
        "message": "Quelle est la page avec le plus haut taux de rebond ?",
        "user_id": null (optional),
        "days": 30 (optional)
    }
    """
    serializer = AIChatMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Resolve user
        user_id = serializer.validated_data.get('user_id')
        user = resolve_google_user(request, user_id)
        
        message = serializer.validated_data.get('message')
        days = serializer.validated_data.get('days', 30)
        
        # Use Ollama (local, gratuit, illimité, sans quota)
        try:
            service = OllamaService()
            ai_response = service.analyze_seo_with_context(user, message, days)
            context = service.get_dashboard_context(user, days)
        except Exception as e:
            print(f'[Ollama error] {e}')
            raise RuntimeError(f'AI service error: {str(e)[:200]}')
        
        response_data = {
            'response': ai_response,
            'context_summary': {
                'sessions': context['analytics']['total_sessions'],
                'users': context['analytics']['total_users'],
                'page_views': context['analytics']['total_page_views'],
                'clicks': context['search_console']['total_clicks'],
                'impressions': context['search_console']['total_impressions'],
            },
            'timestamp': timezone.now()
        }
        
        response_serializer = AIChatResponseSerializer(data=response_data)
        response_serializer.is_valid(raise_exception=True)
        
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'AI Chat failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_quick_analysis(request):
    """
    Get quick AI analysis of dashboard
    GET /api/ai/quick-analysis/?user_id=1&days=30
    """
    try:
        user_id = request.GET.get('user_id')
        days = int(request.GET.get('days', 30))
        
        user = resolve_google_user(request, user_id)
        
        service = OllamaService()
        analysis = service.get_quick_analysis(user)
        context = service.get_dashboard_context(user, days)
        
        response_data = {
            'analysis': analysis,
            'dashboard_stats': {
                'sessions': context['analytics']['total_sessions'],
                'bounce_rate': context['analytics']['avg_bounce_rate'],
                'top_pages': context['analytics']['top_pages'][:3],
                'search_clicks': context['search_console']['total_clicks'],
                'avg_position': context['search_console']['avg_position'],
            }
        }
        
        response_serializer = AIQuickAnalysisSerializer(data=response_data)
        response_serializer.is_valid(raise_exception=True)
        
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Quick analysis failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def ai_dashboard_context(request):
    """
    Get raw dashboard context for AI analysis
    GET /api/ai/context/?user_id=1&days=30
    """
    try:
        user_id = request.GET.get('user_id')
        days = int(request.GET.get('days', 30))
        
        user = resolve_google_user(request, user_id)
        
        service = OllamaService()
        context = service.get_dashboard_context(user, days)
        
        return Response(context, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'error': 'Context retrieval failed',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
