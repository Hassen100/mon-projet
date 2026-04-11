#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta
import time
import threading

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

django.setup()

from auto_sync import AutoSyncService


class ScheduledSyncService:
    """Service de synchronisation planifiée"""
    
    def __init__(self):
        self.sync_service = AutoSyncService()
        self.running = False
        self.interval = 3600  # 1 heure en secondes
        
    def start_scheduler(self):
        """Démarre le planificateur de synchronisation"""
        self.running = True
        print("Planificateur de synchronisation démarré")
        print(f"Fréquence: {self.interval} secondes (1 heure)")
        
        while self.running:
            try:
                # Exécuter la synchronisation
                print(f"\n[{datetime.now()}] Démarrage de la synchronisation planifiée...")
                success = self.sync_service.run_auto_sync()
                
                if success:
                    print(f"[{datetime.now()}] Synchronisation terminée avec succès")
                else:
                    print(f"[{datetime.now()}] Erreur lors de la synchronisation")
                
                # Attendre la prochaine exécution
                print(f"Prochaine synchronisation dans {self.interval} secondes...")
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                print("\nArrêt du planificateur demandé...")
                self.running = False
                break
            except Exception as e:
                print(f"Erreur dans le planificateur: {e}")
                # Continuer même en cas d'erreur
                time.sleep(60)  # Attendre 1 minute avant de réessayer
    
    def stop_scheduler(self):
        """Arrête le planificateur de synchronisation"""
        self.running = False
        print("Planificateur de synchronisation arrêté")


def run_sync_now():
    """Exécute une synchronisation immédiate"""
    print("Exécution de la synchronisation immédiate...")
    sync_service = AutoSyncService()
    success = sync_service.run_auto_sync()
    
    if success:
        print("Synchronisation immédiate terminée avec succès")
    else:
        print("Erreur lors de la synchronisation immédiate")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Service de synchronisation automatique')
    parser.add_argument('--run-now', action='store_true', help='Exécuter la synchronisation immédiatement')
    parser.add_argument('--schedule', action='store_true', help='Démarrer le planificateur')
    parser.add_argument('--interval', type=int, default=3600, help='Intervalle en secondes (défaut: 3600)')
    
    args = parser.parse_args()
    
    if args.run_now:
        run_sync_now()
    elif args.schedule:
        scheduler = ScheduledSyncService()
        scheduler.interval = args.interval
        scheduler.start_scheduler()
    else:
        print("Usage: python scheduled_sync.py --run-now ou --schedule")
        print("Exemples:")
        print("  python scheduled_sync.py --run-now")
        print("  python scheduled_sync.py --schedule")
        print("  python scheduled_sync.py --schedule --interval 1800  # 30 minutes")
