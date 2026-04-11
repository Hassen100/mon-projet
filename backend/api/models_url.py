from django.db import models
from django.contrib.auth.models import User

class URLAnalysisData(models.Model):
    """Données d'analyse pour une URL spécifique"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='url_analyses')
    url = models.URLField(max_length=500)
    date = models.DateField(auto_now_add=True)
    
    # KPIs principaux
    sessions = models.IntegerField(default=0)
    users = models.IntegerField(default=0)
    page_views = models.IntegerField(default=0)
    bounce_rate = models.FloatField(default=0.0)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'url_analysis_data'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'url', '-date']),
            models.Index(fields=['url', '-date']),
        ]
    
    def __str__(self):
        return f"{self.url} - {self.date}"


class URLPageData(models.Model):
    """Données des pages pour une URL analysée"""
    url_analysis = models.ForeignKey(URLAnalysisData, on_delete=models.CASCADE, related_name='page_data')
    page_path = models.CharField(max_length=500)
    views = models.IntegerField(default=0)
    sessions = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'url_page_data'
        ordering = ['-views']
        indexes = [
            models.Index(fields=['url_analysis', '-views']),
        ]
    
    def __str__(self):
        return f"{self.page_path} - {self.views} vues"


class URLKeywordData(models.Model):
    """Données des mots-clés pour une URL analysée"""
    url_analysis = models.ForeignKey(URLAnalysisData, on_delete=models.CASCADE, related_name='keyword_data')
    keyword = models.CharField(max_length=200)
    position = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    
    class Meta:
        db_table = 'url_keyword_data'
        ordering = ['-clicks']
        indexes = [
            models.Index(fields=['url_analysis', '-clicks']),
        ]
    
    def __str__(self):
        return f"{self.keyword} - {self.clicks} clics"
