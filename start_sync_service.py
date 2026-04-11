#!/usr/bin/env python
"""
Démarrer le service de synchronisation automatique des données Google Analytics
"""

import os
import sys
import subprocess
import time
from datetime import datetime

def start_sync_service():
    """Démarre le service de synchronisation automatique"""
    print("=== DÉMARRAGE DU SERVICE DE SYNCHRONISATION AUTOMATIQUE ===")
    print(f"Date: {datetime.now()}")
    print("Ce service synchronisera les données Google Analytics toutes les heures")
    print("Appuyez sur Ctrl+C pour arrêter le service")
    print("=" * 60)
    
    # Changer vers le répertoire backend
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)
    
    try:
        # Démarrer le planificateur
        subprocess.run([sys.executable, 'scheduled_sync.py', '--schedule'], 
                      check=True)
    except KeyboardInterrupt:
        print("\nService de synchronisation arrêté manuellement")
    except Exception as e:
        print(f"Erreur: {e}")

def sync_now():
    """Exécute une synchronisation immédiate"""
    print("=== SYNCHRONISATION IMMÉDIATE ===")
    print(f"Date: {datetime.now()}")
    
    # Changer vers le répertoire backend
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)
    
    try:
        # Exécuter la synchronisation
        result = subprocess.run([sys.executable, 'scheduled_sync.py', '--run-now'], 
                              check=True, capture_output=True, text=True)
        print(result.stdout)
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Service de synchronisation Google Analytics')
    parser.add_argument('--start', action='store_true', help='Démarrer le service de synchronisation automatique')
    parser.add_argument('--sync-now', action='store_true', help='Exécuter une synchronisation immédiate')
    
    args = parser.parse_args()
    
    if args.start:
        start_sync_service()
    elif args.sync_now:
        sync_now()
    else:
        print("Usage: python start_sync_service.py --start ou --sync-now")
        print("  --start    : Démarre le service de synchronisation automatique")
        print("  --sync-now : Exécute une synchronisation immédiate")
