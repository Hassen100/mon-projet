#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from django.conf import settings
from django.contrib.auth.models import User
from api.google_analytics_service import GoogleAnalyticsService
from api.google_search_console_service import GoogleSearchConsoleService
from api.models import GoogleAnalyticsPageData, GoogleSearchConsoleData, GoogleSearchConsolePageData


class AutoSyncService:
    """Service de synchronisation automatique des données Google."""

    def __init__(self):
        self.ga_service = None
        self.gsc_service = None

    def initialize_services(self):
        """Initialise les services Google."""
        try:
            if settings.GA_CREDENTIALS and settings.GA_PROPERTY_ID:
                self.ga_service = GoogleAnalyticsService(
                    credentials_json=settings.GA_CREDENTIALS,
                    property_id=settings.GA_PROPERTY_ID,
                )
                print("Service Google Analytics initialise")

            if settings.GSC_CREDENTIALS and settings.GSC_SITE_URL:
                self.gsc_service = GoogleSearchConsoleService(
                    credentials_json=settings.GSC_CREDENTIALS,
                    site_url=settings.GSC_SITE_URL,
                )
                print("Service Google Search Console initialise")

        except Exception as e:
            print(f"Erreur lors de l'initialisation des services: {e}")

    def sync_analytics_data(self, user, days=7):
        """Synchronise un vrai snapshot du jour pour Google Analytics."""
        if not self.ga_service:
            print("Service Google Analytics non disponible")
            return False

        try:
            analytics_data = self.ga_service.save_analytics_data(user, days=1)
            print(f"Donnees Analytics du jour mises a jour pour {user.username}: {analytics_data}")
            return True

        except Exception as e:
            print(f"Erreur lors de la synchronisation Analytics: {e}")
            return False

    def sync_analytics_pages(self, user, days=7):
        """Compatibilite conservée: les pages sont déjà gérées par save_analytics_data."""
        if not self.ga_service:
            return

        try:
            pages_data = self.ga_service.get_top_pages(limit=20, days=1)
            today = datetime.now().date()

            for page_data in pages_data:
                GoogleAnalyticsPageData.objects.update_or_create(
                    user=user,
                    page_path=page_data.get('page_path', ''),
                    date=today,
                    defaults={
                        'screen_page_views': page_data.get('views', 0),
                        'sessions': page_data.get('sessions', 0),
                    },
                )

            print(f"Pages Analytics synchronisees: {len(pages_data)} pages")

        except Exception as e:
            print(f"Erreur lors de la synchronisation des pages: {e}")

    def sync_search_console_data(self, user, days=7):
        """Synchronise les données Google Search Console pour un utilisateur."""
        if not self.gsc_service:
            print("Service Google Search Console non disponible")
            return False

        try:
            search_data = self.gsc_service.get_search_data(days=days)
            today = datetime.now().date()

            obj, created = GoogleSearchConsoleData.objects.update_or_create(
                user=user,
                date=today,
                defaults={
                    'clicks': search_data.get('clicks', 0),
                    'impressions': search_data.get('impressions', 0),
                    'ctr': search_data.get('ctr', 0.0),
                    'position': search_data.get('position', 0.0),
                },
            )

            action = "creees" if created else "mises a jour"
            print(f"Donnees Search Console {action} pour {user.username}: {search_data}")

            self.sync_search_console_queries(user, days)
            return True

        except Exception as e:
            print(f"Erreur lors de la synchronisation Search Console: {e}")
            return False

    def sync_search_console_queries(self, user, days=7):
        """Synchronise les requêtes Google Search Console."""
        if not self.gsc_service:
            return

        try:
            queries_data = self.gsc_service.get_top_queries(limit=20, days=days)
            today = datetime.now().date()

            for query_data in queries_data:
                GoogleSearchConsolePageData.objects.update_or_create(
                    user=user,
                    query=query_data.get('query', ''),
                    date=today,
                    defaults={
                        'clicks': query_data.get('clicks', 0),
                        'impressions': query_data.get('impressions', 0),
                        'ctr': query_data.get('ctr', 0.0),
                        'position': query_data.get('position', 0.0),
                    },
                )

            print(f"Requetes Search Console synchronisees: {len(queries_data)} requetes")

        except Exception as e:
            print(f"Erreur lors de la synchronisation des requetes: {e}")

    def sync_all_users(self, days=7):
        """Synchronise les données pour tous les utilisateurs."""
        users = User.objects.filter(is_active=True)

        for user in users:
            print(f"\n--- Synchronisation pour {user.username} ---")
            self.sync_analytics_data(user, days)
            self.sync_search_console_data(user, days)

    def run_auto_sync(self):
        """Exécute la synchronisation automatique complète."""
        print("=== DEBUT DE LA SYNCHRONISATION AUTOMATIQUE ===")
        print(f"Date: {datetime.now()}")

        self.initialize_services()

        if not self.ga_service and not self.gsc_service:
            print("Aucun service Google disponible")
            return False

        self.sync_all_users(days=7)

        print("\n=== FIN DE LA SYNCHRONISATION AUTOMATIQUE ===")
        return True


if __name__ == "__main__":
    sync_service = AutoSyncService()
    success = sync_service.run_auto_sync()

    if success:
        print("Synchronisation automatique terminee avec succes")
    else:
        print("Erreur lors de la synchronisation automatique")
