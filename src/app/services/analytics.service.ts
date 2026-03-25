import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OverviewData {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
}

export interface TrafficData {
  date: string;
  sessions: number;
}

export interface PageData {
  page: string;
  views: number;
}

export interface SyncResponse {
  overview: OverviewData;
  traffic: TrafficData[];
  pages: PageData[];
  last_updated: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'http://127.0.0.1:8000/api/analytics';

  constructor(private http: HttpClient) {
    // Connection test will be done when dashboard loads
  }

  getOverview(): Observable<OverviewData> {
    return this.http.get<OverviewData>(`${this.baseUrl}/overview/`);
  }

  getTrafficData(days: number = 30): Observable<TrafficData[]> {
    return this.http.get<TrafficData[]>(`${this.baseUrl}/traffic/?days=${days}`);
  }

  getTopPages(limit: number = 10): Observable<PageData[]> {
    return this.http.get<PageData[]>(`${this.baseUrl}/pages/?limit=${limit}`);
  }

  syncAllData(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(`${this.baseUrl}/sync/`, {});
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health/`);
  }
}
