import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, DailyData } from '../../services/analytics.service';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-dashboard">
      <div class="header">
        <h1>📊 Dashboard Analytics & SEO</h1>
        <div class="controls">
          <select [(ngModel)]="selectedDays" (change)="refreshData()">
            <option [ngValue]="0">Aujourd'hui</option>
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
          </select>
        </div>
      </div>

      <!-- Google Analytics Section -->
      <section class="section">
        <h2>Google Analytics</h2>
        
        <div *ngIf="analyticsLoading" class="loading">Chargement...</div>
        <div *ngIf="analyticsError" class="error">{{ analyticsError }}</div>

        <div *ngIf="analyticsSummary" class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">📈</div>
            <div class="kpi-content">
              <div class="kpi-label">Sessions</div>
              <div class="kpi-value">{{ analyticsSummary.analytics.sessions | number }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">👥</div>
            <div class="kpi-content">
              <div class="kpi-label">Utilisateurs actifs</div>
              <div class="kpi-value">{{ analyticsSummary.analytics.active_users | number }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">📄</div>
            <div class="kpi-content">
              <div class="kpi-label">Vues de page</div>
              <div class="kpi-value">{{ analyticsSummary.analytics.screen_page_views | number }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">⏸️</div>
            <div class="kpi-content">
              <div class="kpi-label">Taux de rebond</div>
              <div class="kpi-value">{{ analyticsSummary.analytics.bounce_rate.toFixed(2) }}%</div>
            </div>
          </div>
        </div>

        <div *ngIf="topPages.length > 0" class="table-section">
          <h3>Pages les plus consultées</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Vues</th>
                <th>Sessions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let page of topPages">
                <td>{{ page.page_path }}</td>
                <td>{{ page.views | number }}</td>
                <td>{{ page.sessions | number }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="analyticsChartReady" class="chart-container">
          <canvas id="analyticsChart" #analyticsCanvas></canvas>
        </div>
      </section>

      <!-- Google Search Console Section -->
      <section class="section">
        <h2>Google Search Console</h2>
        
        <div *ngIf="searchLoading" class="loading">Chargement...</div>
        <div *ngIf="searchError" class="error">{{ searchError }}</div>

        <div *ngIf="searchSummary" class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">🖱️</div>
            <div class="kpi-content">
              <div class="kpi-label">Clics</div>
              <div class="kpi-value">{{ searchSummary.search.clicks | number }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">👁️</div>
            <div class="kpi-content">
              <div class="kpi-label">Impressions</div>
              <div class="kpi-value">{{ searchSummary.search.impressions | number }}</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">🎯</div>
            <div class="kpi-content">
              <div class="kpi-label">CTR</div>
              <div class="kpi-value">{{ searchSummary.search.ctr.toFixed(2) }}%</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon">🏆</div>
            <div class="kpi-content">
              <div class="kpi-label">Position moyenne</div>
              <div class="kpi-value">{{ searchSummary.search.position.toFixed(1) }}</div>
            </div>
          </div>
        </div>

        <div *ngIf="topQueries.length > 0" class="table-section">
          <h3>Mots-clés les plus performants</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Mot-clé</th>
                <th>Clics</th>
                <th>Impressions</th>
                <th>CTR</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let query of topQueries">
                <td>{{ query.query }}</td>
                <td>{{ query.clicks | number }}</td>
                <td>{{ query.impressions | number }}</td>
                <td>{{ query.ctr.toFixed(2) }}%</td>
                <td>{{ query.position.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    h1 {
      color: #333;
      margin: 0;
    }

    .controls select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    section {
      margin-bottom: 40px;
    }

    h2 {
      color: #333;
      border-bottom: 2px solid #4285f4;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .loading {
      padding: 20px;
      text-align: center;
      color: #999;
    }

    .error {
      padding: 15px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .kpi-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .kpi-icon {
      font-size: 32px;
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-label {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }

    .table-section {
      margin-bottom: 30px;
    }

    h3 {
      color: #555;
      margin-top: 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .data-table thead {
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
    }

    .data-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }

    .data-table tbody tr:hover {
      background: #f9f9f9;
    }

    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  userId = 1; // À récupérer de l'authentification
  selectedDays: number = 30;

  // Google Analytics
  analyticsSummary: any = null;
  topPages: any[] = [];
  analyticsLoading = false;
  analyticsError = '';
  analyticsChartReady = false;

  // Google Search Console
  searchSummary: any = null;
  topQueries: any[] = [];
  searchLoading = false;
  searchError = '';

  private analyticsChart?: Chart;

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.loadAnalyticsData();
    this.loadSearchData();
  }

  loadAnalyticsData(): void {
    this.analyticsLoading = true;
    this.analyticsError = '';

    // Récupérer le résumé
    this.analyticsService.getAnalyticsSummary(this.selectedDays).subscribe(
      (data) => {
        this.analyticsSummary = data;
        this.analyticsLoading = false;
      },
      (error) => {
        this.analyticsError = error.error?.error || 'Erreur lors du chargement';
        this.analyticsLoading = false;
      }
    );

    // Récupérer les pages les plus consultées
    this.analyticsService.getTopPages(this.selectedDays, 10).subscribe(
      (data) => {
        this.topPages = data.pages;
      }
    );

    // Récupérer les données pour le graphique
    setTimeout(() => {
      this.analyticsService.getAnalyticsGraphData(this.userId, this.selectedDays).subscribe(
        (data) => {
          this.analyticsChartReady = true;
          setTimeout(() => this.initAnalyticsChart(data.daily_data), 100);
        }
      );
    }, 500);
  }

  loadSearchData(): void {
    this.searchLoading = true;
    this.searchError = '';

    // Récupérer le résumé
    this.analyticsService.getSearchSummary(this.userId, this.selectedDays).subscribe(
      (data) => {
        this.searchSummary = data;
        this.searchLoading = false;
      },
      (error) => {
        this.searchError = error.error?.error || 'Erreur lors du chargement';
        this.searchLoading = false;
      }
    );

    // Récupérer les requêtes les plus performantes
    this.analyticsService.getTopQueries(this.selectedDays, 10).subscribe(
      (data) => {
        this.topQueries = data.queries;
      }
    );
  }

  initAnalyticsChart(data: DailyData[]): void {
    const canvas = document.getElementById('analyticsChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.analyticsChart) {
      this.analyticsChart.destroy();
    }

    this.analyticsChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Sessions',
            data: data.map(d => d.sessions),
            borderColor: '#4285f4',
            backgroundColor: 'rgba(66, 133, 244, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Utilisateurs',
            data: data.map(d => d.active_users),
            borderColor: '#ea4335',
            backgroundColor: 'rgba(234, 67, 53, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Vues de page',
            data: data.map(d => d.page_views),
            borderColor: '#fbbc04',
            backgroundColor: 'rgba(251, 188, 4, 0.1)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      } as any,
    });
  }
}
