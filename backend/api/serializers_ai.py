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
