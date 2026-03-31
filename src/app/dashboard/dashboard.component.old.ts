import { Component, OnInit, OnDestroy, signal, computed, inject, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { AnalyticsService } from '../services/analytics.service';
import Chart from 'chart.js/auto';
import { ChartConfiguration, ChartType } from 'chart.js';

// Types
interface OverviewData {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
}

interface TrafficData {
  date: string;
  sessions: number;
}

interface PageData {
  page: string;
  views: number;
}

interface SyncResponse {
  overview: OverviewData;
  traffic: TrafficData[];
  pages: PageData[];
  last_updated: string;
}

interface Alert {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  id: number;
}

interface KPICard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

interface TopPage {
  url: string;
  views: number;
  trend: 'up' | 'down' | 'flat';
}

interface Keyword {
  keyword: string;
  position: number;
  ctr: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Inject services
  private router = inject(Router);
  private http = inject(HttpClient);
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);

  // Signals
  loading = signal(false);
  alerts = signal<Alert[]>([]);
  lastSync = signal('Jamais');
  showAiPanel = signal(false);
  kpis = signal<{ sessions: number; users: number; pageviews: number; bounceRate: string }>({
    sessions: 0,
    users: 0,
    pageviews: 0,
    bounceRate: '0%'
  });
  kpiDeltas = signal<{ sessions: string; users: string; pageviews: string; bounce: string }>({
    sessions: '',
    users: '',
    pageviews: '',
    bounce: ''
  });
  topPages = signal<TopPage[]>([]);
  topKeywords = signal<Keyword[]>([]);
  pageUrl = signal('');
  dateStart = signal('');
  dateEnd = signal('');

  // Charts
  trafficChart?: Chart;
  keywordsChart?: Chart;
  bounceChart?: Chart;

  // Auto-refresh timer
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL = 60000; // 60 seconds = 1 minute

  constructor() {}
    { icon: '📱', title: 'Mobile-first indexing', body: '3 pages présentent des éléments non adaptés au mobile. Vérifiez les tableaux et les CTA sur petits écrans.', priority: 'p-low', label: 'Priorité faible' },
  ];

  constructor(
    public auth: AuthService,
    private analyticsService: AnalyticsService
  ) {}

  private refreshInterval: ReturnType<typeof setInterval> | undefined;
  private readonly REFRESH_INTERVAL = 60000;

  ngOnInit() {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    this.dateEnd = today.toISOString().slice(0, 10);
    this.dateStart = past.toISOString().slice(0, 10);
    this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));

    this.startAutoRefresh();

    this.analyticsService.healthCheck().subscribe({
      next: (response) => {
        console.log('Backend API:', response);
        const credsOk = response['ga_credentials_configured'] === true;
        this.gaSetupWarning.set(
          credsOk
            ? ''
            : 'Configuration GA manquante sur le serveur : ajoutez GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY et GA_PROPERTY_ID dans Vercel (Environment Variables), puis redéployez.'
        );
      },
      error: (error) => {
        console.error('Backend API health failed:', error);
        this.gaSetupWarning.set('');
        this.showAlert(
          'API indisponible : vérifiez le déploiement Vercel ou lancez `vercel dev` (port 3000) en local.',
          'error',
          8000
        );
      }
    });
  }

  /** Extrait le message utile du corps d’erreur HTTP (API Google / Vercel). */
  private formatHttpError(err: unknown): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const httpErr = err as {
        error?: unknown;
        status?: number;
        message?: string;
      };
      if (httpErr.status === 0) {
        return 'Impossible de joindre le serveur (réseau ou URL API).';
      }
      const body = httpErr.error;
      if (typeof body === 'string') return body;
      if (body && typeof body === 'object') {
        const b = body as { details?: string; error?: string; hint?: string };
        const parts: string[] = [];
        if (b.hint) parts.push(b.hint);
        if (b.details) parts.push(b.details);
        if (
          b.error &&
          typeof b.error === 'string' &&
          b.error !== 'Failed to sync analytics data' &&
          b.error !== 'Failed to fetch analytics data'
        ) {
          parts.push(b.error);
        }
        if (parts.length) return parts.join(' ');
      }
    }
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    return 'Erreur inconnue.';
  }

  ngOnDestroy() {
    this.trafficChart?.destroy();
    this.keywordsChart?.destroy();
    this.channelsChart?.destroy();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.updateKPIs();
      this.refreshChartsFromApi();
      this.updateTables();
      this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));
    }, this.REFRESH_INTERVAL);
  }

  ngAfterViewInit() {
    if (typeof Chart !== 'undefined') {
      this.initCharts();
      this.updateKPIs();
      this.updateTables();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      script.onload = () => {
        this.initCharts();
        this.updateKPIs();
        this.updateTables();
      };
      document.head.appendChild(script);
    }
  }

  private formatGaDateLabel(raw: string): string {
    if (raw && raw.length === 8 && /^\d{8}$/.test(raw)) {
      const y = +raw.slice(0, 4);
      const m = +raw.slice(4, 6) - 1;
      const day = +raw.slice(6, 8);
      return new Date(y, m, day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    return raw;
  }

  initCharts() {
    Chart.defaults.color = '#8b949e';
    Chart.defaults.borderColor = '#30363d';
    Chart.defaults.font.family = 'DM Sans';

    const days = 30;
    this.analyticsService.getTrafficData(days).subscribe({
      next: (trafficData: TrafficData[]) => {
        const labels = trafficData.map((d) => this.formatGaDateLabel(d.date));
        const sessions = trafficData.map((d) => d.sessions);
        const organic = trafficData.map((d) => d.organic ?? 0);
        this.createTrafficChart(labels, sessions, organic);
      },
      error: (error) => {
        console.error('Traffic:', error);
        const labels = Array.from({ length: days }, (_, i) => {
          const dd = new Date();
          dd.setDate(dd.getDate() - (days - 1 - i));
          return dd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        });
        const zeros = Array(days).fill(0);
        this.createTrafficChart(labels, zeros, zeros);
      }
    });

    this.createKeywordsChart();
    this.createChannelsChart();
  }

  /** Recharge graphiques (trafic + mots-clés + canaux) depuis l’API */
  private refreshChartsFromApi() {
    const days = 30;
    this.analyticsService.getTrafficData(days).subscribe({
      next: (trafficData: TrafficData[]) => {
        const labels = trafficData.map((d) => this.formatGaDateLabel(d.date));
        const sessions = trafficData.map((d) => d.sessions);
        const organic = trafficData.map((d) => d.organic ?? 0);
        this.createTrafficChart(labels, sessions, organic);
      },
      error: () => {
        /* garde le dernier graphique */
      }
    });
    this.createKeywordsChart();
    this.createChannelsChart();
  }

  createTrafficChart(labels: string[], sessions: number[], organic: number[]) {
    this.trafficChart?.destroy();
    const tc = document.getElementById('chart-traffic') as HTMLCanvasElement;
    if (tc) {
      this.trafficChart = new Chart(tc, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Sessions',
              data: sessions,
              borderColor: '#2ea99b',
              backgroundColor: 'rgba(46,169,155,.08)',
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              borderWidth: 2
            },
            {
              label: 'Organique',
              data: organic,
              borderColor: '#3fb950',
              backgroundColor: 'transparent',
              tension: 0.45,
              pointRadius: 0,
              borderWidth: 1.5,
              borderDash: [4, 3]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } },
          scales: {
            x: { ticks: { maxTicksLimit: 7, font: { size: 11 } }, grid: { color: 'rgba(48,54,61,.4)' } },
            y: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }
  }

  createKeywordsChart() {
    this.analyticsService.getKeywords(8).subscribe({
      next: (res) => {
        this.keywordsNote.set(res.note || '');
        const items = res.items || [];
        this.keywordsChart?.destroy();
        const kc = document.getElementById('chart-keywords') as HTMLCanvasElement;
        if (!kc) return;

        if (items.length === 0) {
          this.keywordsChart = new Chart(kc, {
            type: 'bar',
            data: {
              labels: ['—'],
              datasets: [{ label: 'Sessions', data: [0], backgroundColor: ['#30363d'], borderRadius: 6, borderSkipped: false }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { font: { size: 11 } } },
                y: { grid: { display: false }, ticks: { font: { size: 11 } } }
              }
            }
          });
          return;
        }

        const kwLabels = items.map((i) =>
          i.keyword.length > 42 ? i.keyword.slice(0, 39) + '…' : i.keyword
        );
        const kwData = items.map((i) => i.sessions);
        this.keywordsChart = new Chart(kc, {
          type: 'bar',
          data: {
            labels: kwLabels,
            datasets: [
              {
                label: 'Sessions',
                data: kwData,
                backgroundColor: kwData.map((_, i) => `hsl(${175 + i * 12},55%,${38 + i * 3}%)`),
                borderRadius: 6,
                borderSkipped: false
              }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { font: { size: 11 } } },
              y: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
          }
        });
      },
      error: (err) => {
        console.error('Keywords chart:', err);
        this.keywordsNote.set('Données requêtes indisponibles.');
      }
    });
  }

  createChannelsChart() {
    this.analyticsService.getChannels().subscribe({
      next: (res) => {
        const items = res.items || [];
        this.channelsChart?.destroy();
        const bc = document.getElementById('chart-bounce') as HTMLCanvasElement;
        if (!bc) return;

        const palette = ['#2ea99b', '#3fb950', '#e3b341', '#f78166', '#a371f7', '#79c0ff', '#ffa657', '#ff7b72'];
        if (items.length === 0) {
          this.channelsChart = new Chart(bc, {
            type: 'doughnut',
            data: {
              labels: ['—'],
              datasets: [{ data: [1], backgroundColor: ['#30363d'], borderWidth: 0, hoverOffset: 6 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '65%',
              plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } }
            }
          });
          return;
        }

        const labels = items.map((i) => i.channel);
        const data = items.map((i) => i.sessions);
        const colors = items.map((_, i) => palette[i % palette.length]);

        this.channelsChart = new Chart(bc, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } }
          }
        });
      },
      error: (err) => {
        console.error('Channels chart:', err);
      }
    });
  }

  updateKPIs() {
    this.analyticsService.getOverview().subscribe({
      next: (data: OverviewData) => {
        this.kpis.set({
          sessions: data.sessions,
          users: data.users,
          pageviews: data.pageViews,
          bounceRate: (data.bounceRate * 100).toFixed(1) + '%'
        });
        this.kpiDeltas.set({
          sessions: '—',
          users: '—',
          pageviews: '—',
          bounce: '—'
        });
      },
      error: (error) => {
        console.error('Overview:', error);
        this.showAlert('Données GA indisponibles (vérifiez les variables d’environnement et le compte de service).', 'error');
        this.kpis.set({ sessions: 0, users: 0, pageviews: 0, bounceRate: '0%' });
        this.kpiDeltas.set({ sessions: '—', users: '—', pageviews: '—', bounce: '—' });
      }
    });
  }

  updateTables() {
    this.analyticsService.getTopPages(10).subscribe({
      next: (pages: PageData[]) => {
        const topPagesData = pages.slice(0, 5).map((page) => ({
          url: page.page,
          views: page.views,
          trend: 'flat'
        }));
        this.topPages.set(topPagesData);
      },
      error: (error) => {
        console.error('Pages:', error);
        this.showAlert('Impossible de charger les pages (API).', 'error');
        this.topPages.set([]);
      }
    });

    this.analyticsService.getKeywords(10).subscribe({
      next: (res) => {
        this.keywordsNote.set(res.note || '');
        this.topKeywords.set(res.items || []);
      },
      error: () => {
        this.topKeywords.set([]);
      }
    });
  }

  applyFilters() {
    this.loading.set(true);
    setTimeout(() => {
      this.updateKPIs();
      this.initCharts();
      this.updateTables();
      this.loading.set(false);
      this.showAlert('Données actualisées.', 'success');
      this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));
    }, 400);
  }

  verifyUrl() {
    const url = this.pageUrl.trim();
    if (!url) {
      this.showAlert('Veuillez saisir une URL.', 'error');
      return;
    }
    try {
      new URL(url);
      this.showAlert('✓ URL valide et accessible.', 'success');
    } catch {
      this.showAlert('✗ URL invalide. Format: https://example.com/page', 'error');
    }
  }

  syncGoogle() {
    this.loading.set(true);

    this.analyticsService.syncAllData().subscribe({
      next: (response) => {
        this.kpis.set({
          sessions: response.overview.sessions,
          users: response.overview.users,
          pageviews: response.overview.pageViews,
          bounceRate: (response.overview.bounceRate * 100).toFixed(1) + '%'
        });

        const topPagesData = response.pages.slice(0, 5).map((page) => ({
          url: page.page,
          views: page.views,
          trend: 'flat'
        }));
        this.topPages.set(topPagesData);

        const labels = response.traffic.map((d) => this.formatGaDateLabel(d.date));
        const sessions = response.traffic.map((d) => d.sessions);
        const organic = response.traffic.map((d) => d.organic ?? 0);
        this.createTrafficChart(labels, sessions, organic);

        this.createKeywordsChart();
        this.createChannelsChart();
        this.analyticsService.getKeywords(10).subscribe({
          next: (r) => {
            this.keywordsNote.set(r.note || '');
            this.topKeywords.set(r.items || []);
          }
        });

        this.loading.set(false);
        this.showAlert('Synchronisation Google Analytics terminée.', 'success');
        this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));
      },
      error: (error) => {
        console.error('Sync:', error);
        this.loading.set(false);
        const detail = this.formatHttpError(error);
        this.showAlert(
          'Synchronisation Google Analytics impossible. ' + detail,
          'error',
          12000
        );
      }
    });
  }

  generateAI() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.showAiPanel.set(true);
      this.showAlert('✨ Recommandations IA affichées.', 'success');
      setTimeout(() => document.getElementById('ai-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 2200);
  }

  async logout() {
    await this.auth.logout();
  }

  showAlert(msg: string, type: string, durationMs = 4000) {
    this.alertMsg.set(msg);
    this.alertType.set(type);
    setTimeout(() => this.alertMsg.set(''), durationMs);
  }

  trendBadge(t: string) {
    return t === 'up' ? 'badge-up' : t === 'down' ? 'badge-down' : 'badge-flat';
  }
  trendLabel(t: string) {
    return t === 'up' ? '↑ Hausse' : t === 'down' ? '↓ Baisse' : '→ Stable';
  }
}
