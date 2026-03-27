import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OverviewData {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
}

export interface TrafficData {
  date: string;
  sessions: number;
  organic: number;
}

export interface PageData {
  page: string;
  views: number;
}

export interface KeywordRow {
  keyword: string;
  sessions: number;
}

export interface KeywordsResponse {
  items: KeywordRow[];
  note?: string;
}

export interface ChannelRow {
  channel: string;
  sessions: number;
}

export interface ChannelsResponse {
  items: ChannelRow[];
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
  private readonly baseUrl = environment.analyticsApiUrl;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<OverviewData> {
    return this.http.get<OverviewData>(`${this.baseUrl}/overview`);
  }

  getTrafficData(days: number = 30): Observable<TrafficData[]> {
    const params = new HttpParams().set('days', String(days));
    return this.http.get<TrafficData[]>(`${this.baseUrl}/traffic`, { params });
  }

  getTopPages(limit: number = 10): Observable<PageData[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<PageData[]>(`${this.baseUrl}/pages`, { params });
  }

  getKeywords(limit: number = 10): Observable<KeywordsResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<KeywordsResponse>(`${this.baseUrl}/keywords`, { params });
  }

  getChannels(): Observable<ChannelsResponse> {
    return this.http.get<ChannelsResponse>(`${this.baseUrl}/channels`);
  }

  syncAllData(): Observable<SyncResponse> {
    return this.http.post<SyncResponse>(`${this.baseUrl}/sync`, {});
  }

  healthCheck(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/health`);
  }
}
