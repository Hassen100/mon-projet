"""
Serializers for Analytics API

These serializers convert complex data types to native Python datatypes
that can then be easily rendered into JSON.
"""

from rest_framework import serializers
from typing import Dict, Any, List


class OverviewSerializer(serializers.Serializer):
    """Serializer for analytics overview data."""
    sessions = serializers.IntegerField()
    users = serializers.IntegerField()
    pageViews = serializers.IntegerField()
    bounceRate = serializers.FloatField()


class TrafficDataSerializer(serializers.Serializer):
    """Serializer for traffic data points."""
    date = serializers.DateField()
    sessions = serializers.IntegerField()


class PageDataSerializer(serializers.Serializer):
    """Serializer for page view data."""
    page = serializers.CharField()
    views = serializers.IntegerField()


class SyncResponseSerializer(serializers.Serializer):
    """Serializer for complete sync response."""
    overview = OverviewSerializer()
    traffic = TrafficDataSerializer(many=True)
    pages = PageDataSerializer(many=True)
    last_updated = serializers.DateTimeField()
    error = serializers.CharField(required=False, allow_blank=True)
