from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class GoogleAnalyticsData(models.Model):
    """Stocke les données Google Analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_data')
    
    # Métriques principales
    sessions = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    screen_page_views = models.IntegerField(default=0)
    bounce_rate = models.FloatField(default=0.0)
    
    # Date de la donnée
    date = models.DateField(default=timezone.now)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ('user', 'date')
        
    def __str__(self):
        return f"Analytics {self.user.username} - {self.date}"


class GoogleAnalyticsPageData(models.Model):
    """Stocke les données par page de Google Analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_pages')
    
    # Données de la page
    page_path = models.CharField(max_length=500)
    screen_page_views = models.IntegerField(default=0)
    sessions = models.IntegerField(default=0)
    
    # Date
    date = models.DateField(default=timezone.now)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-screen_page_views']
        unique_together = ('user', 'page_path', 'date')
        
    def __str__(self):
        return f"Page {self.page_path} - {self.screen_page_views} views"


class GoogleSearchConsoleData(models.Model):
    """Stocke les données Google Search Console"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_console_data')
    
    # Données de recherche
    query = models.CharField(max_length=500)
    clicks = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)  # Click-Through Rate
    position = models.FloatField(default=0.0)
    
    # Date
    date = models.DateField(default=timezone.now)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-clicks']
        unique_together = ('user', 'query', 'date')
        
    def __str__(self):
        return f"Query '{self.query}' - {self.clicks} clicks"


class GoogleSearchConsolePageData(models.Model):
    """Stocke les données par page pour Google Search Console"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_console_pages')
    
    # Données de la page
    page_url = models.CharField(max_length=500)
    clicks = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    position = models.FloatField(default=0.0)
    
    # Date
    date = models.DateField(default=timezone.now)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-clicks']
        unique_together = ('user', 'page_url', 'date')
        
    def __str__(self):
        return f"Page {self.page_url} - {self.clicks} clicks"


class GoogleIntegrationConfig(models.Model):
    """Configuration pour l'intégration Google (stocke les credentials)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_config')
    
    # Google Analytics
    ga_property_id = models.CharField(max_length=50, blank=True)
    ga_credentials_json = models.JSONField(default=dict, blank=True)
    
    # Google Search Console
    gsc_site_url = models.URLField(max_length=500, blank=True)
    gsc_credentials_json = models.JSONField(default=dict, blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Google Config for {self.user.username}"

