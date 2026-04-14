from rest_framework import serializers

from .models import ContentAnalysis


class ContentAnalysisListSerializer(serializers.ModelSerializer):
    recommendation_count = serializers.SerializerMethodField()
    recommendations_summary = serializers.SerializerMethodField()

    class Meta:
        model = ContentAnalysis
        fields = (
            'id',
            'url',
            'semantic_score',
            'technical_score',
            'recommendation_count',
            'recommendations_summary',
            'last_updated',
        )

    def get_recommendation_count(self, obj):
        return len(obj.recommendations or [])

    def get_recommendations_summary(self, obj):
        recs = obj.recommendations or []
        return recs[:3]


class ContentAnalysisDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentAnalysis
        fields = (
            'id',
            'url',
            'semantic_score',
            'technical_score',
            'recommendations',
            'technical_issues',
            'competitor_data',
            'last_updated',
        )
