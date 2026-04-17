import json
from datetime import datetime, timedelta

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, OrderBy, RunReportRequest
from google.auth import load_credentials_from_dict

from .models import GoogleAnalyticsData, GoogleAnalyticsPageData


class GoogleAnalyticsService:
    """Service pour recuperer les donnees Google Analytics."""

    def __init__(self, credentials_json, property_id):
        self.property_id = property_id

        if isinstance(credentials_json, str):
            creds_dict = json.loads(credentials_json)
        else:
            creds_dict = credentials_json

        self.credentials, _ = load_credentials_from_dict(creds_dict)
        self.client = BetaAnalyticsDataClient(credentials=self.credentials)

    def _get_date_range(self, days=30, mode="period"):
        end_date = datetime.now().date()
        
        if mode == "today":
            start_date = end_date
        elif mode == "yesterday":
            start_date = end_date - timedelta(days=1)
            end_date = start_date
        elif days <= 1:
            start_date = end_date
        else:
            start_date = end_date - timedelta(days=days - 1)
        return start_date, end_date

    def get_analytics_data(self, days=30, mode="period"):
        start_date, end_date = self._get_date_range(days, mode)

        request = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[],
            metrics=[
                Metric(name="sessions"),
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
                Metric(name="bounceRate"),
            ],
            date_ranges=[
                DateRange(
                    start_date=start_date.isoformat(),
                    end_date=end_date.isoformat(),
                )
            ],
        )

        response = self.client.run_report(request)

        if response.rows:
            row = response.rows[0]
            return {
                "sessions": int(row.metric_values[0].value),
                "active_users": int(row.metric_values[1].value),
                "screen_page_views": int(row.metric_values[2].value),
                "bounce_rate": float(row.metric_values[3].value),
            }

        return {
            "sessions": 0,
            "active_users": 0,
            "screen_page_views": 0,
            "bounce_rate": 0.0,
        }

    def get_top_pages(self, limit=20, days=30, mode="period"):
        start_date, end_date = self._get_date_range(days, mode)

        request = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[Dimension(name="pagePath")],
            metrics=[
                Metric(name="screenPageViews"),
                Metric(name="sessions"),
            ],
            date_ranges=[
                DateRange(
                    start_date=start_date.isoformat(),
                    end_date=end_date.isoformat(),
                )
            ],
            order_bys=[
                OrderBy(
                    metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"),
                    desc=True,
                )
            ],
            limit=limit,
        )

        response = self.client.run_report(request)
        results = []

        for row in response.rows:
            results.append(
                {
                    "page_path": row.dimension_values[0].value,
                    "views": int(row.metric_values[0].value),
                    "sessions": int(row.metric_values[1].value),
                }
            )

        return results

    def get_daily_data(self, days=30, mode="period"):
        start_date, end_date = self._get_date_range(days, mode)

        request = RunReportRequest(
            property=f"properties/{self.property_id}",
            dimensions=[Dimension(name="date")],
            metrics=[
                Metric(name="sessions"),
                Metric(name="activeUsers"),
                Metric(name="screenPageViews"),
            ],
            date_ranges=[
                DateRange(
                    start_date=start_date.isoformat(),
                    end_date=end_date.isoformat(),
                )
            ],
            order_bys=[
                OrderBy(
                    dimension=OrderBy.DimensionOrderBy(dimension_name="date"),
                    desc=False,
                )
            ],
        )

        response = self.client.run_report(request)
        results = []

        for row in response.rows:
            results.append(
                {
                    "date": row.dimension_values[0].value,
                    "sessions": int(row.metric_values[0].value),
                    "active_users": int(row.metric_values[1].value),
                    "page_views": int(row.metric_values[2].value),
                }
            )

        return results

    def save_analytics_data(self, user, days=1, mode="today"):
        data = self.get_analytics_data(days=days, mode=mode)
        _, target_date = self._get_date_range(days, mode)
        top_pages = self.get_top_pages(days=days, mode=mode)

        has_live_snapshot = any(
            [
                data["sessions"] > 0,
                data["active_users"] > 0,
                data["screen_page_views"] > 0,
                bool(top_pages),
            ]
        )

        existing_snapshot = GoogleAnalyticsData.objects.filter(user=user, date=target_date).first()
        if not has_live_snapshot and existing_snapshot is not None:
            return {
                "sessions": existing_snapshot.sessions,
                "active_users": existing_snapshot.active_users,
                "screen_page_views": existing_snapshot.screen_page_views,
                "bounce_rate": existing_snapshot.bounce_rate,
            }

        analytics_data, created = GoogleAnalyticsData.objects.get_or_create(
            user=user,
            date=target_date,
            defaults={
                "sessions": data["sessions"],
                "active_users": data["active_users"],
                "screen_page_views": data["screen_page_views"],
                "bounce_rate": data["bounce_rate"],
            },
        )

        if not created:
            analytics_data.sessions = data["sessions"]
            analytics_data.active_users = data["active_users"]
            analytics_data.screen_page_views = data["screen_page_views"]
            analytics_data.bounce_rate = data["bounce_rate"]
            analytics_data.save()

        # Reset the page snapshot for the target date so stale rows do not survive
        # when Google Analytics returns fewer pages or no pages at all.
        GoogleAnalyticsPageData.objects.filter(user=user, date=target_date).delete()

        for page_data in top_pages:
            GoogleAnalyticsPageData.objects.update_or_create(
                user=user,
                page_path=page_data["page_path"],
                date=target_date,
                defaults={
                    "screen_page_views": page_data["views"],
                    "sessions": page_data["sessions"],
                },
            )

        return data
