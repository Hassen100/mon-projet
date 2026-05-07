import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getApiBaseUrl } from '../api-base';

export interface ContentAnalysisListItem {
  id: number;
  url: string;
  semantic_score: number;
  technical_score: number;
  recommendation_count: number;
  recommendations_summary: Array<{ priority?: string; title?: string; message?: string }>;
  last_updated: string;
}

export interface ContentAnalysisDetail {
  id: number;
  url: string;
  semantic_score: number;
  technical_score: number;
  recommendations: Array<{ priority: string; title: string; message: string }>;
  technical_issues: {
    title?: { present: boolean; length_ok: boolean; length: number };
    meta_description?: { present: boolean; length_ok: boolean; length: number };
    images_missing_alt?: string[];
    broken_internal_links?: Array<{ url: string; status: number | string }>;
    duplicate_pages?: string[];
    fetch_error?: string;
  };
  competitor_data: {
    keyword?: string;
    avg_similarity?: number;
    missing_terms?: string[];
    avg_competitor_word_count?: number;
    comparison?: {
      own_word_count?: number;
      own_h2_count?: number;
      own_has_list_or_table?: boolean;
    };
    competitors?: Array<{
      title: string;
      url: string;
      word_count: number;
      h2_count: number;
      similarity: number;
      has_list_or_table: boolean;
    }>;
    semantic_breakdown?: {
      coverage_points?: number;
      structure_points?: number;
      engagement_points?: number;
      similarity?: number;
      bounce_rate?: number;
      avg_session_duration?: number;
      target_word_count?: number;
      word_count?: number;
      h2_count?: number;
    };
  };
  last_updated: string;
}

export interface ContentAnalysisListResponse {
  count: number;
  average_semantic_score: number;
  results: ContentAnalysisListItem[];
}

@Injectable({ providedIn: 'root' })
export class ContentOptimizerService {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const authData = localStorage.getItem('auth_token');

    if (!authData) {
      return headers;
    }

    try {
      const parsed = JSON.parse(authData);
      const parsedToken =
        typeof parsed === 'string'
          ? parsed
          : parsed?.token || parsed?.key || parsed?.authToken || '';

      if (parsedToken) {
        headers = headers.set('Authorization', `Token ${parsedToken}`);
      }
    } catch {
      const rawToken = authData.trim();
      if (rawToken) {
        headers = headers.set('Authorization', `Token ${rawToken}`);
      }
    }

    return headers;
  }

  getAnalyses(): Observable<ContentAnalysisListResponse> {
    return this.http.get<ContentAnalysisListResponse>(`${this.baseUrl}/content-analysis/`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAnalysisDetail(id: number): Observable<ContentAnalysisDetail> {
    return this.http.get<ContentAnalysisDetail>(`${this.baseUrl}/content-analysis/${id}/`, {
      headers: this.getAuthHeaders(),
    });
  }

  refreshAnalyses(urls: number = 50, targetUrl: string = ''): Observable<{ message: string; result: any }> {
    const payload: Record<string, unknown> = { urls };
    const normalizedTarget = targetUrl.trim();
    if (normalizedTarget) {
      payload['target_url'] = normalizedTarget;
    }

    return this.http.post<{ message: string; result: any }>(
      `${this.baseUrl}/content-analysis/refresh/`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }
}
