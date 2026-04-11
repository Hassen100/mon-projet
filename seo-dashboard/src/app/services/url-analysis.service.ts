import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface URLAnalysisRequest {
  url: string;
  period: number;
}

export interface URLAnalysisResponse {
  url: string;
  period: number;
  sessions: number;
  users: number;
  page_views: number;
  bounce_rate: number;
  top_pages: Array<{
    page_path: string;
    views: number;
    sessions: number;
  }>;
  top_keywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: string;
  }>;
  last_updated: string;
  data_points: number;
}

export interface URLHistoryItem {
  url: string;
  date: string;
  sessions: number;
  users: number;
  page_views: number;
  bounce_rate: number;
  last_updated: string;
}

export interface URLHistoryResponse {
  history: URLHistoryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class URLAnalysisService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Analyse une URL spécifique
   */
  analyzeURL(request: URLAnalysisRequest): Observable<URLAnalysisResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<URLAnalysisResponse>(`${this.apiUrl}/analyze-url/`, request, { headers });
  }

  /**
   * Récupère l'historique des analyses
   */
  getURLHistory(limit: number = 10): Observable<URLHistoryResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<URLHistoryResponse>(`${this.apiUrl}/url-history/?limit=${limit}`, { headers });
  }

  /**
   * Récupère le token depuis localStorage
   */
  private getAuthHeaders(): HttpHeaders {
    const authData = localStorage.getItem('auth_token');
    let token = '';
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.token || '';
      } catch {
        token = '';
      }
    }

    return new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Sauvegarde l'URL dans localStorage
   */
  saveURL(url: string): void {
    localStorage.setItem('last_analyzed_url', url);
  }

  /**
   * Récupère la dernière URL analysée
   */
  getLastURL(): string {
    return localStorage.getItem('last_analyzed_url') || 'https://seo-ia123.vercel.app/';
  }

  /**
   * Génère une commande cURL pour l'analyse d'URL
   */
  generateCURL(request: URLAnalysisRequest): string {
    const authData = localStorage.getItem('auth_token');
    let token = '';
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.token || '';
      } catch {
        token = '';
      }
    }

    const body = JSON.stringify(request);
    
    return `curl -X POST "${this.apiUrl}/analyze-url/" \\
  -H "Authorization: Token ${token}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`;
  }
}
