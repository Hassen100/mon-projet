import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-google-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="google-config-container">
      <h2>Configuration Google Analytics & Search Console</h2>

      <form (ngSubmit)="saveConfig()">
        <div class="form-section">
          <h3>Google Analytics</h3>

          <div class="form-group">
            <label>Property ID:</label>
            <input
              [(ngModel)]="config.ga_property_id"
              name="ga_property_id"
              placeholder="Ex: 531307647"
              required
            />
          </div>

          <div class="form-group">
            <label>Credentials JSON:</label>
            <textarea
              [(ngModel)]="gaCredentialsText"
              name="ga_credentials"
              rows="8"
              placeholder="Collez le JSON des credentials ici"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <h3>Google Search Console</h3>

          <div class="form-group">
            <label>Site URL:</label>
            <input
              [(ngModel)]="config.gsc_site_url"
              name="gsc_site_url"
              type="url"
              placeholder="Ex: https://seo-ia123.vercel.app/"
              required
            />
          </div>

          <div class="form-group">
            <label>Credentials JSON:</label>
            <textarea
              [(ngModel)]="gscCredentialsText"
              name="gsc_credentials"
              rows="8"
              placeholder="Collez le JSON des credentials ici"
            ></textarea>
          </div>
        </div>

        <button type="submit" [disabled]="loading || !userId">
          {{ loading ? 'Sauvegarde...' : 'Sauvegarder Configuration' }}
        </button>
      </form>

      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <hr />

      <div class="test-section">
        <h3>Test des APIs</h3>

        <button (click)="testAnalytics()">Test Google Analytics</button>
        <button (click)="testSearch()" [disabled]="!userId">Test Search Console</button>

        <div *ngIf="testResults" class="test-results">
          <pre>{{ testResults | json }}</pre>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .google-config-container {
      max-width: 1000px;
      margin: 20px auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
    }

    .form-section {
      margin-bottom: 30px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }

    h3 {
      margin-top: 0;
      color: #555;
    }

    .form-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    input,
    textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }

    button {
      background: #4285f4;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
      margin-bottom: 10px;
    }

    button:hover:not(:disabled) {
      background: #357ae8;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .success-message {
      padding: 15px;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
      border-radius: 4px;
      margin: 15px 0;
    }

    .error-message {
      padding: 15px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      border-radius: 4px;
      margin: 15px 0;
    }

    .test-section {
      padding: 15px;
      background: #f0f0f0;
      border-radius: 5px;
    }

    .test-results {
      margin-top: 15px;
      background: white;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }

    pre {
      margin: 0;
      font-size: 12px;
    }

    hr {
      margin: 30px 0;
      border: none;
      border-top: 1px solid #ddd;
    }
  `]
})
export class GoogleConfigComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  config = {
    ga_property_id: '',
    ga_credentials: {},
    gsc_site_url: '',
    gsc_credentials: {}
  };

  gaCredentialsText = '';
  gscCredentialsText = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  testResults: unknown = null;
  userId = 0;

  ngOnInit(): void {
    this.userId = this.getStoredUserId();
  }

  saveConfig(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.userId) {
      this.loading = false;
      this.errorMessage = 'Connectez-vous avant de sauvegarder la configuration.';
      return;
    }

    try {
      const gaCredentials = this.gaCredentialsText ? JSON.parse(this.gaCredentialsText) : {};
      const gscCredentials = this.gscCredentialsText ? JSON.parse(this.gscCredentialsText) : {};

      const payload = {
        ga_property_id: this.config.ga_property_id,
        ga_credentials: gaCredentials,
        gsc_site_url: this.config.gsc_site_url,
        gsc_credentials: gscCredentials
      };

      this.analyticsService.setGoogleConfig(this.userId, payload).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message || 'Configuration sauvegardee avec succes.';
          setTimeout(() => (this.successMessage = ''), 5000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.error || error.error?.message || error.message || 'Erreur lors de la sauvegarde';
        }
      });
    } catch (error) {
      this.loading = false;
      console.error('JSON parse error:', error);
      this.errorMessage = 'JSON invalide. Verifiez le format de vos credentials.';
    }
  }

  testAnalytics(): void {
    this.analyticsService.getAnalyticsSummary(30, 'period', false, this.userId).subscribe({
      next: (data) => {
        this.testResults = { type: 'Analytics', data };
      },
      error: (error) => {
        this.testResults = { type: 'Analytics Error', error: error.error };
      }
    });
  }

  testSearch(): void {
    if (!this.userId) {
      this.testResults = { type: 'Search Console Error', error: 'Connexion requise' };
      return;
    }

    this.analyticsService.getSearchSummary(this.userId, 30, false, 'period').subscribe({
      next: (data) => {
        this.testResults = { type: 'Search Console', data };
      },
      error: (error) => {
        this.testResults = { type: 'Search Console Error', error: error.error };
      }
    });
  }

  private getStoredUserId(): number {
    try {
      const authData = localStorage.getItem('auth_token');
      if (!authData) {
        return 0;
      }

      const parsed = JSON.parse(authData);
      return Number(parsed?.id) || 0;
    } catch {
      return 0;
    }
  }
}
