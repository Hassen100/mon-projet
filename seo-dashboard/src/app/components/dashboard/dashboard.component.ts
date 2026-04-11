import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { getApiBaseUrl } from '../../api-base';
import {
  AnalyticsService,
  PageRecommendationResponse,
  SearchDailyData,
} from '../../services/analytics.service';
import { CurlService } from '../../services/curl.service';
import { CurlModalComponent } from '../curl-modal/curl-modal.component';

interface TopPage {
  page_path: string;
  views: number;
  trend: 'up' | 'down' | 'flat';
}

interface TopKeyword {
  query: string;
  position: number;
  ctr: string;
}

interface TrafficPoint {
  date: string;
  sessions: number;
  active_users: number;
  page_views: number;
}

interface SearchPoint extends SearchDailyData {}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  last_login: string | null;
  is_admin: boolean;
}

interface RecommendationCategory {
  title: string;
  subtitle: string;
  icon: string;
  items: string[];
}

Chart.register(...registerables);
Chart.defaults.color = '#ffffff';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly api = getApiBaseUrl();
  private readonly analyticsService = inject(AnalyticsService);
  private readonly curlService = inject(CurlService);

  trafficChart?: Chart;
  searchConsoleChart?: Chart;
  keywordsChart?: Chart;
  bounceChart?: Chart;

  sessions = 0;
  users = 0;
  pageViews = 0;
  bounceRate = 0;
  avgSessionDuration = 0;
  searchClicks = 0;
  searchImpressions = 0;
  searchCtr = 0;
  searchPosition = 0;

  topPages: TopPage[] = [];
  topKeywords: TopKeyword[] = [];
  trafficData: TrafficPoint[] = [];
  searchData: SearchPoint[] = [];
  recommendationCategories: RecommendationCategory[] = [];
  authUsers: AuthUser[] = [];
  showAuthUsers = false;
  selectedPeriod = 30;
  selectedMode = 'period';
  userId = 0;

  isLoadingKPIs = false;
  isLoadingPages = false;
  isLoadingKeywords = false;
  isLoadingSearchConsole = false;
  isLoadingAuthUsers = false;
  isLoadingRecommendations = false;

  showCurlModal = false;
  userToken = '';

  userInitial = 'H';
  userName = 'hassen selmi';
  userEmail = '';
  isAdmin = false;
  isSuperUser = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadUserData();
    }
  }

  ngOnInit() {
    this.loadAuthUsers();
    this.refreshDashboard(true);
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroyCharts();
  }

  private loadUserData(): void {
    const authData = localStorage.getItem('auth_token');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        this.userToken = parsed.token || '';
        this.userName = parsed.username || 'hassen selmi';
        this.userEmail = parsed.email || '';
        this.userId = parsed.id || 0;
        this.isAdmin = parsed.is_admin || false;
        this.isSuperUser = parsed.is_superuser || false;
        this.userInitial = this.userName.charAt(0).toUpperCase();
      } catch {
        // Ignore malformed local storage data.
      }
    }
  }

  private getEffectiveDays(): number {
    return this.selectedMode === 'period' ? this.selectedPeriod : 1;
  }

  refreshDashboard(refreshFromGoogle: boolean = false): void {
    this.updateKPIs(refreshFromGoogle);
    this.loadSearchConsole(refreshFromGoogle);
    this.loadTopPages(refreshFromGoogle);
    this.loadTopKeywords(refreshFromGoogle);
  }

  updateKPIs(refreshFromGoogle: boolean = false): void {
    this.isLoadingKPIs = true;
    this.analyticsService.getAnalyticsSummary(this.getEffectiveDays(), this.selectedMode, refreshFromGoogle).subscribe({
      next: (data: any) => {
        this.sessions = data.sessions || 0;
        this.users = data.users || 0;
        this.pageViews = data.page_views || 0;
        this.bounceRate = data.bounce_rate || 0;
        this.avgSessionDuration = data.avg_session_duration || 0;
        this.isLoadingKPIs = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
        this.createBounceChart();
        this.loadTrafficChart();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des KPIs:', error);
        this.isLoadingKPIs = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
      }
    });
  }

  loadSearchConsole(refreshFromGoogle: boolean = false): void {
    if (!this.userId) {
      this.searchClicks = 0;
      this.searchImpressions = 0;
      this.searchCtr = 0;
      this.searchPosition = 0;
      this.searchData = [];
      this.createSearchConsoleChart();
      return;
    }

    this.isLoadingSearchConsole = true;
    this.analyticsService.getSearchSummary(this.userId, this.getEffectiveDays(), refreshFromGoogle, this.selectedMode).subscribe({
      next: (data) => {
        const summary = this.resolveSearchSummary(data);
        this.searchClicks = summary.clicks || 0;
        this.searchImpressions = summary.impressions || 0;
        this.searchCtr = summary.ctr || 0;
        this.searchPosition = summary.position || 0;
        this.updateRecommendations();
        this.cdr.detectChanges();
        this.loadSearchConsoleChart();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement de Google Search Console:', error);
        this.searchClicks = 0;
        this.searchImpressions = 0;
        this.searchCtr = 0;
        this.searchPosition = 0;
        this.searchData = [];
        this.isLoadingSearchConsole = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
        this.createSearchConsoleChart();
      }
    });
  }

  private resolveSearchSummary(data: { search?: { clicks: number; impressions: number; ctr: number; position: number }; daily_data?: SearchDailyData[]; }): { clicks: number; impressions: number; ctr: number; position: number } {
    if (data.search) {
      return data.search;
    }

    const dailyData = data.daily_data || [];
    if (dailyData.length === 0) {
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }

    const clicks = dailyData.reduce((total, point) => total + (point.clicks || 0), 0);
    const impressions = dailyData.reduce((total, point) => total + (point.impressions || 0), 0);
    const weightedPosition = dailyData.reduce((total, point) => total + (point.position || 0) * (point.impressions || 0), 0);

    return {
      clicks,
      impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      position: impressions > 0 ? weightedPosition / impressions : 0,
    };
  }

  onModeChange(): void {
    this.refreshDashboard(true);
  }

  loadTopPages(refreshFromGoogle: boolean = false): void {
    this.isLoadingPages = true;
    this.analyticsService.getTopPages(this.getEffectiveDays(), 20, this.selectedMode, refreshFromGoogle).subscribe({
      next: (data: any) => {
        this.topPages = (data.pages || []).map((page: any) => ({
          page_path: page.page_path,
          views: page.views,
          trend: 'flat'
        }));
        this.isLoadingPages = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des pages:', error);
        this.isLoadingPages = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
      }
    });
  }

  loadTopKeywords(refreshFromGoogle: boolean = false): void {
    this.isLoadingKeywords = true;
    this.analyticsService.getTopQueries(this.getEffectiveDays(), 20, this.selectedMode, refreshFromGoogle).subscribe({
      next: (data: any) => {
        this.topKeywords = (data.queries || []).map((keyword: any) => ({
          query: keyword.query,
          position: keyword.position,
          ctr: keyword.ctr
        }));
        this.isLoadingKeywords = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
        this.createKeywordsChart();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des mots-clés:', error);
        this.isLoadingKeywords = false;
        this.updateRecommendations();
        this.cdr.detectChanges();
      }
    });
  }

  private updateRecommendations(): void {
    if (!this.userToken || this.sessions <= 0) {
      this.recommendationCategories = [];
      this.isLoadingRecommendations = false;
      return;
    }

    this.isLoadingRecommendations = true;
    this.analyticsService.getPageRecommendations({
      url: this.topPages[0]?.page_path || '/',
      bounce_rate: this.bounceRate || 0,
      avg_duration: this.formatDuration(this.avgSessionDuration),
      sessions: this.sessions || 0,
      position: this.searchPosition || this.topKeywords[0]?.position || null,
      impressions: this.searchImpressions || 0,
      ctr: this.searchCtr || 0,
    }).subscribe({
      next: (response: PageRecommendationResponse) => {
        const items = response.recommendations || [];
        this.recommendationCategories = this.buildRecommendationCategories(items);
        this.isLoadingRecommendations = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des recommandations IA:', error);
        this.recommendationCategories = this.buildRecommendationCategories([]);
        this.isLoadingRecommendations = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildRecommendationCategories(items: string[]): RecommendationCategory[] {
    const pageIssues = items.filter((item) => /rebond|duree|contenu|structure|vitesse|page/i.test(item));
    const keywordOpportunities = items.filter((item) => /mot-cl|position|ctr|impression|title|meta|snippet/i.test(item));
    const trafficAnomalies = items.filter((item) => /traffic|session|anomal|verification|alerte|baisse|hausse/i.test(item));
    const technicalOptimization = items.filter((item) => /technique|performance|mobile|core web vitals|schema|chargement|lighthouse|crux/i.test(item));

    return [
      {
        title: 'Pages à problème',
        subtitle: 'Taux de rebond, durée, trafic entrant',
        icon: '📄',
        items: pageIssues.length ? pageIssues : [
          `Surveillez ${this.topPages[0]?.page_path || '/'} si le rebond reste à ${this.bounceRate}%.`
        ],
      },
      {
        title: 'Opportunités de mots-clés',
        subtitle: 'Positions, impressions, CTR',
        icon: '🎯',
        items: keywordOpportunities.length ? keywordOpportunities : [
          `Optimisez le snippet si la position moyenne est ${this.searchPosition || 0} avec ${this.searchImpressions || 0} impressions.`
        ],
      },
      {
        title: 'Anomalies de trafic',
        subtitle: 'Évolution des sessions (GA4)',
        icon: '📉',
        items: trafficAnomalies.length ? trafficAnomalies : [
          `Contrôlez l'évolution des ${this.sessions} sessions sur ${this.getEffectiveDays()} jours pour détecter une anomalie.`
        ],
      },
      {
        title: 'Optimisation technique',
        subtitle: 'Core Web Vitals, mobile, chargement',
        icon: '⚙️',
        items: technicalOptimization.length ? technicalOptimization : [
          'Ajoutez CrUX ou Lighthouse pour afficher des recommandations techniques plus précises.'
        ],
      },
    ];
  }

  private formatDuration(durationInSeconds: number): string {
    const totalSeconds = Math.max(0, Math.round(durationInSeconds || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  loadAuthUsers(): void {
    if (!this.isSuperUser) return;

    this.isLoadingAuthUsers = true;
    fetch(`${this.api}/auth-users/`, {
      headers: {
        'Authorization': `Token ${this.userToken}`,
        'Content-Type': 'application/json'
      }
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors du chargement des utilisateurs');
        }
        return data;
      })
      .then((data: any) => {
        this.authUsers = data.users || [];
        this.isLoadingAuthUsers = false;
        this.cdr.detectChanges();
      })
      .catch((error: any) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.isLoadingAuthUsers = false;
        this.cdr.detectChanges();
      });
  }

  onPeriodChange(): void {
    if (this.selectedPeriod === 0) {
      this.selectedMode = 'today';
    } else if (this.selectedPeriod === -1) {
      this.selectedMode = 'yesterday';
    } else {
      this.selectedMode = 'period';
    }
    this.refreshDashboard(true);
  }

  toggleAuthUsers(): void {
    if (this.isSuperUser && !this.showAuthUsers && this.authUsers.length === 0 && !this.isLoadingAuthUsers) {
      this.loadAuthUsers();
    }
    this.showAuthUsers = !this.showAuthUsers;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');
    localStorage.removeItem('user_is_superuser');
    localStorage.removeItem('user_id');
    this.router.navigate(['/login']);
  }

  scrollToAIRecommendations(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const target = document.getElementById('ai-recommendations');
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  initializeCharts(): void {
    this.destroyCharts();
    this.createBounceChart();
    this.createKeywordsChart();
    this.loadTrafficChart();
    this.loadSearchConsoleChart();
  }

  private loadTrafficChart(): void {
    if (!this.userId) {
      this.trafficData = [];
      this.createTrafficChart();
      return;
    }

    this.analyticsService.getAnalyticsGraphData(this.userId, this.getEffectiveDays(), this.selectedMode).subscribe({
      next: (data) => {
        this.trafficData = data.daily_data || [];
        this.createTrafficChart();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du trafic organique:', error);
        this.trafficData = [];
        this.createTrafficChart();
      }
    });
  }

  private loadSearchConsoleChart(): void {
    if (!this.userId) {
      this.searchData = [];
      this.isLoadingSearchConsole = false;
      this.createSearchConsoleChart();
      return;
    }

    this.analyticsService.getSearchGraphData(this.userId, this.getEffectiveDays(), this.selectedMode).subscribe({
      next: (data) => {
        this.searchData = this.normalizeSearchConsoleData(data.daily_data || []);
        this.isLoadingSearchConsole = false;
        this.createSearchConsoleChart();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement du graphe Search Console:', error);
        this.searchData = [];
        this.isLoadingSearchConsole = false;
        this.createSearchConsoleChart();
      }
    });
  }

  private normalizeSearchConsoleData(data: SearchPoint[]): SearchPoint[] {
    if (this.selectedMode !== 'today' || data.length === 0 || !data.some((point) => point.date.includes('T'))) {
      return data;
    }

    const parsedPoints = data
      .map((point) => ({
        ...point,
        parsedDate: new Date(point.date),
      }))
      .filter((point) => !Number.isNaN(point.parsedDate.getTime()))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (parsedPoints.length === 0) {
      return data;
    }

    const pointMap = new Map<string, SearchPoint>();
    for (const point of parsedPoints) {
      const slot = this.toHourlySlot(point.parsedDate);
      pointMap.set(slot, {
        date: point.parsedDate.toISOString(),
        clicks: point.clicks,
        impressions: point.impressions,
        ctr: point.ctr,
        position: point.position,
      });
    }

    const lastPoint = parsedPoints[parsedPoints.length - 1].parsedDate;
    const startPoint = new Date(lastPoint);
    startPoint.setMinutes(0, 0, 0);
    startPoint.setHours(startPoint.getHours() - 23);

    const expanded: SearchPoint[] = [];
    for (let index = 0; index < 24; index += 1) {
      const slotDate = new Date(startPoint);
      slotDate.setHours(startPoint.getHours() + index);
      const slot = this.toHourlySlot(slotDate);
      expanded.push(
        pointMap.get(slot) || {
          date: slotDate.toISOString(),
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        }
      );
    }

    return expanded;
  }

  private toHourlySlot(date: Date): string {
    const slotDate = new Date(date);
    slotDate.setMinutes(0, 0, 0);
    return slotDate.toISOString();
  }

  private formatTrafficLabel(date: string): string {
    if (date.includes('T')) {
      const parsedWithTime = new Date(date);
      if (!Number.isNaN(parsedWithTime.getTime())) {
        return parsedWithTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
    }

    if (/^\d{8}$/.test(date)) {
      return `${date.slice(6, 8)}/${date.slice(4, 6)}`;
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  private createTrafficChart(): void {
    const ctx = document.getElementById('trafficChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas trafficChart non trouvé');
      return;
    }

    if (this.trafficChart) {
      this.trafficChart.destroy();
    }

    this.trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.trafficData.map((point) => this.formatTrafficLabel(point.date)),
        datasets: [{
          label: 'Sessions',
          data: this.trafficData.map((point) => point.sessions),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderWidth: 3,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#ffffff', font: { size: 12 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        }
      }
    });
  }

  private createSearchConsoleChart(): void {
    const ctx = document.getElementById('searchConsoleChart') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    if (this.searchConsoleChart) {
      this.searchConsoleChart.destroy();
    }

    this.searchConsoleChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.searchData.map((point) => this.formatTrafficLabel(point.date)),
        datasets: [
          {
            label: 'Clics',
            data: this.searchData.map((point) => point.clicks),
            borderColor: '#4f8df7',
            backgroundColor: 'rgba(79, 141, 247, 0.16)',
            borderWidth: 3,
            pointBackgroundColor: '#4f8df7',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.35
          },
          {
            label: 'Impressions',
            data: this.searchData.map((point) => point.impressions),
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            borderWidth: 3,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#ffffff', font: { size: 12 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        }
      }
    });
  }

  private createKeywordsChart(): void {
    const ctx = document.getElementById('keywordsChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas keywordsChart non trouvé');
      return;
    }

    if (this.keywordsChart) {
      this.keywordsChart.destroy();
    }

    const keywordsData = this.topKeywords.slice(0, 5);
    const labels = keywordsData.map((keyword) => keyword.query || 'N/A');
    const data = keywordsData.map((keyword) => keyword.position || 0);

    this.keywordsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Position',
          data,
          backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e'],
          borderRadius: 8,
          borderSkipped: false,
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#ffffff', font: { size: 12, weight: 'bold' } }
          }
        }
      }
    });
  }

  private createBounceChart(): void {
    const ctx = document.getElementById('bounceChart') as HTMLCanvasElement;
    if (!ctx) {
      console.error('Canvas bounceChart non trouvé');
      return;
    }

    if (this.bounceChart) {
      this.bounceChart.destroy();
    }

    const bounceRateValue = this.bounceRate || 30;

    this.bounceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Rebond', 'Restant'],
        datasets: [{
          data: [bounceRateValue, 100 - bounceRateValue],
          backgroundColor: ['#f43f5e', '#10b981'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: { size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  private destroyCharts(): void {
    if (this.trafficChart) {
      this.trafficChart.destroy();
      this.trafficChart = undefined;
    }
    if (this.searchConsoleChart) {
      this.searchConsoleChart.destroy();
      this.searchConsoleChart = undefined;
    }
    if (this.keywordsChart) {
      this.keywordsChart.destroy();
      this.keywordsChart = undefined;
    }
    if (this.bounceChart) {
      this.bounceChart.destroy();
      this.bounceChart = undefined;
    }
  }
}
