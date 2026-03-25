# Frontend Integration Guide

This guide shows how to integrate the SEO Analytics Backend API with your Angular frontend.

## Base URL

```
http://localhost:8000/api/analytics/
```

## API Endpoints Usage

### 1. Get Overview Data

**Endpoint:** `GET /overview/`

**Angular Service Example:**
```typescript
// analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OverviewData {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private baseUrl = 'http://localhost:8000/api/analytics';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<OverviewData> {
    return this.http.get<OverviewData>(`${this.baseUrl}/overview/`);
  }

  // Other methods...
}
```

**Component Usage:**
```typescript
// dashboard.component.ts
export class DashboardComponent implements OnInit {
  overviewData: OverviewData;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.analyticsService.getOverview().subscribe(
      data => {
        this.overviewData = data;
        console.log('Overview data:', data);
      },
      error => {
        console.error('Error fetching overview:', error);
      }
    );
  }
}
```

### 2. Get Traffic Data

**Endpoint:** `GET /traffic/?days=30`

**Service Method:**
```typescript
getTrafficData(days: number = 30): Observable<TrafficData[]> {
  return this.http.get<TrafficData[]>(`${this.baseUrl}/traffic/?days=${days}`);
}

export interface TrafficData {
  date: string;
  sessions: number;
}
```

**Component Usage:**
```typescript
trafficData: TrafficData[] = [];

ngOnInit() {
  this.analyticsService.getTrafficData(30).subscribe(
    data => {
      this.trafficData = data;
      this.renderChart(data);
    },
    error => console.error('Error fetching traffic:', error)
  );
}
```

### 3. Get Top Pages

**Endpoint:** `GET /pages/?limit=10`

**Service Method:**
```typescript
getTopPages(limit: number = 10): Observable<PageData[]> {
  return this.http.get<PageData[]>(`${this.baseUrl}/pages/?limit=${limit}`);
}

export interface PageData {
  page: string;
  views: number;
}
```

### 4. Sync All Data

**Endpoint:** `POST /sync/`

**Service Method:**
```typescript
syncAllData(): Observable<SyncResponse> {
  return this.http.post<SyncResponse>(`${this.baseUrl}/sync/`, {});
}

export interface SyncResponse {
  overview: OverviewData;
  traffic: TrafficData[];
  pages: PageData[];
  last_updated: string;
  error?: string;
}
```

## Complete Angular Service

```typescript
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
  private baseUrl = 'http://localhost:8000/api/analytics';

  constructor(private http: HttpClient) {}

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
```

## Component Integration Example

```typescript
import { Component, OnInit } from '@angular/core';
import { AnalyticsService, OverviewData, TrafficData, PageData } from './analytics.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h2>SEO Analytics Dashboard</h2>
      
      <!-- Overview Cards -->
      <div class="overview-cards">
        <div class="card">
          <h3>Sessions</h3>
          <p>{{ overviewData?.sessions || 0 }}</p>
        </div>
        <div class="card">
          <h3>Users</h3>
          <p>{{ overviewData?.users || 0 }}</p>
        </div>
        <div class="card">
          <h3>Page Views</h3>
          <p>{{ overviewData?.pageViews || 0 }}</p>
        </div>
        <div class="card">
          <h3>Bounce Rate</h3>
          <p>{{ overviewData?.bounceRate || 0 }}%</p>
        </div>
      </div>
      
      <!-- Refresh Button -->
      <button (click)="refreshData()" [disabled]="loading">
        {{ loading ? 'Loading...' : 'Refresh Data' }}
      </button>
    </div>
  `,
  styles: [`
    .dashboard { padding: 20px; }
    .overview-cards { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 20px; 
      margin: 20px 0; 
    }
    .card { 
      background: #f5f5f5; 
      padding: 20px; 
      border-radius: 8px; 
      text-align: center; 
    }
    .card h3 { margin: 0 0 10px 0; }
    .card p { 
      font-size: 24px; 
      font-weight: bold; 
      margin: 0; 
    }
    button { 
      padding: 10px 20px; 
      background: #007bff; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      cursor: pointer; 
    }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class DashboardComponent implements OnInit {
  overviewData: OverviewData;
  trafficData: TrafficData[];
  pagesData: PageData[];
  loading = false;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    
    // Load overview data
    this.analyticsService.getOverview().subscribe(
      data => {
        this.overviewData = data;
      },
      error => console.error('Error loading overview:', error)
    );

    // Load traffic data
    this.analyticsService.getTrafficData(30).subscribe(
      data => {
        this.trafficData = data;
      },
      error => console.error('Error loading traffic:', error)
    );

    // Load top pages
    this.analyticsService.getTopPages(10).subscribe(
      data => {
        this.pagesData = data;
      },
      error => console.error('Error loading pages:', error)
    );
  }

  refreshData() {
    this.analyticsService.syncAllData().subscribe(
      data => {
        this.overviewData = data.overview;
        this.trafficData = data.traffic;
        this.pagesData = data.pages;
        this.loading = false;
        console.log('Data refreshed:', data);
      },
      error => {
        console.error('Error refreshing data:', error);
        this.loading = false;
      }
    );
  }
}
```

## Error Handling

Add HTTP Interceptor for global error handling:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return throwError(error);
      })
    );
  }
}
```

## Environment Configuration

Update your Angular environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/analytics'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api/analytics'
};
```

## Testing the Integration

1. **Start the backend server:**
```bash
cd seo_dashboard_backend
python manage.py runserver
```

2. **Test endpoints:**
```bash
# Health check
curl http://localhost:8000/api/analytics/health/

# Get overview
curl http://localhost:8000/api/analytics/overview/
```

3. **Update Angular service URL** to match your backend server.

## CORS Issues

If you encounter CORS errors, ensure:
1. Backend CORS settings include your Angular app URL
2. Angular app makes requests to the correct backend URL
3. No trailing slashes in URLs that shouldn't have them

## Production Deployment

For production:
1. Deploy Django backend to a server
2. Update Angular environment to use production API URL
3. Configure HTTPS for both frontend and backend
4. Set up proper CORS for your production domain
