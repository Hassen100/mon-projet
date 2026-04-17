"""Service pour intégration Ollama - Modèles gratuits locaux, avec fallback stub"""
import os
import re
import requests
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Sum, Avg, FloatField, Q
from django.db.models.functions import Coalesce
from .models import (
    GoogleAnalyticsData,
    GoogleSearchConsoleData,
    GoogleAnalyticsPageData,
    GoogleIntegrationConfig,
)
from .google_search_console_service import GoogleSearchConsoleService


class OllamaService:
    """Service AI utilisant Ollama (gratuit, local, illimité)"""
    
    def __init__(self):
        self.base_url = os.getenv('OLLAMA_HOST', 'http://localhost:11434').rstrip('/')
        self.model = os.getenv('OLLAMA_MODEL', 'mistral')
        self.timeout = 180  # Extended timeout for Ollama inference (orca-mini can be slow)

    def _is_greeting(self, question: str) -> bool:
        text = (question or '').strip().lower()
        if not text:
            return True

        greeting_tokens = {
            'hello', 'hi', 'hey', 'salut', 'bonjour', 'bonsoir', 'coucou', 'yo',
            'slt', 'bjr', 'wesh', 'cc'
        }
        clean = re.sub(r'[^a-zA-ZÀ-ÿ ]+', ' ', text)
        words = [w for w in clean.split() if w]

        # Short messages made only of greeting words should not trigger a full SEO analysis.
        return len(words) <= 3 and all(w in greeting_tokens for w in words)

    def _is_seo_query(self, question: str) -> bool:
        text = (question or '').strip().lower()
        if not text:
            return False

        seo_markers = {
            'seo', 'trafic', 'traffic', 'session', 'sessions', 'rebond', 'bounce',
            'position', 'serp', 'ctr', 'impression', 'impressions', 'clic', 'clicks',
            'analytics', 'search console', 'gsc', 'ga4', 'mot-cl', 'keyword',
            'requete', 'requêtes', 'conversion', 'backlink', 'maillage', 'crawl',
            'indexation', 'sitemap', 'robots', 'balise', 'meta', 'title', 'h1',
            'h2', 'contenu', 'page', 'pages', 'core web vitals', 'vitesse'
        }
        return any(marker in text for marker in seo_markers)

    def _is_technical_query(self, question: str) -> bool:
        text = (question or '').strip().lower()
        if not text:
            return False

        tech_markers = {
            'api', '500', '400', '401', '404', 'timeout', 'debug', 'bug', 'erreur',
            'exception', 'traceback', 'django', 'python', 'javascript', 'typescript',
            'angular', 'react', 'node', 'sql', 'database', 'docker', 'deploy', 'log'
        }
        return any(marker in text for marker in tech_markers)

    def _greeting_response(self) -> str:
        return (
            "Bonjour! Ravi de discuter avec vous. Je peux repondre en mode libre (questions generales/techniques) "
            "ou en mode SEO selon votre demande.\n\n"
            "Exemples:\n"
            "- Libre: Explique-moi Docker simplement.\n"
            "- Technique: Pourquoi mon API renvoie 500?\n"
            "- SEO: Quelles pages optimiser en premier?"
        )

    def _looks_like_valid_general_answer(self, text: str) -> bool:
        if not text or len(text.strip()) < 3:
            return False

        lowered = text.lower()
        bad_markers = [
            "je ne parle pas francais",
            "je ne parle pas français",
            "pas capable de fournir des réponses en anglais",
            "pas capable de fournir des reponses en anglais",
            "i do not speak french",
            "i can't speak french",
        ]
        return not any(marker in lowered for marker in bad_markers)

    def _fallback_general_answer(self, question: str) -> str:
        return (
            "Bien sur. Je peux repondre librement, y compris sur des sujets techniques, gratuitement en local via Ollama.\n\n"
            f"Votre message: {question}\n\n"
            "Si vous voulez, je peux aussi basculer en mode SEO pour analyser vos donnees du dashboard."
        )

    def _fallback_technical_answer(self, question: str) -> str:
        return (
            "D'accord, reponse technique rapide.\n\n"
            "Checklist de debug (ordre conseille):\n"
            "1) Reproduire l'erreur et noter le code HTTP exact + endpoint.\n"
            "2) Lire les logs backend au meme timestamp (stack trace complete).\n"
            "3) Verifier config/env (URL, token, base de donnees, cle API).\n"
            "4) Tester l'endpoint en direct (Postman/curl) avec payload minimal.\n"
            "5) Isoler la couche en panne: route, service, DB, appel externe.\n"
            "6) Corriger puis retester avec un cas nominal + un cas d'erreur.\n\n"
            f"Contexte detecte: {question}\n"
            "Si vous voulez, je peux vous donner un plan de debug cible pour votre erreur precise."
        )

    def _generate_general_chat(self, question: str) -> str:
        if self._is_greeting(question):
            if not self._is_available():
                return self._fallback_stub_response('greeting')
            return self._greeting_response()

        if self._is_technical_query(question):
            if not self._is_available():
                return self._fallback_stub_response('technical')
            return self._fallback_technical_answer(question)

        # Ollama general chat attempt
        if not self._is_available():
            return self._fallback_stub_response('general')

        prompt = f"""Tu es un assistant conversationnel utile, naturel et chaleureux.

REGLES:
- Reponds en francais.
- Reponds comme un vrai chat generaliste (style assistant IA moderne).
- Sois clair, poli et concret.
- Si la question n'est pas claire, pose une seule question de clarification.
- Ne force pas une analyse SEO si l'utilisateur n'en parle pas.

MESSAGE UTILISATEUR: {question}

Reponse:"""
        response = self._generate(prompt)
        if self._looks_like_valid_general_answer(response):
            return response
        return self._fallback_general_answer(question)

    def _looks_like_valid_seo_answer(self, text: str) -> bool:
        candidate = (text or '').upper()
        required = ['OBSERVATION', 'PROBLEME', 'ACTION', 'RESULTAT']
        has_sections = all(token in candidate for token in required)
        english_noise = 'AS AN AI ASSISTANT' in candidate
        return has_sections and not english_noise

    def _fallback_structured_answer(self, ga: dict, gsc: dict, question: str) -> str:
        sessions = int(ga.get('total_sessions', 0) or 0)
        users = int(ga.get('total_users', 0) or 0)
        views = int(ga.get('total_page_views', 0) or 0)
        bounce = float(ga.get('avg_bounce_rate', 0) or 0)
        clicks = int(gsc.get('total_clicks', 0) or 0)
        impressions = int(gsc.get('total_impressions', 0) or 0)
        ctr = float(gsc.get('avg_ctr', 0) or 0)
        position = float(gsc.get('avg_position', 0) or 0)

        return (
            "OBSERVATION:\n"
            f"- Sessions: {sessions}, Utilisateurs: {users}, Pages vues: {views}.\n"
            f"- Search Console: {clicks} clics, {impressions} impressions, CTR {ctr:.2f}%, position moyenne {position:.1f}.\n"
            f"- Taux de rebond moyen: {bounce:.1f}%.\n\n"
            "PROBLEME:\n"
            "- La visibilite SEO est limitee si les impressions/clics restent faibles.\n"
            "- Les opportunites de mots-cles sont insuffisamment exploitees.\n\n"
            "ACTION:\n"
            "- Prioriser 3 pages a fort potentiel et optimiser title/meta/H1 avec une intention de recherche claire.\n"
            "- Publier ou enrichir des contenus cibles sur des requetes longue traine liees a votre activite.\n"
            "- Mettre en place un suivi hebdomadaire: impressions, CTR, position, et pages d'entree.\n\n"
            "RESULTAT ATTENDU:\n"
            "- Hausse progressive des impressions et du CTR sur 2 a 4 semaines.\n"
            "- Meilleure priorisation des actions SEO selon les pages et requetes les plus prometteuses.\n\n"
            f"Contexte de la question: {question}"
        )
    
    def _is_available(self) -> bool:
        """Vérifier que Ollama est accessible"""
        try:
            resp = requests.get(f'{self.base_url}/api/tags', timeout=2)
            return resp.status_code == 200
        except Exception as e:
            print(f'[OllamaService] Ollama availability check failed: {e}')
            return False
    
    def _fallback_stub_response(self, prompt_type: str = 'general') -> str:
        """Fallback stub response when Ollama is unavailable (production mode)"""
        stubs = {
            'greeting': (
                "Bonjour! Je suis l'assistant SEO du dashboard.\n\n"
                "**Note**: En ce moment, je fonctionnne en mode local (Ollama).\n"
                "Les réponses détaillées seront disponibles quand Ollama sera activé localement.\n\n"
                "Je peux vous aider sur:\n"
                "- Mode libre: Questions générales/techniques\n"
                "- Mode SEO: Analyse de vos données (sessions, trafic, mots-clés)"
            ),
            'general': (
                "Merci pour votre question!\n\n"
                "**Mode maintenance**: L'assistant fonctionne actuellement en mode local.\n"
                "Pour une réponse complète, assurez-vous que Ollama est en cours d'exécution:\n\n"
                "```bash\nollama serve\n```\n\n"
                "En attendant, vous pouvez consulter le dashboard pour voir vos métriques SEO."
            ),
            'seo': (
                "Analyse SEO en attente.\n\n"
                "Pour obtenir une analyse détaillée de vos données SEO, "
                "assurez-vous que Ollama est actif localement.\n\n"
                "**Démarrage rapide**:\n"
                "1. Ouvrez un terminal\n"
                "2. Exécutez: `ollama serve`\n"
                "3. Attendez que le modèle se charge\n"
                "4. Réessayez votre requête"
            ),
            'technical': (
                "Réponse technique (mode maintenan).\n\n"
                "**Statut**: Ollama n'est pas accessible.\n\n"
                "**Solution rapide**:\n"
                "- **Localement**: Lancez `ollama serve` dans un terminal\n"
                "- **En production**: Configurez OLLAMA_HOST avec une URL distante ou utilisez une API cloud\n\n"
                "**Vérification**:\n"
                "curl http://localhost:11434/api/tags"
            ),
        }
        return stubs.get(prompt_type, stubs['general'])
    
    def _generate(self, prompt: str) -> str:
        """Générer une réponse avec Ollama, fallback stub si unavailable"""
        if self._is_available():
            try:
                payload = {
                    'model': self.model,
                    'prompt': prompt,
                    'stream': False,
                    'options': {
                        'temperature': 0.2,
                        'top_p': 0.9,
                        'repeat_penalty': 1.1,
                    },
                }
                
                resp = requests.post(
                    f'{self.base_url}/api/generate',
                    json=payload,
                    timeout=self.timeout
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    result = data.get('response', '').strip()
                    if result:
                        return result
                        
            except requests.Timeout:
                print(f'[OllamaService] Ollama timeout (>{self.timeout}s), using stub')
            except Exception as e:
                print(f'[OllamaService] Ollama error: {str(e)[:100]}, using stub')
        else:
            print('[OllamaService] Ollama not available, using stub response')
        
        # Fallback to stub (maintenance mode)
        return self._fallback_stub_response('general')

    def _resolve_data_user(self, user: User) -> User:
        # Keep assistant behavior aligned with dashboard fallback logic.
        config = GoogleIntegrationConfig.objects.select_related('user').filter(user=user).first()
        if config:
            return user

        fallback_config = GoogleIntegrationConfig.objects.select_related('user').first()
        if fallback_config:
            return fallback_config.user

        if (
            GoogleSearchConsoleData.objects.filter(user=user).exists()
            or GoogleAnalyticsData.objects.filter(user=user).exists()
            or GoogleAnalyticsPageData.objects.filter(user=user).exists()
        ):
            return user

        recent_gsc_user_id = GoogleSearchConsoleData.objects.order_by('-date').values_list('user_id', flat=True).first()
        if recent_gsc_user_id:
            fallback_user = User.objects.filter(id=recent_gsc_user_id).first()
            if fallback_user:
                return fallback_user

        recent_ga_user_id = GoogleAnalyticsData.objects.order_by('-date').values_list('user_id', flat=True).first()
        if recent_ga_user_id:
            fallback_user = User.objects.filter(id=recent_ga_user_id).first()
            if fallback_user:
                return fallback_user

        return user

    def _refresh_gsc_snapshot(self, user: User, days: int):
        config = GoogleIntegrationConfig.objects.filter(user=user).first()

        gsc_site_url = ''
        gsc_credentials = {}

        if config:
            gsc_site_url = (config.gsc_site_url or '').strip()
            gsc_credentials = config.gsc_credentials_json or {}

        if not gsc_site_url:
            gsc_site_url = (getattr(settings, 'GSC_SITE_URL', '') or '').strip()

        if not gsc_credentials:
            gsc_credentials = getattr(settings, 'GSC_CREDENTIALS', {}) or {}

        if not gsc_site_url or not gsc_credentials:
            return

        try:
            service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
            service.save_search_data(user, days=max(days, 1), mode='period')
        except Exception:
            # Silent fallback to DB-only mode when live refresh is unavailable.
            pass

    def _get_effective_gsc_config(self, user: User):
        config = GoogleIntegrationConfig.objects.filter(user=user).first()
        if not config:
            config = GoogleIntegrationConfig.objects.first()

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

    def _load_live_gsc_data(self, user: User, days: int):
        gsc_site_url, gsc_credentials = self._get_effective_gsc_config(user)
        if not gsc_site_url or not gsc_credentials:
            return None, []

        try:
            service = GoogleSearchConsoleService(gsc_credentials, gsc_site_url)
            totals = service.get_search_data(days=max(days, 1), mode='period')
            top_queries = service.get_top_queries(limit=5, days=max(days, 1), mode='period')
            return totals, top_queries
        except Exception:
            return None, []
    
    def get_dashboard_context(self, user: User, days: int = 30):
        """Récupère données SEO pour contexte"""
        data_user = self._resolve_data_user(user)
        live_gsc_totals, live_top_queries = self._load_live_gsc_data(data_user, days)

        start_date = datetime.now().date() - timedelta(days=days)
        
        # Analytics agrégées
        ga_totals = GoogleAnalyticsData.objects.filter(
            user=data_user, date__gte=start_date
        ).aggregate(
            sessions=Coalesce(Sum('sessions'), 0, output_field=FloatField()),
            users=Coalesce(Sum('active_users'), 0, output_field=FloatField()),
            views=Coalesce(Sum('screen_page_views'), 0, output_field=FloatField()),
            bounce=Coalesce(Avg('bounce_rate'), 0.0, output_field=FloatField()),
        )
        
        # Top pages
        page_data = GoogleAnalyticsPageData.objects.filter(
            user=data_user, date__gte=start_date
        ).values('page_path').annotate(
            total_views=Coalesce(Sum('screen_page_views'), 0, output_field=FloatField()),
        ).order_by('-total_views')[:5]
        
        # Search Console (DB fallback)
        db_gsc_totals = GoogleSearchConsoleData.objects.filter(
            user=data_user, date__gte=start_date
        ).aggregate(
            clicks=Coalesce(Sum('clicks'), 0, output_field=FloatField()),
            impressions=Coalesce(Sum('impressions'), 0, output_field=FloatField()),
            ctr=Coalesce(Avg('ctr'), 0.0, output_field=FloatField()),
            position=Coalesce(Avg('position'), 0.0, output_field=FloatField()),
        )
        
        db_top_queries = GoogleSearchConsoleData.objects.filter(
            user=data_user, date__gte=start_date
        ).values('query').annotate(
            clicks=Coalesce(Sum('clicks'), 0, output_field=FloatField()),
        ).order_by('-clicks')[:5]

        use_live = bool(live_gsc_totals) and (
            float(live_gsc_totals.get('clicks', 0) or 0) > 0
            or float(live_gsc_totals.get('impressions', 0) or 0) > 0
        )

        if use_live:
            gsc_totals = {
                'clicks': float(live_gsc_totals.get('clicks', 0) or 0),
                'impressions': float(live_gsc_totals.get('impressions', 0) or 0),
                'ctr': float(live_gsc_totals.get('ctr', 0) or 0),
                'position': float(live_gsc_totals.get('position', 0) or 0),
            }
            top_queries = live_top_queries or [
                {'query': item['query'], 'clicks': item['clicks']}
                for item in db_top_queries
            ]
        else:
            gsc_totals = db_gsc_totals
            top_queries = [
                {'query': item['query'], 'clicks': item['clicks']}
                for item in db_top_queries
            ]
        
        return {
            'analytics': {
                'total_sessions': ga_totals['sessions'],
                'total_users': ga_totals['users'],
                'total_page_views': ga_totals['views'],
                'avg_bounce_rate': ga_totals['bounce'],
                'top_pages': [
                    {
                        'page': p['page_path'],
                        'views': p['total_views'],
                    }
                    for p in page_data
                ]
            },
            'search_console': {
                'total_clicks': gsc_totals['clicks'],
                'total_impressions': gsc_totals['impressions'],
                'avg_ctr': gsc_totals['ctr'] * 100,
                'avg_position': gsc_totals['position'],
            },
            'top_pages': list(page_data),
            'top_queries': list(top_queries),
            'period_days': days,
        }
    
    def analyze_seo_with_context(self, user: User, question: str, days: int = 30) -> str:
        """Mode hybride: chat libre pour messages generaux, SEO structure pour requetes SEO."""

        if self._is_greeting(question) or not self._is_seo_query(question):
            return self._generate_general_chat(question)
        
        # Check if Ollama is available for SEO analysis
        if not self._is_available():
            return self._fallback_stub_response('seo')
        
        context = self.get_dashboard_context(user, days)
        ga = context['analytics']
        gsc = context['search_console']
        
        top_pages_text = '\n'.join(
            [f"  - {p['page']}: {int(p['views'])} vues" 
             for p in ga.get('top_pages', [])]
        ) or "  Aucune donnée"
        
        top_queries_text = '\n'.join(
            [f"  - {q.get('query', 'N/A')}: {int(q.get('clicks', 0))} clicks" 
             for q in context.get('top_queries', [])]
        ) or "  Aucune donnée"
        
        system_prompt = """Tu es un expert SEO francophone. Tu dois repondre uniquement a partir des donnees fournies.

    REGLES STRICTES:
    1) N'invente aucun chiffre, aucune tendance, aucun pourcentage.
    2) Si une information manque, ecris exactement: Donnee non disponible.
    3) Reponds en francais clair, avec phrases courtes.
    4) Reste centre sur le SEO et la question de l'utilisateur.

    FORMAT OBLIGATOIRE:
    OBSERVATION:
    - 2 a 4 points factuels bases sur les donnees.

    PROBLEME:
    - 1 a 3 risques/priorites SEO reels.

    ACTION:
    - 3 actions concretes, priorisees, mesurables.

    RESULTAT ATTENDU:
    - 2 resultats attendus relies aux actions.
    """

        prompt = f"""{system_prompt}

DONNÉES ACTUELLES ({days} derniers jours):

Analytics:
- Sessions: {int(ga['total_sessions'])}
- Utilisateurs: {int(ga['total_users'])}
- Page views: {int(ga['total_page_views'])}
- Taux rebond: {ga['avg_bounce_rate']:.1f}%

Meilleures pages:
{top_pages_text}

Search Console:
- Clics: {int(gsc['total_clicks'])}
- Impressions: {int(gsc['total_impressions'])}
- CTR: {gsc['avg_ctr']:.2f}%
- Position moyenne: {gsc['avg_position']:.1f}

Top requêtes:
{top_queries_text}

QUESTION DE L'UTILISATEUR: {question}

Reponds strictement au format demande."""

        response = self._generate(prompt)
        if not response:
            return (
                "OBSERVATION:\n"
                "- Donnee non disponible pour produire une reponse fiable.\n\n"
                "PROBLEME:\n"
                "- Le modele n'a pas retourne de contenu.\n\n"
                "ACTION:\n"
                "- Reessayer la requete.\n"
                "- Verifier que le modele Ollama est bien charge.\n"
                "- Poser une question SEO plus precise.\n\n"
                "RESULTAT ATTENDU:\n"
                "- Reponse exploitable et actionnable au prochain essai."
            )
        if not self._looks_like_valid_seo_answer(response):
            return self._fallback_structured_answer(ga, gsc, question)

        return response
    
    def get_quick_analysis(self, user: User, days: int = 30) -> str:
        """Analyse rapide Ollama"""
        context = self.get_dashboard_context(user, days)
        ga = context['analytics']
        gsc = context['search_console']
        
        prompt = f"""Résumé SEO ultra-rapide, 4 points clés en français:

Sessions: {int(ga['total_sessions'])}
Utilisateurs: {int(ga['total_users'])}
Clics GSC: {int(gsc['total_clicks'])}
Position: {gsc['avg_position']:.1f}

Format: 1 emoji + phrase courte par point."""

        return self._generate(prompt)
