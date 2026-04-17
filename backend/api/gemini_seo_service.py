"""
Service pour l'intégration Gemini AI comme assistant SEO expert
"""
import os
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Sum, Avg, FloatField
from django.db.models import Q
from django.db.models.functions import Coalesce
import google.generativeai as genai
from .models import (
    GoogleAnalyticsData,
    GoogleAnalyticsPageData,
    GoogleSearchConsoleData,
)
from .google_analytics_service import GoogleAnalyticsService
from .google_search_console_service import GoogleSearchConsoleService
from .models_url import URLAnalysisData


class GeminiSEOService:
    """Service expert SEO utilisant Gemini AI"""
    
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', '')
        genai.configure(api_key=api_key)
        self.force_fallback = (os.getenv('AI_FORCE_FALLBACK', 'false').strip().lower() == 'true')
        self.quota_cooldown_until = None
        self.model_names = [
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash',
        ]
        self.model = genai.GenerativeModel(self.model_names[0])

    def _is_quota_or_capacity_error(self, exc: Exception) -> bool:
        text = f"{type(exc).__name__} {exc}".lower()
        markers = [
            'resourceexhausted',
            'quota',
            '429',
            'high demand',
            '503',
            'deadline',
            'timed out',
            'retryerror',
        ]
        return any(marker in text for marker in markers)

    def _in_cooldown(self) -> bool:
        return self.quota_cooldown_until is not None and datetime.now() < self.quota_cooldown_until

    def _generate_with_failover(self, prompt: str):
        if self.force_fallback:
            raise RuntimeError('Gemini disabled by AI_FORCE_FALLBACK=true')

        if self._in_cooldown():
            raise RuntimeError('Gemini temporarily disabled due quota/capacity cooldown')

        last_error = None
        for model_name in self.model_names:
            try:
                response = genai.GenerativeModel(model_name).generate_content(prompt)
                if response and getattr(response, 'text', None):
                    return response.text
            except Exception as exc:
                last_error = exc
                if self._is_quota_or_capacity_error(exc):
                    # Avoid hammering Gemini while quota/capacity is exhausted.
                    self.quota_cooldown_until = datetime.now() + timedelta(minutes=10)
                continue

        if last_error is not None:
            raise last_error

        raise RuntimeError('No Gemini model returned a response.')
        
    def get_dashboard_context(self, user: User, days: int = 30):
        """Récupère le contexte complet du dashboard pour le contexte SEO"""

        data_user = self._resolve_data_user(user, days)

        # Google Analytics - données agrégées
        start_date = datetime.now().date() - timedelta(days=days)

        ga_data = GoogleAnalyticsData.objects.filter(
            user=data_user,
            date__gte=start_date
        ).order_by('date')
        
        ga_totals = ga_data.aggregate(
            total_sessions=Coalesce(Sum('sessions'), 0, output_field=FloatField()),
            total_users=Coalesce(Sum('active_users'), 0, output_field=FloatField()),
            total_views=Coalesce(Sum('screen_page_views'), 0, output_field=FloatField()),
            avg_bounce=Coalesce(Avg('bounce_rate'), 0.0, output_field=FloatField()),
        )
        
        # Données par page
        page_data = GoogleAnalyticsPageData.objects.filter(
            user=data_user,
            date__gte=start_date
        ).values('page_path').annotate(
            total_views=Coalesce(Sum('screen_page_views'), 0, output_field=FloatField()),
            total_sessions=Coalesce(Sum('sessions'), 0, output_field=FloatField())
        ).order_by('-total_views')[:10]
        
        # Google Search Console
        search_data = GoogleSearchConsoleData.objects.filter(
            user=data_user,
            date__gte=start_date
        )
        
        search_totals = search_data.aggregate(
              total_clicks=Coalesce(Sum('clicks'), 0, output_field=FloatField()),
              total_impressions=Coalesce(Sum('impressions'), 0, output_field=FloatField()),
              avg_ctr=Coalesce(Avg('ctr'), 0.0, output_field=FloatField()),
              avg_position=Coalesce(Avg('position'), 0.0, output_field=FloatField()),
        )
        
        # Top queries
        top_queries = search_data.values('query').annotate(
            clicks=Coalesce(Sum('clicks'), 0, output_field=FloatField()),
            impressions=Coalesce(Sum('impressions'), 0, output_field=FloatField()),
            ctr=Coalesce(Avg('ctr'), 0.0, output_field=FloatField()),
            position=Coalesce(Avg('position'), 0.0, output_field=FloatField()),
        ).order_by('-clicks')[:10]
        
        # Détection des anomalies de trafic
        anomalies = self._detect_traffic_anomalies(ga_data)
        
        # URL Analysis Data
        url_issues = URLAnalysisData.objects.filter(user=data_user).order_by('-created_at')[:20]
        
        context = {
            'period_days': days,
            'analytics': {
                'total_sessions': ga_totals['total_sessions'] or 0,
                'total_users': ga_totals['total_users'] or 0,
                'total_page_views': ga_totals['total_views'] or 0,
                'avg_bounce_rate': round(float(ga_totals['avg_bounce'] or 0), 2),
                'top_pages': [
                    {
                        'page': item['page_path'],
                        'views': item['total_views'],
                        'sessions': item['total_sessions'],
                    }
                    for item in page_data
                ],
            },
            'search_console': {
                'total_clicks': search_totals['total_clicks'] or 0,
                'total_impressions': search_totals['total_impressions'] or 0,
                'avg_ctr': round(float(search_totals['avg_ctr'] or 0) * 100, 2),
                'avg_position': round(float(search_totals['avg_position'] or 0), 1),
                'top_queries': [
                    {
                        'query': item['query'],
                        'clicks': item['clicks'],
                        'impressions': item['impressions'],
                        'ctr': round(float(item['ctr'] or 0) * 100, 2),
                        'position': round(float(item['position'] or 0), 1),
                    }
                    for item in top_queries
                ] if top_queries else 'Aucune donnée disponible',
            },
            'anomalies': anomalies,
            'url_issues': [
                {
                    'url': issue.url,
                    'status_code': issue.status_code,
                    'title_length': issue.title_length,
                    'meta_length': issue.meta_description_length,
                    'issues': issue.identified_issues,
                }
                for issue in url_issues
            ][:10],
            'data_user_id': data_user.id,
        }
        
        return context

    def _resolve_data_user(self, user: User, days: int) -> User:
        if self._has_data(user, days):
            return user

        # Prefer immediate fallback to an existing user with significant data
        # to keep AI responses fast, then try live refresh only if absolutely needed.
        fallback_user = self._find_user_with_data(days)
        if fallback_user is not None:
            return fallback_user

        self._refresh_from_google(user, days)
        if self._has_data(user, days):
            return user

        return user

    def _has_data(self, user: User, days: int) -> bool:
        start_date = datetime.now().date() - timedelta(days=days)
        ga_exists = GoogleAnalyticsData.objects.filter(
            user=user,
            date__gte=start_date,
        ).filter(
            Q(sessions__gt=0) | Q(active_users__gt=0) | Q(screen_page_views__gt=0)
        ).exists()
        gsc_exists = GoogleSearchConsoleData.objects.filter(
            user=user,
            date__gte=start_date,
        ).filter(
            Q(clicks__gt=0) | Q(impressions__gt=0)
        ).exists()
        ga_pages_exists = GoogleAnalyticsPageData.objects.filter(
            user=user,
            date__gte=start_date,
        ).filter(
            Q(screen_page_views__gt=0) | Q(sessions__gt=0)
        ).exists()
        if ga_exists or gsc_exists or ga_pages_exists:
            return True

        # Fallback to any historical snapshot when the selected period is empty.
        return (
            GoogleAnalyticsData.objects.filter(user=user).filter(
                Q(sessions__gt=0) | Q(active_users__gt=0) | Q(screen_page_views__gt=0)
            ).exists()
            or GoogleSearchConsoleData.objects.filter(user=user).filter(
                Q(clicks__gt=0) | Q(impressions__gt=0)
            ).exists()
            or GoogleAnalyticsPageData.objects.filter(user=user).filter(
                Q(screen_page_views__gt=0) | Q(sessions__gt=0)
            ).exists()
        )

    def _find_user_with_data(self, days: int):
        start_date = datetime.now().date() - timedelta(days=days)

        ga_user_id = GoogleAnalyticsData.objects.filter(date__gte=start_date).order_by('-date').values_list('user_id', flat=True).first()
        if ga_user_id:
            return User.objects.filter(id=ga_user_id).first()

        gsc_user_id = GoogleSearchConsoleData.objects.filter(date__gte=start_date).order_by('-date').values_list('user_id', flat=True).first()
        if gsc_user_id:
            return User.objects.filter(id=gsc_user_id).first()

        # If no data in current period, fallback to the most recent historical snapshot.
        any_ga_user_id = GoogleAnalyticsData.objects.order_by('-date').values_list('user_id', flat=True).first()
        if any_ga_user_id:
            return User.objects.filter(id=any_ga_user_id).first()

        any_gsc_user_id = GoogleSearchConsoleData.objects.order_by('-date').values_list('user_id', flat=True).first()
        if any_gsc_user_id:
            return User.objects.filter(id=any_gsc_user_id).first()

        return None

    def _refresh_from_google(self, user: User, days: int):
        # Try best-effort refresh from configured environment credentials.
        try:
            ga_property_id = (getattr(settings, 'GA_PROPERTY_ID', '') or '').strip()
            ga_credentials = getattr(settings, 'GA_CREDENTIALS', {}) or {}
            if ga_property_id and ga_credentials:
                ga_service = GoogleAnalyticsService(ga_credentials, ga_property_id)
                ga_service.save_analytics_data(user, days=max(days, 1), mode='period')
        except Exception:
            pass

        try:
            gsc_site_url = (getattr(settings, 'GSC_SITE_URL', '') or '').strip()
            gsc_credentials = getattr(settings, 'GSC_CREDENTIALS', {}) or {}
            if gsc_site_url and gsc_credentials:
                gsc_service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
                gsc_service.save_search_data(user, days=max(days, 1), mode='period')
        except Exception:
            pass
    
    def _detect_traffic_anomalies(self, ga_data):
        """Détecte les anomalies dans le trafic"""
        anomalies = []
        
        data_list = list(ga_data)
        if len(data_list) < 2:
            return anomalies
        
        for i in range(1, len(data_list)):
            current = data_list[i]
            previous = data_list[i-1]
            
            if previous.sessions > 0:
                change_pct = ((current.sessions - previous.sessions) / previous.sessions) * 100
                
                if change_pct < -50:
                    anomalies.append({
                        'type': 'chute_de_trafic',
                        'date': current.date.isoformat(),
                        'sessions_avant': previous.sessions,
                        'sessions_apres': current.sessions,
                        'changement_pct': round(change_pct, 1),
                    })
                elif change_pct > 50:
                    anomalies.append({
                        'type': 'pic_de_trafic',
                        'date': current.date.isoformat(),
                        'sessions_avant': previous.sessions,
                        'sessions_apres': current.sessions,
                        'changement_pct': round(change_pct, 1),
                    })
        
        return anomalies
    
    def analyze_seo_with_context(self, user: User, user_question: str, days: int = 30):
        """
        Analyze SEO data with Gemini AI
        Returns expert recommendations in French
        """
        
        dashboard_context = self.get_dashboard_context(user, days)
        
        system_prompt = """Tu es un expert SEO français spécialisé dans l'optimisation moteur de recherche.
Tu analyses les données du dashboard SEO "Pulse Board" et fournis des recommandations d'optimisation précises.

CATÉGORIES D'ANALYSE :
1. 📄 PAGES À PROBLÈME : taux de rebond, durée, trafic entrant
2. 🔍 OPPORTUNITÉS DE MOTS-CLÉS : positions 4-15 (quick wins), CTR faible
3. 📉 ANOMALIES DE TRAFIC : chutes/pics anormaux, tendances
4. ⚙️ OPTIMISATION TECHNIQUE : Core Web Vitals, PageSpeed, mobile

PRIORITÉS :
🔴 URGENT    → Action immédiate
🟡 IMPORTANT → Cette semaine
🟢 OPTIONNEL → Long terme

FORMAT DE RÉPONSE :
📊 OBSERVATION : [données observées]
⚠️  PROBLÈME    : [ce qui ne va pas]
✅ ACTION       : [étape concrète]
📈 RÉSULTAT     : [amélioration attendue]

RÈGLES :
- Toujours répondre en français
- Utiliser uniquement les vraies données fournies
- Si une URL contient une faute ("detaail" au lieu de "detail"), la signaler comme erreur
- Si "Aucune donnée disponible", expliquer comment la corriger
- Sois direct, concis et actionnable
- NE JAMAIS demander à l'utilisateur de "fournir plus de données".
- Si les métriques sont à 0, proposer quand même un plan d'action concret en 4 points
    (quick wins SEO, optimisations techniques, contenu, suivi KPI) avec priorités.

Données du dashboard (30 derniers jours) :
""" + json.dumps(dashboard_context, indent=2, ensure_ascii=False)
        
        # Send to Gemini
        message = system_prompt + "\n\nQuestion de l'utilisateur : " + user_question
        
        try:
            ai_text = self._generate_with_failover(message)
            return self._sanitize_ai_response(ai_text, dashboard_context, user_question)
        except Exception:
            # Fallback to deterministic advice when Gemini is unavailable.
            pass

        return self._build_fallback_response(dashboard_context, user_question)
    
    def get_quick_analysis(self, user: User):
        """Retourne une analyse rapide du dashboard"""
        
        dashboard_context = self.get_dashboard_context(user)
        
        prompt = f"""Analyse rapidement ces données SEO et donne un résumé exécutif en 3-4 points clés.

Données : {json.dumps(dashboard_context, indent=2, ensure_ascii=False)}

Format attendu:
1. [Principal insight avec emoji]
2. [Action prioritaire]
3. [Opportunité rapide]
4. [Tendance à surveiller]"""
        
        try:
            return self._generate_with_failover(prompt)
        except Exception:
            pass

        analytics = dashboard_context.get('analytics', {})
        search = dashboard_context.get('search_console', {})
        top_pages = analytics.get('top_pages', [])

        first_page = top_pages[0]['page'] if top_pages else 'Aucune page dominante'
        return (
            "1. 📊 Trafic observé : "
            f"{int(float(analytics.get('total_sessions', 0)))} sessions et "
            f"{int(float(analytics.get('total_users', 0)))} utilisateurs.\n"
            "2. ✅ Action prioritaire : optimiser la page la plus vue pour améliorer conversion et engagement.\n"
            f"3. 🔍 Opportunité rapide : travailler la page '{first_page}' et enrichir ses mots-clés longue traîne.\n"
            "4. 📈 Tendance à surveiller : CTR et position moyenne Search Console "
            f"({search.get('avg_ctr', 0)}% / {search.get('avg_position', 0)})."
        )

    def _build_fallback_response(self, context: dict, user_question: str) -> str:
        analytics = context.get('analytics', {})
        search = context.get('search_console', {})
        anomalies = context.get('anomalies', [])
        top_pages = analytics.get('top_pages', [])

        top_page = top_pages[0] if top_pages else None
        top_page_text = (
            f"{top_page.get('page')} ({int(float(top_page.get('views', 0)))} vues)"
            if top_page else "Aucune page dominante détectée"
        )

        anomaly_text = "Aucune anomalie majeure détectée"
        if anomalies:
            first = anomalies[0]
            anomaly_text = (
                f"{first.get('type', 'anomalie')} le {first.get('date', 'date inconnue')} "
                f"({first.get('changement_pct', 0)}%)"
            )

        return (
            "📊 OBSERVATION : "
            f"{int(float(analytics.get('total_sessions', 0)))} sessions, "
            f"{int(float(analytics.get('total_users', 0)))} utilisateurs, "
            f"{int(float(search.get('total_clicks', 0)))} clics SEO.\n\n"
            "⚠️ PROBLÈME : réponse Gemini indisponible temporairement.\n"
            f"Question reçue : {user_question}\n"
            f"Signal principal : {anomaly_text}.\n\n"
            "✅ ACTION : prioriser l'optimisation de la page la plus visible "
            f"({top_page_text}), puis améliorer titres/meta pour booster CTR.\n\n"
            "📈 RÉSULTAT : récupération d'un diagnostic immédiat, avec relance IA complète au prochain essai."
        )

    def _sanitize_ai_response(self, text: str, context: dict, user_question: str) -> str:
        lower_text = (text or '').lower()
        asks_for_data = any(
            marker in lower_text
            for marker in [
                'veuillez me fournir',
                'fournir les données',
                'transmis ces informations',
                'aucune donnée disponible',
                'impossible d\'identifier',
            ]
        )

        analytics = context.get('analytics', {})
        search = context.get('search_console', {})
        has_significant_data = any(
            [
                float(analytics.get('total_sessions', 0) or 0) > 0,
                float(analytics.get('total_users', 0) or 0) > 0,
                float(analytics.get('total_page_views', 0) or 0) > 0,
                float(search.get('total_clicks', 0) or 0) > 0,
                float(search.get('total_impressions', 0) or 0) > 0,
            ]
        )

        if asks_for_data and not has_significant_data:
            return self._build_no_data_action_plan(user_question)

        return text

    def _build_no_data_action_plan(self, user_question: str) -> str:
        return (
            "📊 OBSERVATION : les métriques collectées sont actuellement très faibles (proches de 0), "
            "ce qui limite l'analyse statistique directe.\n\n"
            "⚠️ PROBLÈME : l'absence de volume masque les vrais quick wins (positions, CTR, pages à rebond élevé).\n\n"
            "✅ ACTION :\n"
            "1) 🔴 URGENT (technique) : auditer les 10 pages principales (title, H1, meta description, canonicals, sitemap, indexation).\n"
            "2) 🟡 IMPORTANT (contenu) : publier 3 pages ciblant des requêtes longue traîne avec intention claire.\n"
            "3) 🟡 IMPORTANT (CTR) : réécrire titles/meta des pages clés avec bénéfice utilisateur + mot-clé principal.\n"
            "4) 🟢 OPTIONNEL (suivi) : suivre hebdomadairement impressions, CTR et positions 4-15 pour détecter les quick wins.\n\n"
            f"🎯 Focus question : {user_question}\n"
            "- Si tu vises les positions 4-8: priorise les requêtes avec forte impression et CTR inférieur à la moyenne, "
            "puis optimise title/H2/FAQ sur la page associée.\n\n"
            "📈 RÉSULTAT : plan immédiatement exécutable, même avec peu de données, pour générer du signal SEO exploitable dans les prochains jours."
        )
