from rest_framework import serializers
from .models import GoogleAnalyticsData, GoogleSearchConsoleData


class AnalyticsSerializer(serializers.Serializer):
    """Serializer pour les données analytics"""
    period = serializers.IntegerField(default=30, help_text="Période en jours")
    
    def validate_period(self, value):
        if value <= 0 or value > 365:
            raise serializers.ValidationError("La période doit être entre 1 et 365 jours")
        return value


class AnalyticsResponseSerializer(serializers.Serializer):
    """Serializer pour la réponse analytics"""
    sessions = serializers.IntegerField()
    users = serializers.IntegerField()
    page_views = serializers.IntegerField()
    bounce_rate = serializers.FloatField()
