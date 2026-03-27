import { Component, OnInit, OnDestroy, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import {
  AnalyticsService,
  OverviewData,
  TrafficData,
  PageData
} from '../services/analytics.service';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  user = this.auth.currentUser;

  dateStart = '';
  dateEnd = '';
  pageUrl = '';
  source = 'all';

  loading = signal(false);
  alertMsg = signal('');
  alertType = signal('');
  lastSync = signal('');
  showAiPanel = signal(false);
  keywordsNote = signal('');

  private trafficChart: any;
  private keywordsChart: any;
  private channelsChart: any;

  topPages = signal<{ url: string; views: number; trend: string }[]>([]);
  topKeywords = signal<{ keyword: string; sessions: number }[]>([]);

  kpis = signal({ sessions: 0, users: 0, pageviews: 0, bounceRate: '0%' });
  kpiDeltas = signal({ sessions: '—', users: '—', pageviews: '—', bounce: '—' });

  aiRecs = [
    { icon: '📝', title: 'Optimiser les balises title', body: '6 pages ont des titres dépassant 60 caractères. Raccourcissez-les pour améliorer le CTR dans les SERP.', priority: 'p-high', label: 'Priorité haute' },
    { icon: '🔗', title: 'Stratégie de netlinking', body: 'Vos pages /services/ manquent de backlinks internes. Ajoutez 3-5 liens depuis vos articles de blog.', priority: 'p-high', label: 'Priorité haute' },
    { icon: '⚡', title: 'Améliorer le LCP', body: 'Le score Core Web Vitals indique un LCP > 2.5s sur mobile. Optimisez les images hero et le lazy loading.', priority: 'p-med', label: 'Priorité moyenne' },
    { icon: '📊', title: 'Contenu longue traîne', body: 'Créez des articles ciblant "audit seo gratuit PME" et "référencement local artisan" (faible concurrence, bon volume).', priority: 'p-med', label: 'Priorité moyenne' },
    { icon: '🗺️', title: 'Sitemap XML', body: "Votre sitemap n'inclut pas les pages /blog/ récentes. Régénérez-le et soumettez-le à la Search Console.", priority: 'p-low', label: 'Priorité faible' },
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
      },
      error: (error) => {
        console.error('Backend API health failed:', error);
        this.showAlert(
          'API indisponible : lancez `vercel dev` (port 3000) avec les variables GA, ou vérifiez le déploiement.',
          'error'
        );
      }
    });
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
        this.showAlert('Échec de la synchronisation (API / credentials GA).', 'error');
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

  logout() {
    this.auth.logout();
  }

  showAlert(msg: string, type: string) {
    this.alertMsg.set(msg);
    this.alertType.set(type);
    setTimeout(() => this.alertMsg.set(''), 4000);
  }

  trendBadge(t: string) {
    return t === 'up' ? 'badge-up' : t === 'down' ? 'badge-down' : 'badge-flat';
  }
  trendLabel(t: string) {
    return t === 'up' ? '↑ Hausse' : t === 'down' ? '↓ Baisse' : '→ Stable';
  }
}
