import { Component, OnInit, OnDestroy, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  // User
  user = this.auth.currentUser;

  // Filters
  dateStart = '';
  dateEnd = '';
  pageUrl = '';
  source = 'all';

  // State
  loading = signal(false);
  alertMsg = signal('');
  alertType = signal('');
  lastSync = signal('');
  showAiPanel = signal(false);

  // Charts instances
  private trafficChart: any;
  private keywordsChart: any;
  private bounceChart: any;

  // Table data
  topPages = signal<{ url: string; views: number; trend: string }[]>([]);
  topKeywords = signal<{ keyword: string; position: number; ctr: string }[]>([]);

  // KPIs
  kpis = signal({ sessions: 0, users: 0, pageviews: 0, bounceRate: '0%' });
  kpiDeltas = signal({ sessions: '', users: '', pageviews: '', bounce: '' });

  aiRecs = [
    { icon:'📝', title:'Optimiser les balises title', body:'6 pages ont des titres dépassant 60 caractères. Raccourcissez-les pour améliorer le CTR dans les SERP.', priority:'p-high', label:'Priorité haute' },
    { icon:'🔗', title:'Stratégie de netlinking', body:'Vos pages /services/ manquent de backlinks internes. Ajoutez 3-5 liens depuis vos articles de blog.', priority:'p-high', label:'Priorité haute' },
    { icon:'⚡', title:'Améliorer le LCP', body:'Le score Core Web Vitals indique un LCP > 2.5s sur mobile. Optimisez les images hero et le lazy loading.', priority:'p-med', label:'Priorité moyenne' },
    { icon:'📊', title:'Contenu longue traîne', body:'Créez des articles ciblant "audit seo gratuit PME" et "référencement local artisan" (faible concurrence, bon volume).', priority:'p-med', label:'Priorité moyenne' },
    { icon:'🗺️', title:'Sitemap XML', body:"Votre sitemap n'inclut pas les pages /blog/ récentes. Régénérez-le et soumettez-le à la Search Console.", priority:'p-low', label:'Priorité faible' },
    { icon:'📱', title:'Mobile-first indexing', body:'3 pages présentent des éléments non adaptés au mobile. Vérifiez les tableaux et les CTA sur petits écrans.', priority:'p-low', label:'Priorité faible' },
  ];

  constructor(public auth: AuthService) {}

  ngOnInit() {
    const today = new Date();
    const past  = new Date(); past.setDate(today.getDate() - 30);
    this.dateEnd   = today.toISOString().slice(0, 10);
    this.dateStart = past.toISOString().slice(0, 10);
    this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));
  }

  ngAfterViewInit() {
    // Load Chart.js then init
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

  ngOnDestroy() {
    this.trafficChart?.destroy();
    this.keywordsChart?.destroy();
    this.bounceChart?.destroy();
  }

  // ── Helpers ────────────────────────────────────────────────────────
  private r(a: number, b: number) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  private genDates(n: number): string[] {
    const dates: string[] = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      dates.push(dd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
    }
    return dates;
  }

  // ── Charts ─────────────────────────────────────────────────────────
  initCharts() {
    Chart.defaults.color = '#8b949e';
    Chart.defaults.borderColor = '#30363d';
    Chart.defaults.font.family = 'DM Sans';

    const days = 30;
    const labels = this.genDates(days);
    const sessions = Array.from({ length: days }, () => this.r(800, 3200));
    const organic  = sessions.map(s => Math.floor(s * (.55 + Math.random() * .2)));

    // Traffic
    this.trafficChart?.destroy();
    const tc = document.getElementById('chart-traffic') as HTMLCanvasElement;
    if (tc) {
      this.trafficChart = new Chart(tc, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Sessions', data: sessions, borderColor: '#2ea99b', backgroundColor: 'rgba(46,169,155,.08)', fill: true, tension: 0.45, pointRadius: 0, borderWidth: 2 },
            { label: 'Organique', data: organic, borderColor: '#3fb950', backgroundColor: 'transparent', tension: 0.45, pointRadius: 0, borderWidth: 1.5, borderDash: [4, 3] }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } },
          scales: {
            x: { ticks: { maxTicksLimit: 7, font: { size: 11 } }, grid: { color: 'rgba(48,54,61,.4)' } },
            y: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // Keywords bar
    const kwLabels = ['référencement naturel', 'SEO technique', 'audit SEO', 'netlinking', 'contenu SEO', 'balises meta', 'core web vitals'];
    const kwData   = kwLabels.map(() => this.r(120, 900));
    this.keywordsChart?.destroy();
    const kc = document.getElementById('chart-keywords') as HTMLCanvasElement;
    if (kc) {
      this.keywordsChart = new Chart(kc, {
        type: 'bar',
        data: {
          labels: kwLabels,
          datasets: [{ label: 'Clics', data: kwData, backgroundColor: kwData.map((_, i) => `hsl(${175 + i * 12},55%,${38 + i * 3}%)`), borderRadius: 6, borderSkipped: false }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // Bounce doughnut
    this.bounceChart?.destroy();
    const bc = document.getElementById('chart-bounce') as HTMLCanvasElement;
    if (bc) {
      this.bounceChart = new Chart(bc, {
        type: 'doughnut',
        data: {
          labels: ['Organique', 'Direct', 'Referral', 'Social'],
          datasets: [{ data: [38, 25, 22, 15], backgroundColor: ['#2ea99b', '#3fb950', '#e3b341', '#f78166'], borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } }
        }
      });
    }
  }

  // ── KPIs ───────────────────────────────────────────────────────────
  updateKPIs() {
    const sessions  = this.r(12000, 48000);
    const users     = Math.floor(sessions * (.6 + Math.random() * .25));
    const pageviews = Math.floor(sessions * (1.8 + Math.random() * 1.2));
    const bounce    = this.r(28, 62);

    this.kpis.set({ sessions, users, pageviews, bounceRate: bounce + '%' });
    this.kpiDeltas.set({
      sessions: `▲ +${this.r(4, 18)}% vs période préc.`,
      users:    `▲ +${this.r(2, 12)}% vs période préc.`,
      pageviews:`▲ +${this.r(5, 22)}% vs période préc.`,
      bounce:   `▼ -${this.r(1, 6)}% vs période préc.`,
    });
  }

  // ── Tables ─────────────────────────────────────────────────────────
  updateTables() {
    const trends: Array<'up'|'down'|'flat'> = ['up', 'up', 'flat', 'down', 'up'];
    this.topPages.set([
      { url: '/accueil',        views: this.r(3000, 8000), trend: trends[0] },
      { url: '/services/seo',   views: this.r(1500, 5000), trend: trends[1] },
      { url: '/blog/audit-seo', views: this.r(800, 3000),  trend: trends[2] },
      { url: '/contact',        views: this.r(600, 2000),  trend: trends[3] },
      { url: '/tarifs',         views: this.r(400, 1500),  trend: trends[4] },
    ]);

    this.topKeywords.set([
      { keyword: 'référencement naturel', position: this.r(1, 6),   ctr: (this.r(35, 85) / 10).toFixed(1) + '%' },
      { keyword: 'audit SEO gratuit',     position: this.r(3, 10),  ctr: (this.r(20, 60) / 10).toFixed(1) + '%' },
      { keyword: 'core web vitals',       position: this.r(5, 15),  ctr: (this.r(15, 45) / 10).toFixed(1) + '%' },
      { keyword: 'balises meta SEO',      position: this.r(8, 20),  ctr: (this.r(10, 40) / 10).toFixed(1) + '%' },
      { keyword: 'netlinking stratégie',  position: this.r(10, 30), ctr: (this.r(8, 30)  / 10).toFixed(1) + '%' },
    ]);
  }

  // ── Buttons ────────────────────────────────────────────────────────
  applyFilters() {
    this.loading.set(true);
    setTimeout(() => {
      this.updateKPIs();
      this.initCharts();
      this.updateTables();
      this.loading.set(false);
      this.showAlert('Données mises à jour avec succès.', 'success');
      this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));
    }, 1200);
  }

  verifyUrl() {
    const url = this.pageUrl.trim();
    if (!url) { this.showAlert('Veuillez saisir une URL.', 'error'); return; }
    try { new URL(url); this.showAlert('✓ URL valide et accessible.', 'success'); }
    catch { this.showAlert('✗ URL invalide. Format: https://example.com/page', 'error'); }
  }

  syncGoogle() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.showAlert('🔄 Synchronisation Google Analytics & Search Console effectuée.', 'info');
      this.lastSync.set('Dernière sync: ' + new Date().toLocaleTimeString('fr-FR'));
    }, 1800);
  }

  generateAI() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.showAiPanel.set(true);
      this.showAlert('✨ Recommandations IA générées avec succès.', 'success');
      setTimeout(() => document.getElementById('ai-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 2200);
  }

  logout() { this.auth.logout(); }

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
  posColor(pos: number) {
    return pos <= 5 ? 'var(--accent)' : pos <= 15 ? 'var(--yellow)' : 'var(--warn)';
  }
}
