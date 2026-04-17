import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { ApiConfigService } from './api-config.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface AiResponse {
  response: string;
  context_summary?: {
    sessions?: number;
    users?: number;
    page_views?: number;
    clicks?: number;
    impressions?: number;
  };
  timestamp?: string;
  provider?: 'ollama' | 'gemini' | 'auto';
  model?: string;
}

export interface AiServiceStatus {
  ollama: { available: boolean; url: string; model: string };
  gemini: { available: boolean; provider: string };
  last_used: string | null;
  recommended: 'ollama' | 'gemini';
}

export interface QuickAnalysisResponse {
  analysis: string;
  dashboard_stats?: {
    sessions?: number;
    bounce_rate?: number;
    top_pages?: Array<Record<string, unknown>>;
    search_clicks?: number;
    avg_position?: number;
  };
}

export interface DashboardContext {
  period_days?: number;
  analytics?: Record<string, unknown>;
  search_console?: Record<string, unknown>;
  top_pages?: Array<Record<string, unknown>>;
  top_queries?: Array<Record<string, unknown>> | Record<string, unknown>;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  sendMessage(message: string, dataType: string = 'summary'): Observable<AiResponse> {
    return this.sendMessageWithMode(message, 'auto', dataType);
  }

  sendMessageWithMode(
    message: string,
    aiMode: 'auto' | 'ollama' | 'gemini' = 'auto',
    dataType: string = 'summary',
    days: number = 30,
    userId?: number
  ): Observable<AiResponse> {
    const url = this.apiConfig.getApiUrl('/api/ai/chat/');
    const payload: Record<string, unknown> = {
      message,
      data_type: dataType,
      ai_mode: aiMode,
      days
    };

    if (typeof userId === 'number') {
      payload['user_id'] = userId;
    }

    return this.http.post<AiResponse>(url, payload).pipe(timeout(210000));
  }

  getQuickAnalysis(userId?: number, days: number = 30): Observable<QuickAnalysisResponse> {
    const url = this.apiConfig.getApiUrl('/api/ai/quick-analysis/');
    let params = new HttpParams().set('days', String(days));
    if (typeof userId === 'number') {
      params = params.set('user_id', String(userId));
    }
    return this.http.get<QuickAnalysisResponse>(url, { params }).pipe(timeout(180000));
  }

  getDashboardContext(dataTypeOrUserId?: string | number, days: number = 30): Observable<DashboardContext> {
    const url = this.apiConfig.getApiUrl('/api/ai/context/');

    let userId: number | undefined;
    if (typeof dataTypeOrUserId === 'number') {
      userId = dataTypeOrUserId;
    }

    let params = new HttpParams().set('days', String(days));
    if (typeof userId === 'number') {
      params = params.set('user_id', String(userId));
    }

    return this.http.get<DashboardContext>(url, { params }).pipe(timeout(180000));
  }

  getServicesStatus(): Observable<AiServiceStatus> {
    const url = this.apiConfig.getApiUrl('/api/ai/services-status/');
    return this.http.get<AiServiceStatus>(url);
  }
}
