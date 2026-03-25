"""
Analytics API Views

These views handle HTTP requests and return JSON responses
containing Google Analytics data for the frontend dashboard.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .services import analytics_service
from .serializers import (
    OverviewSerializer,
    TrafficDataSerializer,
    PageDataSerializer,
    SyncResponseSerializer
)

import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
def overview_view(request):
    """
    Get overview analytics data.
    
    Returns:
        JSON response with sessions, users, pageViews, and bounceRate
    """
    try:
        # Get data from Google Analytics service
        data = analytics_service.get_overview_data()
        
        # Serialize the data
        serializer = OverviewSerializer(data=data)
        if serializer.is_valid():
            logger.info("Overview data retrieved successfully")
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.error(f"Overview data validation failed: {serializer.errors}")
            return Response(
                {"error": "Data validation failed", "details": serializer.errors},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in overview view: {str(e)}")
        return Response(
            {"error": "Failed to retrieve overview data", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def traffic_view(request):
    """
    Get traffic data over time for chart visualization.
    
    Query Parameters:
        days (int): Number of days to retrieve data for (default: 30)
    
    Returns:
        JSON response with array of {date, sessions} objects
    """
    try:
        # Get days parameter from query string
        days = request.GET.get('days', 30)
        try:
            days = int(days)
            days = max(1, min(days, 365))  # Limit between 1 and 365 days
        except (ValueError, TypeError):
            days = 30
        
        # Get data from Google Analytics service
        data = analytics_service.get_traffic_data(days=days)
        
        # Serialize the data
        serializer = TrafficDataSerializer(data=data, many=True)
        if serializer.is_valid():
            logger.info(f"Traffic data retrieved successfully for {len(data)} days")
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.error(f"Traffic data validation failed: {serializer.errors}")
            return Response(
                {"error": "Data validation failed", "details": serializer.errors},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in traffic view: {str(e)}")
        return Response(
            {"error": "Failed to retrieve traffic data", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def pages_view(request):
    """
    Get top pages by page views.
    
    Query Parameters:
        limit (int): Maximum number of pages to return (default: 10)
    
    Returns:
        JSON response with array of {page, views} objects
    """
    try:
        # Get limit parameter from query string
        limit = request.GET.get('limit', 10)
        try:
            limit = int(limit)
            limit = max(1, min(limit, 100))  # Limit between 1 and 100 pages
        except (ValueError, TypeError):
            limit = 10
        
        # Get data from Google Analytics service
        data = analytics_service.get_pages_data(limit=limit)
        
        # Serialize the data
        serializer = PageDataSerializer(data=data, many=True)
        if serializer.is_valid():
            logger.info(f"Pages data retrieved successfully for {len(data)} pages")
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.error(f"Pages data validation failed: {serializer.errors}")
            return Response(
                {"error": "Data validation failed", "details": serializer.errors},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in pages view: {str(e)}")
        return Response(
            {"error": "Failed to retrieve pages data", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def sync_view(request):
    """
    Sync fresh data from Google Analytics and return all dashboard data.
    
    This endpoint fetches the latest data from Google Analytics and returns
    a complete dataset for the dashboard, including overview, traffic, and pages data.
    
    Returns:
        JSON response with complete analytics data
    """
    try:
        # Get all data from Google Analytics service
        data = analytics_service.sync_all_data()
        
        # Serialize the data
        serializer = SyncResponseSerializer(data=data)
        if serializer.is_valid():
            logger.info("Sync completed successfully")
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.error(f"Sync data validation failed: {serializer.errors}")
            return Response(
                {"error": "Data validation failed", "details": serializer.errors},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in sync view: {str(e)}")
        return Response(
            {"error": "Failed to sync analytics data", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for the analytics API.
    
    Returns:
        JSON response with API status and configuration info
    """
    try:
        from django.conf import settings
        
        response_data = {
            "status": "healthy",
            "service": "SEO Analytics API",
            "property_id": settings.PROPERTY_ID,
            "version": "1.0.0"
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return Response(
            {"error": "Health check failed", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
