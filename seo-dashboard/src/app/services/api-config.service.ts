import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private apiBaseUrl: string = '';

  constructor() {
    this.setApiBaseUrl();
  }

  private setApiBaseUrl(): void {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Development: use localhost:8000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.apiBaseUrl = `http://localhost:8000`;
    } else {
      // Production: use same origin
      this.apiBaseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    }

    console.log('API Base URL:', this.apiBaseUrl);
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  getApiUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${endpoint}`;
  }
}
