from rest_framework import serializers


class PageRecommendationRequestSerializer(serializers.Serializer):
    url = serializers.CharField(required=True, max_length=500)
    bounce_rate = serializers.FloatField(required=True, min_value=0, max_value=100)
    avg_duration = serializers.CharField(required=True, max_length=50)
    sessions = serializers.IntegerField(required=True, min_value=0)
    position = serializers.FloatField(required=False, allow_null=True)
    impressions = serializers.IntegerField(required=False, min_value=0, default=0)
    ctr = serializers.FloatField(required=False, min_value=0, max_value=100, default=0)


class PageRecommendationResponseSerializer(serializers.Serializer):
    recommendations = serializers.ListField(child=serializers.CharField())


class AIChatMessageSerializer(serializers.Serializer):
    """Serializer pour les messages du chat AI"""
    message = serializers.CharField(required=True, max_length=2000)
    user_id = serializers.IntegerField(required=False, allow_null=True)
    days = serializers.IntegerField(required=False, default=30, min_value=1, max_value=365)


class AIChatResponseSerializer(serializers.Serializer):
    """Serializer pour les réponses du chat AI"""
    response = serializers.CharField()
    context_summary = serializers.DictField(required=False)
    timestamp = serializers.DateTimeField(required=False)


class AIQuickAnalysisSerializer(serializers.Serializer):
    """Serializer pour l'analyse rapide"""
    analysis = serializers.CharField()
    dashboard_stats = serializers.DictField(required=False)
