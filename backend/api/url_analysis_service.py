from datetime import datetime, timedelta
from django.utils import timezone
from .models_url import URLAnalysisData, URLPageData, URLKeywordData
import random

class URLAnalysisService:
    """Service pour analyser des URLs et générer des données réalistes"""
    
    def __init__(self, url: str):
        self.url = url.rstrip('/')
        self.domain = self._extract_domain(url)
    
    def _extract_domain(self, url: str) -> str:
        """Extrait le domaine d'une URL"""
        if '://' in url:
            return url.split('://')[1].split('/')[0]
        return url.split('/')[0]
    
    def generate_realistic_data(self, user, period: int = 30):
        """Génère des données réalistes pour l'URL"""
        
        # Simulation de données basées sur le domaine et la période
        base_sessions = random.randint(50, 500)
        base_users = random.randint(30, 400)
        base_page_views = random.randint(200, 2000)
        
        # Ajustement selon la période
        period_factor = min(period / 30, 2.0)
        sessions = int(base_sessions * period_factor)
        users = int(base_users * period_factor)
        page_views = int(base_page_views * period_factor)
        bounce_rate = round(random.uniform(25, 75), 2)
        
        # Créer l'enregistrement principal
        analysis_data = URLAnalysisData.objects.create(
            user=user,
            url=self.url,
            sessions=sessions,
            users=users,
            page_views=page_views,
            bounce_rate=bounce_rate,
            date=timezone.now().date()
        )
        
        # Générer les pages les plus visitées
        self._generate_page_data(analysis_data, page_views)
        
        # Générer les mots-clés
        self._generate_keyword_data(analysis_data, sessions)
        
        return {
            'url': self.url,
            'period': period,
            'sessions': sessions,
            'users': users,
            'page_views': page_views,
            'bounce_rate': bounce_rate,
            'top_pages': self._get_top_pages(analysis_data),
            'top_keywords': self._get_top_keywords(analysis_data),
            'last_updated': analysis_data.updated_at,
            'data_points': 1
        }
    
    def _generate_page_data(self, analysis_data: URLAnalysisData, total_views: int):
        """Génère les données des pages"""
        pages = [
            '/',
            '/about',
            '/contact',
            '/services',
            '/blog',
            '/products',
            '/portfolio',
            '/team',
            '/faq',
            '/pricing'
        ]
        
        # Distribuer les vues sur les pages
        remaining_views = total_views
        for i, page in enumerate(pages):
            if remaining_views <= 0:
                break
                
            # Plus de vues pour la page d'accueil
            if page == '/':
                views = random.randint(int(total_views * 0.3), int(total_views * 0.5))
            else:
                views = random.randint(int(remaining_views * 0.05), int(remaining_views * 0.2))
            
            views = min(views, remaining_views)
            sessions = max(1, int(views * random.uniform(0.3, 0.7)))
            
            URLPageData.objects.create(
                url_analysis=analysis_data,
                page_path=page,
                views=views,
                sessions=sessions
            )
            
            remaining_views -= views
    
    def _generate_keyword_data(self, analysis_data: URLAnalysisData, total_sessions: int):
        """Génère les données de mots-clés"""
        # Mots-clés basés sur le domaine
        base_keywords = [
            f"site {self.domain}",
            f"{self.domain} services",
            f"best {self.domain.split('.')[0]}",
            f"{self.domain} reviews",
            f"{self.domain} pricing",
            f"{self.domain} contact",
            f"{self.domain} portfolio",
            f"professional {self.domain.split('.')[0]}",
            f"{self.domain} solutions"
        ]
        
        # Ajouter des mots-clés génériques
        generic_keywords = [
            "web development",
            "digital marketing",
            "SEO services",
            "online business",
            "website design",
            "e-commerce solutions",
            "digital transformation",
            "online presence",
            "business website",
            "professional services"
        ]
        
        all_keywords = base_keywords + generic_keywords
        
        # Distribuer les clics sur les mots-clés
        remaining_clicks = max(1, int(total_sessions * 0.4))  # 40% des sessions deviennent des clics
        
        for keyword in all_keywords[:15]:  # Top 15 mots-clés
            if remaining_clicks <= 0:
                break
                
            clicks = random.randint(0, min(remaining_clicks, 50))
            impressions = max(clicks * 2, random.randint(50, 500))
            ctr = round((clicks / impressions) * 100, 2) if impressions > 0 else 0
            position = random.randint(1, 50)
            
            URLKeywordData.objects.create(
                url_analysis=analysis_data,
                keyword=keyword,
                clicks=clicks,
                impressions=impressions,
                ctr=ctr,
                position=position
            )
            
            remaining_clicks -= clicks
    
    def _get_top_pages(self, analysis_data: URLAnalysisData):
        """Récupère les pages les plus visitées"""
        pages = URLPageData.objects.filter(url_analysis=analysis_data)[:10]
        return [
            {
                'page_path': page.page_path,
                'views': page.views,
                'sessions': page.sessions
            }
            for page in pages
        ]
    
    def _get_top_keywords(self, analysis_data: URLAnalysisData):
        """Récupère les mots-clés les plus performants"""
        keywords = URLKeywordData.objects.filter(url_analysis=analysis_data)[:10]
        return [
            {
                'keyword': keyword.keyword,
                'position': keyword.position,
                'clicks': keyword.clicks,
                'impressions': keyword.impressions,
                'ctr': f"{keyword.ctr:.2f}%"
            }
            for keyword in keywords
        ]
