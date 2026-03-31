#!/bin/bash

# Script de déploiement pour SEO Dashboard sur Vercel
# Usage: ./deploy.sh [environment]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi
    
    # Vérifier Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI n'est pas installé. Installation..."
        npm install -g vercel
    fi
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier Python
    if ! command -v python &> /dev/null; then
        log_error "Python n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Préparer le code
prepare_code() {
    log_info "Préparation du code..."
    
    # Nettoyer les fichiers temporaires
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
    
    # Installer les dépendances backend
    log_info "Installation des dépendances Python..."
    pip install -r seo_dashboard_backend/requirements.txt
    
    # Installer les dépendances frontend
    log_info "Installation des dépendances Node.js..."
    npm install
    
    # Build du frontend
    log_info "Build du frontend..."
    npm run build
    
    # Collecter les statics Django
    log_info "Collecte des fichiers statiques..."
    cd seo_dashboard_backend
    python manage.py collectstatic --noinput
    cd ..
    
    log_success "Code préparé"
}

# Exécuter les tests
run_tests() {
    log_info "Exécution des tests..."
    
    # Tests backend
    log_info "Tests backend..."
    cd seo_dashboard_backend
    python test_auth_complete.py
    python manage.py check --deploy
    cd ..
    
    # Tests frontend (si configurés)
    if [ -f "package.json" ] && grep -q "test" package.json; then
        log_info "Tests frontend..."
        npm test
    fi
    
    log_success "Tests passés"
}

# Déployer sur Vercel
deploy_vercel() {
    local environment=${1:-production}
    
    log_info "Déploiement sur Vercel (environnement: $environment)..."
    
    # Vérifier si connecté à Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "Connexion à Vercel..."
        vercel login
    fi
    
    # Déployer
    if [ "$environment" = "production" ]; then
        vercel --prod
    else
        vercel
    fi
    
    log_success "Déploiement terminé"
}

# Vérifier le déploiement
verify_deployment() {
    local url=$1
    
    log_info "Vérification du déploiement..."
    
    # Attendre un peu que le déploiement soit prêt
    sleep 10
    
    # Tester l'API
    if curl -f -s "$url/api/auth/" > /dev/null; then
        log_success "API backend répond correctement"
    else
        log_warning "L'API backend ne répond pas encore (peut être normal)"
    fi
    
    # Tester le frontend
    if curl -f -s "$url" > /dev/null; then
        log_success "Frontend répond correctement"
    else
        log_warning "Le frontend ne répond pas encore (peut être normal)"
    fi
}

# Nettoyer
cleanup() {
    log_info "Nettoyage des fichiers temporaires..."
    rm -rf seo_dashboard_backend/staticfiles/
    log_success "Nettoyage terminé"
}

# Fonction principale
main() {
    local environment=${1:-production}
    
    log_info "Début du déploiement du SEO Dashboard"
    echo "=================================="
    
    check_prerequisites
    prepare_code
    
    # Demander si on veut exécuter les tests
    read -p "Voulez-vous exécuter les tests avant le déploiement ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    deploy_vercel "$environment"
    
    # Récupérer l'URL de déploiement
    local deploy_url=$(vercel ls --scope "$VERCEL_ORG_ID" 2>/dev/null | head -1 | awk '{print $2}' || echo "")
    
    if [ ! -z "$deploy_url" ]; then
        verify_deployment "$deploy_url"
        log_success "Application déployée: $deploy_url"
    else
        log_warning "Impossible de récupérer l'URL de déploiement"
    fi
    
    cleanup
    
    echo "=================================="
    log_success "Déploiement terminé avec succès !"
}

# Gérer les signaux
trap cleanup EXIT

# Exécuter le script
main "$@"
