import json
from datetime import datetime, timedelta

from google.auth import load_credentials_from_dict
from googleapiclient.discovery import build

from .models import GoogleSearchConsoleData, GoogleSearchConsolePageData


class GoogleSearchConsoleService:
    """Service pour recuperer les donnees Google Search Console."""

    def __init__(self, credentials_json, site_url):
        self.site_url = site_url

        if isinstance(credentials_json, str):
            creds_dict = json.loads(credentials_json)
        else:
            creds_dict = credentials_json

        self.credentials, _ = load_credentials_from_dict(
            creds_dict,
            scopes=['https://www.googleapis.com/auth/webmasters.readonly'],
        )

        self.service = build('webmasters', 'v3', credentials=self.credentials)
        # Prepare an alternate site identifier for Domain properties (sc-domain:)
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.site_url or '')
            netloc = parsed.netloc or ''
            if netloc:
                self.alt_site_url = f'sc-domain:{netloc}'
            else:
                self.alt_site_url = None
        except Exception:
            self.alt_site_url = None

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

    def _is_hourly_today_mode(self, mode):
        return mode == "today"

    def _fetch_rows(self, body):
        request = self.service.searchanalytics().query(
            siteUrl=self.site_url,
            body=body,
        )
        response = request.execute()
        rows = response.get('rows', [])

        # If no rows returned and we have an alternate sc-domain property, try it as a fallback.
        if (not rows) and getattr(self, 'alt_site_url', None):
            try:
                alt_request = self.service.searchanalytics().query(
                    siteUrl=self.alt_site_url,
                    body=body,
                )
                alt_response = alt_request.execute()
                alt_rows = alt_response.get('rows', [])
                if alt_rows:
                    return alt_rows
            except Exception:
                # Ignore fallback errors and return original rows
                pass

        return rows

    def _hourly_today_rows(self):
        # Keep the dashboard "24h" mode aligned with today's Search Console data
        # instead of silently falling back to older days.
        target_date = datetime.now().date()
        rows = self._fetch_rows(
            {
                'startDate': target_date.isoformat(),
                'endDate': target_date.isoformat(),
                'dataState': 'HOURLY_ALL',
                'dimensions': ['HOUR'],
                'rowLimit': 25000,
            }
        )
        return target_date, rows

    def _aggregate_grouped_hourly_rows(self, rows, group_index=1, key_name='query'):
        aggregates = {}

        for row in rows:
            keys = row.get('keys', [])
            if len(keys) <= group_index:
                continue

            item_key = keys[group_index]
            metrics = aggregates.setdefault(
                item_key,
                {
                    key_name: item_key,
                    "clicks": 0,
                    "impressions": 0,
                    "weighted_ctr": 0.0,
                    "weighted_position": 0.0,
                },
            )

            clicks = int(row.get('clicks', 0))
            impressions = int(row.get('impressions', 0))
            ctr = float(row.get('ctr', 0))
            position = float(row.get('position', 0))

            metrics["clicks"] += clicks
            metrics["impressions"] += impressions
            metrics["weighted_ctr"] += ctr * impressions
            metrics["weighted_position"] += position * impressions

        results = []
        for _, item in aggregates.items():
            impressions = item["impressions"]
            ctr = item["weighted_ctr"] / impressions if impressions else 0.0
            position = item["weighted_position"] / impressions if impressions else 0.0
            results.append(
                {
                    key_name: item[key_name],
                    "clicks": item["clicks"],
                    "impressions": impressions,
                    "ctr": ctr,
                    "position": position,
                }
            )

        results.sort(key=lambda entry: entry["clicks"], reverse=True)
        return results

    def get_search_data(self, days=30, mode="period"):
        if self._is_hourly_today_mode(mode):
            _, rows = self._hourly_today_rows()
            return self._aggregate_metrics(rows)

        start_date, end_date = self._get_date_range(days, mode)
        rows = self._fetch_rows(
            {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'metrics': ['clicks', 'impressions', 'ctr', 'position'],
            }
        )
        result = self._aggregate_metrics(rows)
        return result

    def get_top_queries(self, limit=20, days=30, mode="period"):
        if self._is_hourly_today_mode(mode):
            latest_date, _ = self._hourly_today_rows()
            if latest_date is None:
                return []
            rows = self._fetch_rows(
                {
                    'startDate': latest_date.isoformat(),
                    'endDate': latest_date.isoformat(),
                    'dataState': 'HOURLY_ALL',
                    'dimensions': ['HOUR', 'QUERY'],
                    'rowLimit': 25000,
                }
            )
            return self._aggregate_grouped_hourly_rows(rows, group_index=1, key_name='query')[:limit]

        start_date, end_date = self._get_date_range(days, mode)
        results = []

        for row in self._fetch_rows(
            {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'dimensions': ['query'],
                'metrics': ['clicks', 'impressions', 'ctr', 'position'],
                'rowLimit': limit,
                'orderBy': [
                    {
                        'direction': 'DESCENDING',
                        'sortBy': 'clicks',
                    }
                ],
            }
        ):
            results.append(
                {
                    "query": row['keys'][0],
                    "clicks": int(row['clicks']),
                    "impressions": int(row['impressions']),
                    "ctr": float(row['ctr']),
                    "position": float(row['position']),
                }
            )

        return results

    def get_top_pages(self, limit=20, days=30, mode="period"):
        if self._is_hourly_today_mode(mode):
            latest_date, _ = self._hourly_today_rows()
            if latest_date is None:
                return []
            rows = self._fetch_rows(
                {
                    'startDate': latest_date.isoformat(),
                    'endDate': latest_date.isoformat(),
                    'dataState': 'HOURLY_ALL',
                    'dimensions': ['HOUR', 'PAGE'],
                    'rowLimit': 25000,
                }
            )
            return self._aggregate_grouped_hourly_rows(rows, group_index=1, key_name='page_url')[:limit]

        start_date, end_date = self._get_date_range(days, mode)
        results = []

        for row in self._fetch_rows(
            {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'dimensions': ['page'],
                'metrics': ['clicks', 'impressions', 'ctr', 'position'],
                'rowLimit': limit,
                'orderBy': [
                    {
                        'direction': 'DESCENDING',
                        'sortBy': 'clicks',
                    }
                ],
            }
        ):
            results.append(
                {
                    "page_url": row['keys'][0],
                    "clicks": int(row['clicks']),
                    "impressions": int(row['impressions']),
                    "ctr": float(row['ctr']),
                    "position": float(row['position']),
                }
            )

        return results

    def get_daily_data(self, days=30, mode="period"):
        if self._is_hourly_today_mode(mode):
            _, rows = self._hourly_today_rows()
            results = []
            for row in rows:
                results.append(
                    {
                        "date": row['keys'][0],
                        "clicks": int(row['clicks']),
                        "impressions": int(row['impressions']),
                        "ctr": float(row['ctr']),
                        "position": float(row['position']),
                    }
                )
            return results

        start_date, end_date = self._get_date_range(days, mode)
        results = []

        for row in self._fetch_rows(
            {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'dimensions': ['date'],
                'metrics': ['clicks', 'impressions', 'ctr', 'position'],
            }
        ):
            results.append(
                {
                    "date": row['keys'][0],
                    "clicks": int(row['clicks']),
                    "impressions": int(row['impressions']),
                    "ctr": float(row['ctr']),
                    "position": float(row['position']),
                }
            )

        return results

    def _aggregate_metrics(self, rows):
        total_clicks = 0
        total_impressions = 0
        total_ctr = 0
        total_position = 0
        rows_count = len(rows)

        for row in rows:
            total_clicks += int(row.get('clicks') or 0)
            total_impressions += int(row.get('impressions') or 0)
            total_ctr += float(row.get('ctr') or 0)
            total_position += float(row.get('position') or 0)

        return {
            "clicks": total_clicks,
            "impressions": total_impressions,
            "ctr": total_clicks / total_impressions if total_impressions > 0 else 0,  # CTR = clicks/impressions
            "position": total_position / rows_count if rows_count > 0 else 0,
        }

    def save_search_data(self, user, days=30, mode="period"):
        if self._is_hourly_today_mode(mode):
            return self.get_search_data(days, mode)

        data = self.get_search_data(days, mode)
        target_date = self._get_date_range(days, mode)[0]

        top_queries = self.get_top_queries(days=days, mode=mode)
        top_pages = self.get_top_pages(days=days, mode=mode)

        has_live_snapshot = any(
            [
                data["clicks"] > 0,
                data["impressions"] > 0,
                bool(top_queries),
                bool(top_pages),
            ]
        )

        if data["clicks"] <= 0 and data["impressions"] <= 0 and top_queries:
            total_impressions = sum(item["impressions"] for item in top_queries)
            weighted_ctr = sum(item["ctr"] * item["impressions"] for item in top_queries)
            weighted_position = sum(item["position"] * item["impressions"] for item in top_queries)
            data = {
                "clicks": sum(item["clicks"] for item in top_queries),
                "impressions": total_impressions,
                "ctr": (weighted_ctr / total_impressions) if total_impressions else 0.0,
                "position": (weighted_position / total_impressions) if total_impressions else 0.0,
            }

        if not has_live_snapshot:
            stored_queries = GoogleSearchConsoleData.objects.filter(user=user, date=target_date)
            if stored_queries.exists():
                impressions = sum(item.impressions for item in stored_queries)
                weighted_ctr = sum(item.ctr * item.impressions for item in stored_queries)
                weighted_position = sum(item.position * item.impressions for item in stored_queries)
                return {
                    "clicks": sum(item.clicks for item in stored_queries),
                    "impressions": impressions,
                    "ctr": (weighted_ctr / impressions) if impressions else 0.0,
                    "position": (weighted_position / impressions) if impressions else 0.0,
                }

        GoogleSearchConsoleData.objects.filter(user=user, date=target_date).delete()
        for query_data in top_queries:
            GoogleSearchConsoleData.objects.update_or_create(
                user=user,
                query=query_data["query"],
                date=target_date,
                defaults={
                    "clicks": query_data["clicks"],
                    "impressions": query_data["impressions"],
                    "ctr": query_data["ctr"],
                    "position": query_data["position"],
                },
            )

        GoogleSearchConsolePageData.objects.filter(user=user, date=target_date).delete()
        for page_data in top_pages:
            GoogleSearchConsolePageData.objects.update_or_create(
                user=user,
                page_url=page_data["page_url"],
                date=target_date,
                defaults={
                    "clicks": page_data["clicks"],
                    "impressions": page_data["impressions"],
                    "ctr": page_data["ctr"],
                    "position": page_data["position"],
                },
            )

        return data
