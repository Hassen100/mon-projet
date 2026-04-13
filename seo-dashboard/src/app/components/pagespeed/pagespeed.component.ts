import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getApiBaseUrl } from '../../api-base';

interface PageSpeedResponse {
  url: string;
  strategy: 'mobile' | 'desktop';
  cached: boolean;
  staleCache?: boolean;
  analysisDurationMs?: number;
  analysisTimestamp?: string;
  categories: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  coreWebVitals: {
    loadingExperience: {
      overallCategory?: string;
      metrics: Record<string, { percentile?: number; category?: string }>;
    };
    originLoadingExperience: {
      overallCategory?: string;
      metrics: Record<string, { percentile?: number; category?: string }>;
    };
  };
  lighthouseResult: any;
}

type LocalPageSpeedResponse = PageSpeedResponse & { localCached?: boolean };

@Component({
  selector: 'app-pagespeed',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ps-page">
      <header class="ps-header">
        <span class="ps-kicker">SEO Dashboard</span>
        <h1>PageSpeed Insights</h1>
        <p>Analyse complete d'une URL avec un rendu clair, visuel et actionnable.</p>
      </header>

      <section class="ps-search">
        <input
          type="url"
          [(ngModel)]="url"
          name="url"
          placeholder="Saisir l'URL d'une page Web"
          required
        />
        <select [(ngModel)]="strategy" name="strategy">
          <option value="mobile">mobile</option>
          <option value="desktop">desktop</option>
        </select>
        <button type="button" (click)="analyze()" [disabled]="loading">{{ loading ? 'Analyse...' : 'Analyser' }}</button>
      </section>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <section class="loading-state" *ngIf="loading && !result">
        <div class="pulse-bar"></div>
        <p>Analyse en cours. Recuperation des donnees Google PageSpeed...</p>
      </section>

      <section class="ps-results" *ngIf="result">
        <div class="panel summary-panel">
          <div class="summary-score" [class.good]="scoreBand(overallScore()) === 'good'" [class.warn]="scoreBand(overallScore()) === 'warn'" [class.bad]="scoreBand(overallScore()) === 'bad'">
            <div class="summary-ring">
              <strong>{{ overallScore() }}</strong>
              <span>Score global</span>
            </div>
            <p>{{ visualMessage(overallScore()) }}</p>
          </div>

          <div class="summary-preview" *ngIf="screenshotDataUrl() as shot">
            <img [src]="shot" alt="Capture de la page analysee" />
          </div>
        </div>

        <div class="score-row">
          <article class="score-chip" [class.good]="scoreBand(result.categories.performance) === 'good'" [class.warn]="scoreBand(result.categories.performance) === 'warn'" [class.bad]="scoreBand(result.categories.performance) === 'bad'">
            <div class="score-circle">{{ result.categories.performance }}</div>
            <span>Performances</span>
            <small>{{ scoreLabel(result.categories.performance) }}</small>
          </article>
          <article class="score-chip" [class.good]="scoreBand(result.categories.accessibility) === 'good'" [class.warn]="scoreBand(result.categories.accessibility) === 'warn'" [class.bad]="scoreBand(result.categories.accessibility) === 'bad'">
            <div class="score-circle">{{ result.categories.accessibility }}</div>
            <span>Accessibilité</span>
            <small>{{ scoreLabel(result.categories.accessibility) }}</small>
          </article>
          <article class="score-chip" [class.good]="scoreBand(result.categories.bestPractices) === 'good'" [class.warn]="scoreBand(result.categories.bestPractices) === 'warn'" [class.bad]="scoreBand(result.categories.bestPractices) === 'bad'">
            <div class="score-circle">{{ result.categories.bestPractices }}</div>
            <span>Bonnes pratiques</span>
            <small>{{ scoreLabel(result.categories.bestPractices) }}</small>
          </article>
          <article class="score-chip" [class.good]="scoreBand(result.categories.seo) === 'good'" [class.warn]="scoreBand(result.categories.seo) === 'warn'" [class.bad]="scoreBand(result.categories.seo) === 'bad'">
            <div class="score-circle">{{ result.categories.seo }}</div>
            <span>SEO</span>
            <small>{{ scoreLabel(result.categories.seo) }}</small>
          </article>
        </div>

        <div class="meta">
          <span>URL: {{ result.url }}</span>
          <span>Mode: {{ result.strategy }}</span>
          <span>Cached: {{ result.cached ? 'oui' : 'non' }}</span>
          <span *ngIf="result.localCached">Affichage instantane: cache local</span>
          <span *ngIf="result.staleCache">Source: cache serveur (ancienne analyse)</span>
          <span>Duree: {{ formatDuration(result.analysisDurationMs) }}</span>
          <span *ngIf="result.analysisTimestamp">Analyse: {{ result.analysisTimestamp }}</span>
        </div>

        <div class="panel visual-panel">
          <img [src]="visualForScore(result.categories.performance)" alt="Etat visuel de la performance" />
          <div>
            <h3>Resume visuel</h3>
            <p>
              {{ visualMessage(result.categories.performance) }}
            </p>
          </div>
        </div>

        <div class="panel">
          <h3>Statistiques (Lighthouse)</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span>First Contentful Paint</span>
              <strong>{{ metricDisplay('first-contentful-paint') }}</strong>
            </div>
            <div class="stat-item">
              <span>Largest Contentful Paint</span>
              <strong>{{ metricDisplay('largest-contentful-paint') }}</strong>
            </div>
            <div class="stat-item">
              <span>Total Blocking Time</span>
              <strong>{{ metricDisplay('total-blocking-time') }}</strong>
            </div>
            <div class="stat-item">
              <span>Cumulative Layout Shift</span>
              <strong>{{ metricDisplay('cumulative-layout-shift') }}</strong>
            </div>
            <div class="stat-item">
              <span>Speed Index</span>
              <strong>{{ metricDisplay('speed-index') }}</strong>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>Core Web Vitals (Field Data)</h3>
          <div class="vitals-grid">
            <div class="vitals-box">
              <h4>Loading Experience</h4>
              <div class="vital-item" *ngFor="let item of fieldMetrics(result.coreWebVitals.loadingExperience.metrics)">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <p class="empty-note" *ngIf="fieldMetrics(result.coreWebVitals.loadingExperience.metrics).length === 0">Aucune donnée terrain disponible.</p>
            </div>
            <div class="vitals-box">
              <h4>Origin Loading Experience</h4>
              <div class="vital-item" *ngFor="let item of fieldMetrics(result.coreWebVitals.originLoadingExperience.metrics)">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <p class="empty-note" *ngIf="fieldMetrics(result.coreWebVitals.originLoadingExperience.metrics).length === 0">Aucune donnée terrain disponible.</p>
            </div>
          </div>
        </div>

        <div class="panel-grid">
          <div class="panel">
            <h3>Insights</h3>
            <div class="audit-row" *ngFor="let audit of insightsAudits()">
              <span class="audit-title">
                {{ audit.title }}
                <small *ngIf="audit.description">{{ audit.description }}</small>
              </span>
              <span class="audit-value" [class.ok]="audit.score === 1">{{ audit.displayValue || scoreText(audit.score) }}</span>
            </div>
            <p class="empty-note" *ngIf="insightsAudits().length === 0">Aucun insight disponible.</p>
          </div>

          <div class="panel">
            <h3>Diagnostics</h3>
            <div class="audit-row" *ngFor="let audit of diagnosticsAudits()">
              <span class="audit-title">
                {{ audit.title }}
                <small *ngIf="audit.description">{{ audit.description }}</small>
              </span>
              <span class="audit-value" [class.ok]="audit.score === 1">{{ audit.displayValue || scoreText(audit.score) }}</span>
            </div>
            <p class="empty-note" *ngIf="diagnosticsAudits().length === 0">Aucun diagnostic disponible.</p>
          </div>

          <div class="panel">
            <h3>SEO</h3>
            <div class="audit-row" *ngFor="let audit of categoryAudits('seo')">
              <span class="audit-title">
                {{ audit.title }}
                <small *ngIf="audit.description">{{ audit.description }}</small>
              </span>
              <span class="audit-value" [class.ok]="audit.score === 1">{{ audit.displayValue || scoreText(audit.score) }}</span>
            </div>
            <p class="empty-note" *ngIf="categoryAudits('seo').length === 0">Aucun problème SEO critique trouvé.</p>
          </div>

          <div class="panel">
            <h3>Accessibilité</h3>
            <div class="audit-row" *ngFor="let audit of categoryAudits('accessibility')">
              <span class="audit-title">
                {{ audit.title }}
                <small *ngIf="audit.description">{{ audit.description }}</small>
              </span>
              <span class="audit-value" [class.ok]="audit.score === 1">{{ audit.displayValue || scoreText(audit.score) }}</span>
            </div>
            <p class="empty-note" *ngIf="categoryAudits('accessibility').length === 0">Aucun problème d'accessibilité critique trouvé.</p>
          </div>

          <div class="panel">
            <h3>Bonnes pratiques</h3>
            <div class="audit-row" *ngFor="let audit of categoryAudits('best-practices')">
              <span class="audit-title">
                {{ audit.title }}
                <small *ngIf="audit.description">{{ audit.description }}</small>
              </span>
              <span class="audit-value" [class.ok]="audit.score === 1">{{ audit.displayValue || scoreText(audit.score) }}</span>
            </div>
            <p class="empty-note" *ngIf="categoryAudits('best-practices').length === 0">Aucun problème critique trouvé.</p>
          </div>
        </div>
      </section>

      <button type="button" class="back" (click)="goDashboard()">Retour dashboard</button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at 10% 5%, rgba(59, 130, 246, 0.2), transparent 30%),
        radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.18), transparent 28%),
        linear-gradient(180deg, #0b1220 0%, #111a2f 50%, #0c1426 100%);
      color: #e2e8f0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .ps-page {
      padding: 1.2rem 1.1rem 1.8rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .ps-kicker {
      display: inline-flex;
      margin-bottom: 0.65rem;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(30, 41, 59, 0.7);
      color: #bfdbfe;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .ps-header h1 {
      margin: 0 0 0.25rem;
      font-size: 2rem;
      color: #f8fafc;
    }

    .ps-header p {
      margin: 0 0 1rem;
      color: #94a3b8;
    }

    .ps-search {
      display: grid;
      grid-template-columns: 1fr 160px 150px;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    input,
    select,
    button {
      border-radius: 0.75rem;
      border: 1px solid rgba(96, 165, 250, 0.75);
      padding: 0.85rem 1rem;
      font: inherit;
    }

    input,
    select {
      background: rgba(15, 23, 42, 0.85);
      color: #e2e8f0;
    }

    button {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #fff;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error {
      margin: 0.35rem 0 0.8rem;
      color: #fda4af;
      font-weight: 600;
      background: rgba(127, 29, 29, 0.4);
      border: 1px solid rgba(248, 113, 113, 0.5);
      border-radius: 0.7rem;
      padding: 0.65rem 0.8rem;
    }

    .loading-state {
      margin-bottom: 0.75rem;
      padding: 1rem;
      border-radius: 0.85rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(15, 23, 42, 0.75);
      color: #cbd5e1;
    }

    .pulse-bar {
      height: 6px;
      border-radius: 999px;
      background: linear-gradient(90deg, #1d4ed8 0%, #14b8a6 55%, #1d4ed8 100%);
      background-size: 200% 100%;
      animation: pulseFlow 1.8s linear infinite;
      margin-bottom: 0.55rem;
    }

    @keyframes pulseFlow {
      from { background-position: 0 0; }
      to { background-position: 200% 0; }
    }

    .summary-panel {
      display: grid;
      grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.1fr);
      gap: 0.9rem;
    }

    .summary-score {
      display: grid;
      align-content: center;
      justify-items: center;
      padding: 1rem;
      border-radius: 0.9rem;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.25);
      text-align: center;
    }

    .summary-ring {
      width: 138px;
      height: 138px;
      border-radius: 50%;
      border: 8px solid currentColor;
      display: grid;
      place-items: center;
      margin-bottom: 0.6rem;
    }

    .summary-ring strong {
      font-size: 2rem;
      line-height: 1;
      color: currentColor;
    }

    .summary-ring span {
      margin-top: 0.2rem;
      font-size: 0.73rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #cbd5e1;
    }

    .summary-score p {
      margin: 0;
      color: #cbd5e1;
      max-width: 36ch;
      line-height: 1.4;
    }

    .summary-score.good { color: #22c55e; }
    .summary-score.warn { color: #f59e0b; }
    .summary-score.bad { color: #ef4444; }

    .summary-preview img {
      width: 100%;
      min-height: 220px;
      max-height: 320px;
      object-fit: contain;
      border-radius: 0.9rem;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: #0f172a;
    }

    .score-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .score-chip {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 0.75rem;
      padding: 0.85rem 0.75rem;
      display: grid;
      justify-items: center;
      gap: 0.5rem;
    }

    .score-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1.35rem;
      font-weight: 700;
      border: 4px solid currentColor;
    }

    .score-chip span {
      color: #e2e8f0;
      font-size: 0.92rem;
      font-weight: 600;
    }

    .score-chip small {
      color: #94a3b8;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .score-chip.good { color: #22c55e; }
    .score-chip.warn { color: #f59e0b; }
    .score-chip.bad { color: #ef4444; }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem 1rem;
      margin-bottom: 0.75rem;
      color: #cbd5e1;
      font-size: 0.9rem;
      background: rgba(15, 23, 42, 0.62);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 0.75rem;
      padding: 0.65rem 0.8rem;
    }

    .panel {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 0.75rem;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 14px 28px rgba(2, 6, 23, 0.28);
    }

    .visual-panel {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 0.85rem;
      align-items: center;
    }

    .visual-panel img {
      width: 100%;
      max-width: 220px;
      border-radius: 0.7rem;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: #0f172a;
    }

    .visual-panel p {
      margin: 0;
      color: #cbd5e1;
    }

    .preview-panel img {
      width: 100%;
      max-height: 380px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: #fff;
    }

    .panel h3 {
      margin: 0 0 0.5rem;
      color: #f8fafc;
    }

    .panel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
    }

    .stat-item {
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 0.6rem;
      padding: 0.65rem;
      background: rgba(30, 41, 59, 0.55);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-item span {
      color: #cbd5e1;
      font-size: 0.9rem;
    }

    .stat-item strong {
      color: #f8fafc;
      font-size: 1rem;
    }

    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .vitals-box {
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 0.6rem;
      padding: 0.65rem;
      background: rgba(30, 41, 59, 0.55);
    }

    .vitals-box h4 {
      margin: 0 0 0.45rem;
    }

    .vital-item {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0;
      border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
      gap: 0.5rem;
    }

    .vital-item:last-child {
      border-bottom: none;
    }

    .vital-item span {
      color: #cbd5e1;
    }

    .vital-item strong {
      color: #f8fafc;
    }

    .audit-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .audit-row:last-child {
      border-bottom: none;
    }

    .audit-title {
      color: #f8fafc;
      font-size: 0.93rem;
      display: grid;
      gap: 0.2rem;
      max-width: 75%;
    }

    .audit-title small {
      color: #94a3b8;
      font-size: 0.75rem;
      line-height: 1.35;
    }

    .audit-value {
      color: #dc2626;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: right;
      max-width: 25%;
      word-break: break-word;
    }

    .audit-value.ok {
      color: #16a34a;
    }

    .empty-note {
      margin: 0.5rem 0 0;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .back {
      width: 100%;
      border-color: rgba(148, 163, 184, 0.5);
      background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    }

    @media (max-width: 980px) {
      .ps-search {
        grid-template-columns: 1fr;
      }

      .summary-panel {
        grid-template-columns: 1fr;
      }

      .score-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .vitals-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid,
      .panel-grid {
        grid-template-columns: 1fr;
      }

      .visual-panel {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PageSpeedComponent {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = getApiBaseUrl();

  url = 'https://seo-ia123.vercel.app/';
  strategy: 'mobile' | 'desktop' = 'mobile';
  loading = false;
  errorMessage = '';
  result: LocalPageSpeedResponse | null = null;

  ngOnInit(): void {}

  async analyze(): Promise<void> {
    this.errorMessage = '';

    const inputUrl = this.url.trim();
    if (!inputUrl) {
      this.errorMessage = 'Veuillez renseigner une URL';
      return;
    }

    const normalizedUrl = this.normalizeInputUrl(inputUrl);
    if (!normalizedUrl) {
      this.errorMessage = 'URL invalide. Utilisez une URL complete ou un domaine valide.';
      return;
    }

    this.url = normalizedUrl;

    const token = this.getToken();
    if (!token) {
      this.errorMessage = 'Session expirée. Reconnectez-vous.';
      return;
    }

    this.loading = true;
    const cacheKey = this.localCacheKey(normalizedUrl, this.strategy);
    const localSnapshot = this.readLocalCache(cacheKey);
    if (localSnapshot) {
      this.result = {
        ...localSnapshot,
        localCached: true,
      };
    }

    try {
      const endpoint = `${this.api}/pagespeed/?url=${encodeURIComponent(normalizedUrl)}&strategy=${this.strategy}`;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45000);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        this.errorMessage = data.message || data.detail || 'Erreur API PageSpeed';
        this.result = null;
        return;
      }

      const parsed = data as PageSpeedResponse;
      this.result = {
        ...parsed,
        lighthouseResult: parsed.lighthouseResult,
        localCached: false,
      };

      this.writeLocalCache(cacheKey, this.result);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        this.errorMessage = 'Timeout: analyse trop longue (>45s). Reessayez; si la cle est restreinte, verifiez les restrictions Google Cloud.';
      } else {
        this.errorMessage = 'Impossible de joindre le backend PageSpeed';
      }
      this.result = null;
    } finally {
      this.loading = false;
    }
  }

  private getToken(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    try {
      const authData = localStorage.getItem('auth_token');
      if (!authData) {
        return '';
      }
      const parsed = JSON.parse(authData);
      return parsed?.token || '';
    } catch {
      return '';
    }
  }

  private localCacheKey(url: string, strategy: 'mobile' | 'desktop'): string {
    return `pagespeed_cache::${strategy}::${url}`;
  }

  private normalizeInputUrl(rawUrl: string): string {
    const withScheme = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    try {
      const parsed = new URL(withScheme);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  }

  private readLocalCache(key: string): LocalPageSpeedResponse | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as LocalPageSpeedResponse;
    } catch {
      return null;
    }
  }

  private writeLocalCache(key: string, value: LocalPageSpeedResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota errors.
    }
  }

  scoreBand(value: number): 'good' | 'warn' | 'bad' {
    if (value >= 90) {
      return 'good';
    }
    if (value >= 50) {
      return 'warn';
    }
    return 'bad';
  }

  overallScore(): number {
    if (!this.result) {
      return 0;
    }

    const values = [
      this.result.categories.performance,
      this.result.categories.accessibility,
      this.result.categories.bestPractices,
      this.result.categories.seo,
    ];
    const total = values.reduce((sum, current) => sum + current, 0);
    return Math.round(total / values.length);
  }

  scoreLabel(value: number): string {
    const band = this.scoreBand(value);
    if (band === 'good') {
      return 'Excellent';
    }
    if (band === 'warn') {
      return 'A optimiser';
    }
    return 'Critique';
  }

  visualForScore(value: number): string {
    const band = this.scoreBand(value);
    if (band === 'good') {
      return 'pagespeed/good.svg';
    }
    if (band === 'warn') {
      return 'pagespeed/warn.svg';
    }
    return 'pagespeed/bad.svg';
  }

  visualMessage(value: number): string {
    const band = this.scoreBand(value);
    if (band === 'good') {
      return 'La performance est bonne. Continue avec des optimisations legeres pour garder ce niveau.';
    }
    if (band === 'warn') {
      return 'Le score est moyen. Quelques corrections ciblées peuvent augmenter fortement la vitesse.';
    }
    return 'Le score est faible. Priorise les problemes bloquants pour accelerer le chargement.';
  }

  metricDisplay(key: string): string {
    const metric = this.result?.lighthouseResult?.audits?.[key];
    if (!metric) {
      return '-';
    }
    return metric.displayValue || '-';
  }

  screenshotDataUrl(): string {
    const shot = this.result?.lighthouseResult?.audits?.['final-screenshot']?.details?.data;
    return typeof shot === 'string' ? shot : '';
  }

  scoreText(score: number | null | undefined): string {
    if (score == null) {
      return 'n/a';
    }
    if (score >= 0.9) {
      return 'OK';
    }
    if (score >= 0.5) {
      return 'Moyen';
    }
    return 'A corriger';
  }

  formatDuration(ms?: number): string {
    if (ms == null) {
      return '-';
    }
    if (ms === 0) {
      return 'instant (cache)';
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  fieldMetrics(metrics: Record<string, { percentile?: number; category?: string }> | undefined): Array<{ label: string; value: string }> {
    if (!metrics) {
      return [];
    }

    const mapLabel: Record<string, string> = {
      lcp: 'LCP',
      fcp: 'FCP',
      cls: 'CLS',
      inp: 'INP',
      fid: 'FID',
    };

    return Object.entries(metrics).map(([key, value]) => ({
      label: mapLabel[key] || key.toUpperCase(),
      value: value?.percentile != null ? `${value.percentile}` : 'n/a',
    }));
  }

  insightsAudits(): any[] {
    const insightKeys = [
      'image-delivery-insight',
      'render-blocking-resources',
      'network-requests',
      'server-response-time',
      'uses-rel-preconnect',
      'uses-responsive-images',
      'uses-optimized-images',
    ];
    return this.pickAudits(insightKeys);
  }

  diagnosticsAudits(): any[] {
    const diagnosticKeys = [
      'unused-javascript',
      'unused-css-rules',
      'total-blocking-time',
      'speed-index',
      'interactive',
      'errors-in-console',
      'third-party-cookies',
    ];
    return this.pickAudits(diagnosticKeys);
  }

  categoryAudits(categoryKey: 'seo' | 'accessibility' | 'best-practices'): any[] {
    const refs = this.result?.lighthouseResult?.categories?.[categoryKey]?.auditRefs || [];
    const audits = this.result?.lighthouseResult?.audits || {};

    return refs
      .map((ref: any) => audits[ref.id])
      .filter((audit: any) => !!audit && audit.score !== 1)
      .slice(0, 12);
  }

  private pickAudits(keys: string[]): any[] {
    const audits = this.result?.lighthouseResult?.audits || {};
    return keys
      .map((key) => audits[key])
      .filter((audit: any) => !!audit)
      .slice(0, 12);
  }

  goDashboard(): void {
    void this.router.navigateByUrl('/dashboard').then((ok) => {
      if (!ok && isPlatformBrowser(this.platformId)) {
        window.location.hash = '#/dashboard';
      }
    });
  }
}
