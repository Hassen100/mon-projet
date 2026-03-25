"""
Google Analytics Service Layer

This module handles all communication with Google Analytics Data API v1beta.
It's responsible for authentication, running reports, and formatting results.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric
from google.oauth2 import service_account
from django.conf import settings

import logging

logger = logging.getLogger(__name__)


class GoogleAnalyticsService:
    """
    Service class for interacting with Google Analytics Data API.
    
    This service handles:
    - Authentication with Google Analytics using service account
    - Running various types of reports
    - Formatting results for API responses
    - Error handling and logging
    """
    
    def __init__(self):
        """Initialize the Google Analytics service with credentials."""
        try:
            # Load service account credentials from JSON file
            self.credentials = service_account.Credentials.from_service_account_file(
                settings.SERVICE_ACCOUNT_FILE,
                scopes=['https://www.googleapis.com/auth/analytics.readonly']
            )
            
            # Initialize the Analytics Data client
            self.client = BetaAnalyticsDataClient(credentials=self.credentials)
            self.property_id = f"properties/{settings.PROPERTY_ID}"
            
            logger.info(f"Google Analytics service initialized for property: {self.property_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Analytics service: {str(e)}")
            raise
    
    def get_overview_data(self) -> Dict[str, Any]:
        """
        Get overview analytics data including sessions, users, page views, and bounce rate.
        
        Returns:
            Dict containing overview metrics with proper data types
        """
        try:
            # Define the metrics we want to retrieve
            metrics = [
                Metric(name="sessions"),
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
                Metric(name="bounceRate")
            ]
            
            # Define date range (last 30 days)
            date_range = DateRange(
                start_date=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                end_date=datetime.now().strftime("%Y-%m-%d")
            )
            
            # Build and run the report request
            request = {
                "property": self.property_id,
                "date_ranges": [date_range],
                "metrics": metrics
            }
            
            response = self.client.run_report(request)
            
            # Format the response
            result = {
                "sessions": 0,
                "users": 0,
                "pageViews": 0,
                "bounceRate": 0.0
            }
            
            if response.rows:
                row = response.rows[0]
                result["sessions"] = int(row.metric_values[0].value or 0)
                result["users"] = int(row.metric_values[1].value or 0)
                result["pageViews"] = int(row.metric_values[2].value or 0)
                result["bounceRate"] = float(row.metric_values[3].value or 0.0)
            
            logger.info(f"Retrieved overview data: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching overview data: {str(e)}")
            # Return default values on error
            return {
                "sessions": 0,
                "users": 0,
                "pageViews": 0,
                "bounceRate": 0.0
            }
    
    def get_traffic_data(self, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get traffic data over time for chart visualization.
        
        Args:
            days: Number of days to retrieve data for
            
        Returns:
            List of dictionaries containing date and sessions data
        """
        try:
            # Define metrics and dimensions
            metrics = [Metric(name="sessions")]
            dimensions = [Dimension(name="date")]
            
            # Define date range
            date_range = DateRange(
                start_date=(datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d"),
                end_date=datetime.now().strftime("%Y-%m-%d")
            )
            
            # Build and run the report request
            request = {
                "property": self.property_id,
                "date_ranges": [date_range],
                "dimensions": dimensions,
                "metrics": metrics
            }
            
            response = self.client.run_report(request)
            
            # Format the response
            result = []
            
            if response.rows:
                for row in response.rows:
                    date_value = row.dimension_values[0].value
                    sessions_value = int(row.metric_values[0].value or 0)
                    
                    result.append({
                        "date": date_value,
                        "sessions": sessions_value
                    })
            
            logger.info(f"Retrieved traffic data for {len(result)} days")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching traffic data: {str(e)}")
            return []
    
    def get_pages_data(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get top pages by page views.
        
        Args:
            limit: Maximum number of pages to return
            
        Returns:
            List of dictionaries containing page path and views data
        """
        try:
            # Define metrics and dimensions
            metrics = [Metric(name="screenPageViews")]
            dimensions = [Dimension(name="pagePath")]
            
            # Define date range (last 30 days)
            date_range = DateRange(
                start_date=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                end_date=datetime.now().strftime("%Y-%m-%d")
            )
            
            # Build and run the report request
            request = {
                "property": self.property_id,
                "date_ranges": [date_range],
                "dimensions": dimensions,
                "metrics": metrics,
                "limit": limit
            }
            
            response = self.client.run_report(request)
            
            # Format the response
            result = []
            
            if response.rows:
                for row in response.rows:
                    page_path = row.dimension_values[0].value
                    page_views = int(row.metric_values[0].value or 0)
                    
                    result.append({
                        "page": page_path,
                        "views": page_views
                    })
            
            logger.info(f"Retrieved pages data for {len(result)} pages")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching pages data: {str(e)}")
            return []
    
    def sync_all_data(self) -> Dict[str, Any]:
        """
        Synchronize all analytics data from Google Analytics.
        
        This method fetches fresh data from all endpoints and returns
        a consolidated response for the dashboard.
        
        Returns:
            Dict containing all analytics data
        """
        try:
            # Fetch all data types
            overview = self.get_overview_data()
            traffic = self.get_traffic_data()
            pages = self.get_pages_data()
            
            # Consolidate results
            result = {
                "overview": overview,
                "traffic": traffic,
                "pages": pages,
                "last_updated": datetime.now().isoformat()
            }
            
            logger.info("Successfully synchronized all analytics data")
            return result
            
        except Exception as e:
            logger.error(f"Error syncing all data: {str(e)}")
            return {
                "overview": {"sessions": 0, "users": 0, "pageViews": 0, "bounceRate": 0.0},
                "traffic": [],
                "pages": [],
                "last_updated": datetime.now().isoformat(),
                "error": str(e)
            }


# Create a singleton instance for reuse across the application
analytics_service = GoogleAnalyticsService()
