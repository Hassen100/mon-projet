import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: any;
}

export interface AiResponse {
  response: string;
  context_summary?: any;
  timestamp?: string;
}

export interface QuickAnalysisRequest {
  data_type: string;
  url?: string;
}

export interface QuickAnalysisResponse {
  analysis: string;
  priority: string;
  recommendations: string[];
  metrics?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) { }

  sendMessage(message: string, dataType: string = 'summary'): Observable<AiResponse> {
    const url = this.apiConfig.getApiUrl('/api/ai/chat/');
    const payload = {
      message: message,
      data_type: dataType
    };
    return this.http.post<AiResponse>(url, payload);
  }

  getQuickAnalysis(dataType: string, url?: string): Observable<QuickAnalysisResponse> {
    const apiUrl = this.apiConfig.getApiUrl('/api/ai/quick-analysis/');
    const payload: QuickAnalysisRequest = {
      data_type: dataType,
      url: url
    };
    return this.http.post<QuickAnalysisResponse>(apiUrl, payload);
  }

  getDashboardContext(dataType: string): Observable<any> {
    const url = this.apiConfig.getApiUrl('/api/ai/context/');
    const payload = {
      data_type: dataType
    };
    return this.http.post<any>(url, payload);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { getApiBaseUrl } from '../api-base';

export interface AIChatMessage {
  message: string;
  user_id?: number;
  days?: number;
}

export interface AIChatResponse {
  response: string;
  context_summary?: {
    sessions: number;
    users: number;
    page_views: number;
    clicks: number;
    impressions: number;
  };
  timestamp?: string;
}

export interface AIQuickAnalysis {
  analysis: string;
  dashboard_stats?: {
    sessions: number;
    bounce_rate: number;
    top_pages: Array<any>;
    search_clicks: number;
    avg_position: number;
  };
}

export interface DashboardContext {
  period_days: number;
  analytics: {
    total_sessions: number;
    total_users: number;
    total_page_views: number;
    avg_bounce_rate: number;
    top_pages: Array<{
      page: string;
      views: number;
      sessions: number;
    }>;
  };
  search_console: {
    total_clicks: number;
    total_impressions: number;
    avg_ctr: number;
    avg_position: number;
    top_queries: Array<{
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }> | string;
  };
  anomalies: Array<any>;
  url_issues: Array<any>;
}

@Injectable({
  providedIn: 'root'
})
export class AIChatService {
  private baseUrl = getApiBaseUrl();

  constructor(private http: HttpClient) { }

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

  /**
   * Send a message to the AI assistant and get expert SEO analysis
   */
  sendMessage(message: string, userId?: number, days: number = 30): Observable<AIChatResponse> {
    const payload: AIChatMessage = {
      message,
      days
    };

    if (userId) {
      payload.user_id = userId;
    }

    return this.http
      .post<AIChatResponse>(`${this.baseUrl}/ai/chat/`, payload, this.getAuthOptions())
      .pipe(timeout(210000));
  }

  /**
   * Get a quick analysis of the current dashboard
   */
  getQuickAnalysis(userId?: number, days: number = 30): Observable<AIQuickAnalysis> {
    let params = new HttpParams()
      .set('days', days.toString());

    if (userId) {
      params = params.set('user_id', userId.toString());
    }

    return this.http
      .get<AIQuickAnalysis>(`${this.baseUrl}/ai/quick-analysis/`, this.getAuthOptions(params))
      .pipe(timeout(180000));
  }

  /**
   * Get dashboard context data for AI
   */
  getDashboardContext(userId?: number, days: number = 30): Observable<DashboardContext> {
    let params = new HttpParams()
      .set('days', days.toString());

    if (userId) {
      params = params.set('user_id', userId.toString());
    }

    return this.http
      .get<DashboardContext>(`${this.baseUrl}/ai/context/`, this.getAuthOptions(params))
      .pipe(timeout(180000));
  }
}
