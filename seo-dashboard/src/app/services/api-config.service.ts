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
    const hostname = window.location.hostname;
    const override = (window as any).__API_BASE_URL__ as string | undefined;

    if (override && override.trim()) {
      this.apiBaseUrl = override.trim().replace(/\/$/, '');
      return;
    }

    // Development: local Django API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.apiBaseUrl = `http://localhost:8000`;
      return;
    }

    // GitHub Pages/static hosting: point to deployed backend API
    if (hostname.includes('github.io')) {
      this.apiBaseUrl = 'https://mon-projet.onrender.com';
      return;
    }

    // TryCloudflare frontend deployments should use same tunnel host.
    if (hostname.includes('trycloudflare.com')) {
      this.apiBaseUrl = `${window.location.protocol}//${hostname}`;
      return;
    }

    // Default production fallback
    if (hostname.endsWith('onrender.com')) {
      this.apiBaseUrl = `${window.location.protocol}//${hostname}`;
    } else {
      this.apiBaseUrl = 'https://mon-projet.onrender.com';
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
