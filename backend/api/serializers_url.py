from rest_framework import serializers

class URLAnalysisSerializer(serializers.Serializer):
    """Serializer pour l'analyse d'URL"""
    url = serializers.URLField(required=True, help_text="URL à analyser")
    period = serializers.IntegerField(default=30, min_value=1, max_value=365, help_text="Période en jours")
    
    def validate_url(self, value):
        if not value.startswith(('http://', 'https://')):
            raise serializers.ValidationError("L'URL doit commencer par http:// ou https://")
        return value


class URLAnalysisResponseSerializer(serializers.Serializer):
    """Serializer pour la réponse d'analyse d'URL"""
    url = serializers.CharField()
    period = serializers.IntegerField()
    sessions = serializers.IntegerField()
    users = serializers.IntegerField()
    page_views = serializers.IntegerField()
    bounce_rate = serializers.FloatField()
    top_pages = serializers.ListField()
    top_keywords = serializers.ListField()
    last_updated = serializers.DateTimeField()
    data_points = serializers.IntegerField()
