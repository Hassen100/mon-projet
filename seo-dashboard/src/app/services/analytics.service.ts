import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../api-base';

export interface AnalyticsSummary {
  sessions: number;
  users: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
}

export interface TopPage {
  page_path: string;
  views: number;
  avg_session_duration: number;
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
}

export interface DailyData {
  date: string;
  sessions: number;
  active_users: number;
  page_views: number;
}

export interface SearchSummary {
  search: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  daily_data?: SearchDailyData[];
}

export interface SearchDailyData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PageRecommendationRequest {
  url: string;
  bounce_rate: number;
  avg_duration: string;
  sessions: number;
  position?: number | null;
  impressions?: number;
  ctr?: number;
}

export interface PageRecommendationResponse {
  recommendations: string[];
}

export interface GoogleConfig {
  ga_property_id: string;
  ga_credentials: any;
  gsc_site_url: string;
  gsc_credentials: any;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private http: HttpClient) {}

  private getAuthOptions(params?: HttpParams) {
    let headers = new HttpHeaders();
    const authData = localStorage.getItem('auth_token');

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.token) {
          headers = headers.set('Authorization', `Token ${parsed.token}`);
        }
      } catch {
        // Ignore malformed auth data in local storage.
      }
    }

    return { headers, params };
  }

  // Google Config (compatibilité)
  setGoogleConfig(userId: number, config: Partial<GoogleConfig>): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/google-config/`,
      {
        user_id: userId,
        ...config,
      },
      this.getAuthOptions()
    );
  }

  // Google Analytics endpoints
  getAnalyticsSummary(days: number = 30, mode: string = 'period', refresh: boolean = false, userId?: number): Observable<AnalyticsSummary> {
    let params = new HttpParams()
      .set('days', days.toString())
      .set('mode', mode)
      .set('refresh', refresh ? '1' : '0');

    if (userId && userId > 0) {
      params = params.set('user_id', userId.toString());
    }

    return this.http.get<AnalyticsSummary>(`${this.baseUrl}/analytics/summary/`, {
      ...this.getAuthOptions(params),
    });
  }

  getTopPages(days: number = 30, limit: number = 20, mode: string = 'period', refresh: boolean = false, userId?: number): Observable<{ pages: TopPage[] }> {
    let params = new HttpParams()
      .set('days', days.toString())
      .set('limit', limit.toString())
      .set('mode', mode)
      .set('refresh', refresh ? '1' : '0');

    if (userId && userId > 0) {
      params = params.set('user_id', userId.toString());
    }

    return this.http.get<{ pages: TopPage[] }>(`${this.baseUrl}/analytics/top-pages/`, {
      ...this.getAuthOptions(params),
    });
  }

  getAnalyticsGraphData(userId: number, days: number = 30, mode: string = 'period'): Observable<{ daily_data: DailyData[] }> {
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('days', days.toString())
      .set('mode', mode);

    return this.http.get<{ daily_data: DailyData[] }>(`${this.baseUrl}/analytics/graph/`, {
      ...this.getAuthOptions(params),
    });
  }

  // Google Search Console endpoints
  getSearchSummary(userId: number, days: number = 30, refresh: boolean = false, mode: string = 'period'): Observable<SearchSummary> {
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('days', days.toString())
      .set('mode', mode)
      .set('refresh', refresh ? '1' : '0');

    return this.http.get<SearchSummary>(`${this.baseUrl}/search/summary/`, {
      ...this.getAuthOptions(params),
    });
  }

  getTopQueries(days: number = 30, limit: number = 20, mode: string = 'period', refresh: boolean = false, userId?: number): Observable<{ queries: TopQuery[] }> {
    let params = new HttpParams()
      .set('days', days.toString())
      .set('limit', limit.toString())
      .set('mode', mode)
      .set('refresh', refresh ? '1' : '0');

    if (userId && userId > 0) {
      params = params.set('user_id', userId.toString());
    }

    return this.http.get<{ queries: TopQuery[] }>(`${this.baseUrl}/search/top-queries/`, {
      ...this.getAuthOptions(params),
    });
  }

  getSearchGraphData(userId: number, days: number = 30, mode: string = 'period'): Observable<{ daily_data: SearchDailyData[] }> {
    const params = new HttpParams()
      .set('user_id', userId.toString())
      .set('days', days.toString())
      .set('mode', mode);

    return this.http.get<{ daily_data: SearchDailyData[] }>(`${this.baseUrl}/search/graph/`, {
      ...this.getAuthOptions(params),
    });
  }

  getPageRecommendations(payload: PageRecommendationRequest): Observable<PageRecommendationResponse> {
    return this.http.post<PageRecommendationResponse>(
      `${this.baseUrl}/ai/recommend/page/`,
      payload,
      this.getAuthOptions()
    );
  }
}
