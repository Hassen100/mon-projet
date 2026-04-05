import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { getApiBaseUrl } from '../../api-base';

interface TopPage {
  page: string;
  views: number;
  trend: 'up' | 'down' | 'flat';
}

interface TopKeyword {
  keyword: string;
  position: number;
  ctr: string;
}

interface AIRecommendation {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  priorityLabel: string;
}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  last_login: string | null;
  is_admin: boolean;
}

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly api = getApiBaseUrl();

  trafficChart?: Chart;
  keywordsChart?: Chart;
  bounceChart?: Chart;

  kpiData = {
    sessions: 0,
    users: 0,
    pageviews: 0,
    bounceRate: 0
  };

  topPages: TopPage[] = [];
  topKeywords: TopKeyword[] = [];
  aiRecommendations: AIRecommendation[] = [];
  authUsers: AuthUser[] = [];
  showRecommendations = false;
  showAuthUsers = false;
  isLoadingAuthUsers = false;
  authUsersError = '';
  currentTime = new Date();
  userInitial = 'H';
  userName = 'hassen selmi';
  userEmail = '';
  isAdmin = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedName = localStorage.getItem('user_name');
      const storedEmail = localStorage.getItem('user_email');
      const storedIsAdmin = localStorage.getItem('user_is_admin');

      if (storedName) {
        this.userName = storedName;
        this.userInitial = storedName.charAt(0).toUpperCase();
      }

      if (storedEmail) {
        this.userEmail = storedEmail;
      }

      this.isAdmin = storedIsAdmin === 'true';
    }

    this.updateKPIs();
    this.updateTables();
    this.setRecommendations();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  logout(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');

    void this.router.navigateByUrl('/login').then((navigated) => {
      if (!navigated) {
        window.location.hash = '#/login';
      }
    });
  }

  applyFilters(): void {
    this.updateKPIs();
    this.updateTables();
    this.initCharts();
  }

  verifyUrl(): void {
    alert('URL valide');
  }

  syncGoogle(): void {
    alert('Synchronisation Google Analytics effectuee');
  }

  generateAIRecommendations(): void {
    this.showRecommendations = true;
  }

  async toggleAuthUsers(): Promise<void> {
    this.showAuthUsers = !this.showAuthUsers;

    if (!this.showAuthUsers || this.authUsers.length > 0 || this.isLoadingAuthUsers) {
      return;
    }

    await this.loadAuthUsers();
  }

  async refreshAuthUsers(): Promise<void> {
    await this.loadAuthUsers();
  }

  formatLastLogin(lastLogin: string | null): string {
    if (!lastLogin) {
      return 'Jamais';
    }

    return new Date(lastLogin).toLocaleString('fr-FR');
  }

  randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async loadAuthUsers(): Promise<void> {
    if (!this.isAdmin || !this.userEmail) {
      this.authUsersError = 'Acces admin requis';
      return;
    }

    this.isLoadingAuthUsers = true;
    this.authUsersError = '';

    try {
      const response = await fetch(
        `${this.api}/auth-users/?admin_email=${encodeURIComponent(this.userEmail)}`
      );
      const data = await response.json();

      if (!response.ok) {
        this.authUsersError = data.message || 'Impossible de charger les utilisateurs';
        this.cdr.detectChanges();
        return;
      }

      this.authUsers = data.users || [];
      this.cdr.detectChanges();
    } catch {
      this.authUsersError = 'Backend Django indisponible sur 127.0.0.1:8000';
      this.cdr.detectChanges();
    } finally {
      this.isLoadingAuthUsers = false;
      this.cdr.detectChanges();
    }
  }

  private initCharts(): void {
    this.destroyCharts();
    this.initTrafficChart();
    this.initKeywordsChart();
    this.initBounceChart();
  }

  private initTrafficChart(): void {
    const ctx = document.getElementById('trafficChart') as HTMLCanvasElement | null;
    if (!ctx) {
      return;
    }

    const dates = this.generateDates(30);
    const sessions = dates.map(() => this.randomBetween(800, 3200));
    const organic = sessions.map((session) => Math.floor(session * (0.55 + Math.random() * 0.2)));

    this.trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Sessions',
            data: sessions,
            borderColor: '#39c7c2',
            backgroundColor: 'rgba(57,199,194,0.10)',
            fill: true,
            tension: 0.45,
            pointRadius: 0,
            borderWidth: 2.5
          },
          {
            label: 'Organique',
            data: organic,
            borderColor: '#4bd865',
            backgroundColor: 'transparent',
            tension: 0.45,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [6, 4]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 10, padding: 14, font: { size: 11 } }
          }
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 7, font: { size: 11 } },
            grid: { color: 'rgba(48,54,61,0.4)' }
          },
          y: {
            grid: { color: 'rgba(48,54,61,0.4)' },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  private initKeywordsChart(): void {
    const ctx = document.getElementById('keywordsChart') as HTMLCanvasElement | null;
    if (!ctx) {
      return;
    }

    const keywordLabels = [
      'referencement naturel',
      'SEO technique',
      'audit SEO',
      'netlinking',
      'contenu SEO',
      'balises meta',
      'core web vitals'
    ];
    const keywordData = keywordLabels.map(() => this.randomBetween(120, 900));

    this.keywordsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: keywordLabels,
        datasets: [
          {
            label: 'Clics',
            data: keywordData,
            backgroundColor: ['#38bdb9', '#43afd2', '#4d96dd', '#4b86d8', '#4f6fd8', '#5f59d7', '#7357d9'],
            borderRadius: 8,
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
          x: {
            grid: { color: 'rgba(48,54,61,0.4)' },
            ticks: { font: { size: 11 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  private initBounceChart(): void {
    const ctx = document.getElementById('bounceChart') as HTMLCanvasElement | null;
    if (!ctx) {
      return;
    }

    this.bounceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Organique', 'Direct', 'Referral', 'Social'],
        datasets: [
          {
            data: [38, 25, 22, 15],
            backgroundColor: ['#3eb2a8', '#44bf52', '#efbf3b', '#fb7f62'],
            borderWidth: 0,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 10, padding: 14, font: { size: 11 } }
          }
        }
      }
    });
  }

  private updateKPIs(): void {
    const sessions = this.randomBetween(12000, 48000);
    const users = Math.floor(sessions * (0.6 + Math.random() * 0.25));
    const pageviews = Math.floor(sessions * (1.8 + Math.random() * 1.2));
    const bounce = this.randomBetween(28, 62);

    this.kpiData.sessions = sessions;
    this.kpiData.users = users;
    this.kpiData.pageviews = pageviews;
    this.kpiData.bounceRate = bounce;

    this.animateNumber('sessions', sessions);
    this.animateNumber('users', users);
    this.animateNumber('pageviews', pageviews);
  }

  private animateNumber(id: string, target: number): void {
    const element = document.getElementById(id);
    const duration = 600;
    const fps = 30;
    const steps = duration / (1000 / fps);
    let current = 0;
    const step = target / steps;

    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      if (element) {
        element.textContent = Math.floor(current).toLocaleString('fr-FR');
      }
      if (current >= target) {
        clearInterval(timer);
      }
    }, 1000 / fps);
  }

  private updateTables(): void {
    this.topPages = [
      { page: '/accueil', views: this.randomBetween(3000, 8000), trend: 'up' },
      { page: '/services/seo', views: this.randomBetween(1500, 5000), trend: 'up' },
      { page: '/blog/audit-seo', views: this.randomBetween(800, 3000), trend: 'flat' },
      { page: '/contact', views: this.randomBetween(600, 2000), trend: 'down' },
      { page: '/tarifs', views: this.randomBetween(400, 1500), trend: 'up' }
    ];

    this.topKeywords = [
      { keyword: 'referencement naturel', position: this.randomBetween(1, 6), ctr: `${(this.randomBetween(35, 85) / 10).toFixed(1)}%` },
      { keyword: 'audit SEO gratuit', position: this.randomBetween(3, 10), ctr: `${(this.randomBetween(20, 60) / 10).toFixed(1)}%` },
      { keyword: 'core web vitals', position: this.randomBetween(5, 15), ctr: `${(this.randomBetween(15, 45) / 10).toFixed(1)}%` },
      { keyword: 'balises meta SEO', position: this.randomBetween(8, 20), ctr: `${(this.randomBetween(10, 40) / 10).toFixed(1)}%` },
      { keyword: 'netlinking strategie', position: this.randomBetween(10, 30), ctr: `${(this.randomBetween(8, 30) / 10).toFixed(1)}%` }
    ];
  }

  private setRecommendations(): void {
    this.aiRecommendations = [
      {
        icon: 'Title',
        title: 'Optimiser les balises title',
        description: '6 pages ont des titres depassant 60 caracteres. Raccourcissez-les pour ameliorer le CTR dans les SERP.',
        priority: 'high',
        priorityLabel: 'PRIORITE HAUTE'
      },
      {
        icon: 'Links',
        title: 'Strategie de netlinking',
        description: 'Vos pages services manquent de backlinks internes. Ajoutez 3 a 5 liens depuis vos articles de blog.',
        priority: 'high',
        priorityLabel: 'PRIORITE HAUTE'
      },
      {
        icon: 'LCP',
        title: 'Ameliorer le LCP',
        description: 'Le score Core Web Vitals indique un LCP superieur a 2.5s sur mobile. Optimisez les images hero et le lazy loading.',
        priority: 'medium',
        priorityLabel: 'PRIORITE MOYENNE'
      },
      {
        icon: 'Content',
        title: 'Contenu longue traine',
        description: 'Creez des articles cibles pour capter plus de trafic sur des requetes SEO a forte intention.',
        priority: 'medium',
        priorityLabel: 'PRIORITE MOYENNE'
      },
      {
        icon: 'Map',
        title: 'Sitemap XML',
        description: 'Votre sitemap ninclut pas les pages blog recentes. Regenerez-le et soumettez-le a la Search Console.',
        priority: 'low',
        priorityLabel: 'PRIORITE FAIBLE'
      },
      {
        icon: 'Mobile',
        title: 'Mobile-first indexing',
        description: '3 pages presentent des elements non adaptes au mobile. Verifiez les tableaux et les CTA sur petits ecrans.',
        priority: 'low',
        priorityLabel: 'PRIORITE FAIBLE'
      }
    ];
  }

  private generateDates(days: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      dates.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
    }
    return dates;
  }

  private destroyCharts(): void {
    this.trafficChart?.destroy();
    this.keywordsChart?.destroy();
    this.bounceChart?.destroy();
  }
}
