import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostBinding, Input, OnChanges, OnInit, PLATFORM_ID, SimpleChanges, inject } from '@angular/core';
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
    <div class="ps-page" [class.embedded-mode]="embedded">
      <header class="ps-header">
        <span class="ps-kicker">SEO Dashboard</span>
        <h1>PageSpeed Insights</h1>
        <p>Analyse complète d'une URL avec un rendu clair, visuel et actionnable.</p>
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
          <option value="mobile">📱 Mobile</option>
          <option value="desktop">🖥️ Desktop</option>
        </select>
        <button type="button" (click)="analyze()" [disabled]="loading">{{ loading ? '⏳ Analyse...' : '🔍 Analyser' }}</button>
      </section>

      <p class="error" *ngIf="errorMessage">⚠️ {{ errorMessage }}</p>

      <section class="loading-state" *ngIf="loading && !result">
        <div class="pulse-bar"></div>
        <p>⏳ Analyse en cours. Récupération des données Google PageSpeed...</p>
      </section>

      <section class="ps-results" *ngIf="result">
        <!-- Summary Score Section -->
        <div class="summary-section">
          <div class="summary-score" [class.good]="scoreBand(overallScore()) === 'good'" [class.warn]="scoreBand(overallScore()) === 'warn'" [class.bad]="scoreBand(overallScore()) === 'bad'">
            <div class="summary-ring">
              <strong>{{ overallScore() }}</strong>
              <span>Score Global</span>
            </div>
            <p class="summary-message">{{ visualMessage(overallScore()) }}</p>
          </div>

          <div class="summary-preview" *ngIf="screenshotDataUrl() as shot">
            <img [src]="shot" alt="Capture de la page analysée" />
          </div>
        </div>

        <!-- Category Scores -->
        <div class="category-scores">
          <article class="category-card" [class.good]="scoreBand(result.categories.performance) === 'good'" [class.warn]="scoreBand(result.categories.performance) === 'warn'" [class.bad]="scoreBand(result.categories.performance) === 'bad'">
            <div class="score-badge">{{ result.categories.performance }}</div>
            <div class="card-content">
              <h3>⚡ Performances</h3>
              <p>{{ scoreLabel(result.categories.performance) }}</p>
            </div>
          </article>

          <article class="category-card" [class.good]="scoreBand(result.categories.accessibility) === 'good'" [class.warn]="scoreBand(result.categories.accessibility) === 'warn'" [class.bad]="scoreBand(result.categories.accessibility) === 'bad'">
            <div class="score-badge">{{ result.categories.accessibility }}</div>
            <div class="card-content">
              <h3>♿ Accessibilité</h3>
              <p>{{ scoreLabel(result.categories.accessibility) }}</p>
            </div>
          </article>

          <article class="category-card" [class.good]="scoreBand(result.categories.bestPractices) === 'good'" [class.warn]="scoreBand(result.categories.bestPractices) === 'warn'" [class.bad]="scoreBand(result.categories.bestPractices) === 'bad'">
            <div class="score-badge">{{ result.categories.bestPractices }}</div>
            <div class="card-content">
              <h3>✅ Bonnes Pratiques</h3>
              <p>{{ scoreLabel(result.categories.bestPractices) }}</p>
            </div>
          </article>

          <article class="category-card" [class.good]="scoreBand(result.categories.seo) === 'good'" [class.warn]="scoreBand(result.categories.seo) === 'warn'" [class.bad]="scoreBand(result.categories.seo) === 'bad'">
            <div class="score-badge">{{ result.categories.seo }}</div>
            <div class="card-content">
              <h3>🔍 SEO</h3>
              <p>{{ scoreLabel(result.categories.seo) }}</p>
            </div>
          </article>
        </div>

        <!-- Metadata -->
        <div class="meta-info">
          <div class="meta-item">
            <span class="label">🌐 URL</span>
            <span class="value">{{ result.url }}</span>
          </div>
          <div class="meta-item">
            <span class="label">📊 Mode</span>
            <span class="value">{{ result.strategy === 'mobile' ? '📱 Mobile' : '🖥️ Desktop' }}</span>
          </div>
          <div class="meta-item">
            <span class="label">💾 Cache</span>
            <span class="value">{{ result.cached ? '✅ Oui' : '❌ Non' }}</span>
          </div>
          <div class="meta-item" *ngIf="result.localCached">
            <span class="label">⚡ Local</span>
            <span class="value">Affichage instantané</span>
          </div>
          <div class="meta-item" *ngIf="result.staleCache">
            <span class="label">⏱️ Serveur</span>
            <span class="value">Ancien cache</span>
          </div>
          <div class="meta-item">
            <span class="label">⏱️ Durée</span>
            <span class="value">{{ formatDuration(result.analysisDurationMs) }}</span>
          </div>
          <div class="meta-item" *ngIf="result.analysisTimestamp">
            <span class="label">📅 Analyse</span>
            <span class="value">{{ result.analysisTimestamp }}</span>
          </div>
        </div>

        <!-- Core Metrics -->
        <div class="section-header">📈 Métriques de Performance</div>
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">First Contentful Paint</span>
            <strong class="metric-value">{{ metricDisplay('first-contentful-paint') }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Largest Contentful Paint</span>
            <strong class="metric-value">{{ metricDisplay('largest-contentful-paint') }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Total Blocking Time</span>
            <strong class="metric-value">{{ metricDisplay('total-blocking-time') }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Cumulative Layout Shift</span>
            <strong class="metric-value">{{ metricDisplay('cumulative-layout-shift') }}</strong>
          </div>
          <div class="metric-card">
            <span class="metric-label">Speed Index</span>
            <strong class="metric-value">{{ metricDisplay('speed-index') }}</strong>
          </div>
        </div>

        <!-- Core Web Vitals -->
        <div class="section-header">📊 Core Web Vitals</div>
        <div class="vitals-row">
          <div class="vitals-box">
            <h4>📍 Loading Experience</h4>
            <div class="vital-items">
              <div class="vital-item" *ngFor="let item of fieldMetrics(result.coreWebVitals.loadingExperience.metrics)">
                <span class="vital-label">{{ item.label }}</span>
                <strong class="vital-value">{{ item.value }}</strong>
              </div>
              <p class="empty-note" *ngIf="fieldMetrics(result.coreWebVitals.loadingExperience.metrics).length === 0">Aucune donnée terrain disponible.</p>
            </div>
          </div>
          <div class="vitals-box">
            <h4>🌍 Origin Loading Experience</h4>
            <div class="vital-items">
              <div class="vital-item" *ngFor="let item of fieldMetrics(result.coreWebVitals.originLoadingExperience.metrics)">
                <span class="vital-label">{{ item.label }}</span>
                <strong class="vital-value">{{ item.value }}</strong>
              </div>
              <p class="empty-note" *ngIf="fieldMetrics(result.coreWebVitals.originLoadingExperience.metrics).length === 0">Aucune donnée terrain disponible.</p>
            </div>
          </div>
        </div>

        <!-- Audit Sections -->
        <div class="audit-sections">
          <div class="audit-section">
            <h3 class="section-header">💡 Insights</h3>
            <div class="audit-items">
              <div class="audit-item" *ngFor="let audit of insightsAudits()" [class.ok]="audit.score === 1" [class.fail]="audit.score !== 1">
                <div class="audit-header">
                  <span class="audit-status" [class.ok]="audit.score === 1"></span>
                  <span class="audit-title">{{ audit.title }}</span>
                </div>
                <small class="audit-desc" *ngIf="audit.description">{{ audit.description }}</small>
                <span class="audit-value">{{ audit.displayValue || scoreText(audit.score) }}</span>
              </div>
              <p class="empty-note" *ngIf="insightsAudits().length === 0">✅ Aucun insight disponible.</p>
            </div>
          </div>

          <div class="audit-section">
            <h3 class="section-header">🔧 Diagnostics</h3>
            <div class="audit-items">
              <div class="audit-item" *ngFor="let audit of diagnosticsAudits()" [class.ok]="audit.score === 1" [class.fail]="audit.score !== 1">
                <div class="audit-header">
                  <span class="audit-status" [class.ok]="audit.score === 1"></span>
                  <span class="audit-title">{{ audit.title }}</span>
                </div>
                <small class="audit-desc" *ngIf="audit.description">{{ audit.description }}</small>
                <span class="audit-value">{{ audit.displayValue || scoreText(audit.score) }}</span>
              </div>
              <p class="empty-note" *ngIf="diagnosticsAudits().length === 0">✅ Aucun diagnostic problématique.</p>
            </div>
          </div>

          <div class="audit-section">
            <h3 class="section-header">🔍 SEO</h3>
            <div class="audit-items">
              <div class="audit-item" *ngFor="let audit of categoryAudits('seo')" [class.ok]="audit.score === 1" [class.fail]="audit.score !== 1">
                <div class="audit-header">
                  <span class="audit-status" [class.ok]="audit.score === 1"></span>
                  <span class="audit-title">{{ audit.title }}</span>
                </div>
                <small class="audit-desc" *ngIf="audit.description">{{ audit.description }}</small>
                <span class="audit-value">{{ audit.displayValue || scoreText(audit.score) }}</span>
              </div>
              <p class="empty-note" *ngIf="categoryAudits('seo').length === 0">✅ Aucun problème SEO critique trouvé.</p>
            </div>
          </div>

          <div class="audit-section">
            <h3 class="section-header">♿ Accessibilité</h3>
            <div class="audit-items">
              <div class="audit-item" *ngFor="let audit of categoryAudits('accessibility')" [class.ok]="audit.score === 1" [class.fail]="audit.score !== 1">
                <div class="audit-header">
                  <span class="audit-status" [class.ok]="audit.score === 1"></span>
                  <span class="audit-title">{{ audit.title }}</span>
                </div>
                <small class="audit-desc" *ngIf="audit.description">{{ audit.description }}</small>
                <span class="audit-value">{{ audit.displayValue || scoreText(audit.score) }}</span>
              </div>
              <p class="empty-note" *ngIf="categoryAudits('accessibility').length === 0">✅ Aucun problème d'accessibilité critique trouvé.</p>
            </div>
          </div>

          <div class="audit-section">
            <h3 class="section-header">✅ Bonnes Pratiques</h3>
            <div class="audit-items">
              <div class="audit-item" *ngFor="let audit of categoryAudits('best-practices')" [class.ok]="audit.score === 1" [class.fail]="audit.score !== 1">
                <div class="audit-header">
                  <span class="audit-status" [class.ok]="audit.score === 1"></span>
                  <span class="audit-title">{{ audit.title }}</span>
                </div>
                <small class="audit-desc" *ngIf="audit.description">{{ audit.description }}</small>
                <span class="audit-value">{{ audit.displayValue || scoreText(audit.score) }}</span>
              </div>
              <p class="empty-note" *ngIf="categoryAudits('best-practices').length === 0">✅ Aucun problème critique trouvé.</p>
            </div>
          </div>
        </div>
      </section>

      <button *ngIf="!embedded" type="button" class="back-btn" (click)="goDashboard()">← Retour Dashboard</button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at 10% 5%, rgba(59, 130, 246, 0.15), transparent 40%),
        radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.15), transparent 40%),
        linear-gradient(180deg, #0b1220 0%, #111a2f 50%, #0c1426 100%);
      color: #e2e8f0;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    :host.embedded {
      min-height: auto;
      background: transparent;
    }

    .ps-page {
      padding: 2rem 1.5rem 3rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .ps-page.embedded-mode {
      max-width: none;
      padding: 1rem;
    }

    /* Header */
    .ps-kicker {
      display: inline-flex;
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(30, 41, 59, 0.8);
      color: #bfdbfe;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .ps-header h1 {
      margin: 0 0 0.5rem;
      font-size: 2.8rem;
      color: #f1f5f9;
      font-weight: 800;
    }

    .ps-header p {
      margin: 0 0 1.5rem;
      color: #cbd5e1;
      font-size: 1.05rem;
      max-width: 600px;
    }

    /* Search Bar */
    .ps-search {
      display: grid;
      grid-template-columns: 1fr 180px 160px;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    input, select, button {
      border-radius: 6px;
      border: 1px solid rgba(96, 165, 250, 0.6);
      padding: 1rem 1.2rem;
      font: inherit;
      font-size: 1rem;
    }

    input, select {
      background: rgba(15, 23, 42, 0.9);
      color: #f1f5f9;
    }

    input::placeholder {
      color: #64748b;
    }

    button {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #fff;
      cursor: pointer;
      font-weight: 700;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
      transition: all 0.3s ease;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(37, 99, 235, 0.4);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Error Message */
    .error {
      margin: 1rem 0 1.5rem;
      color: #fca5a5;
      font-weight: 600;
      font-size: 1rem;
      background: rgba(159, 18, 57, 0.3);
      border: 1px solid rgba(244, 114, 182, 0.5);
      border-radius: 6px;
      padding: 1rem 1.2rem;
    }

    /* Loading State */
    .loading-state {
      margin-bottom: 2rem;
      padding: 2rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      background: rgba(15, 23, 42, 0.8);
      color: #cbd5e1;
      text-align: center;
      font-size: 1.1rem;
    }

    .pulse-bar {
      height: 8px;
      border-radius: 999px;
      background: linear-gradient(90deg, #1d4ed8 0%, #14b8a6 50%, #1d4ed8 100%);
      background-size: 200% 100%;
      animation: pulseFlow 2s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes pulseFlow {
      from { background-position: 0 0; }
      to { background-position: 200% 0; }
    }

    /* Results Section */
    .ps-results {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Summary Section */
    .summary-section {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 2rem;
      margin-bottom: 2.5rem;
      align-items: center;
    }

    .ps-page.embedded-mode .summary-section {
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-score {
      display: grid;
      align-content: center;
      justify-items: center;
      padding: 2.5rem 2rem;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.3);
      text-align: center;
      box-shadow: 0 20px 50px rgba(2, 6, 23, 0.3);
    }

    .summary-ring {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 10px solid currentColor;
      display: grid;
      place-items: center;
      margin-bottom: 1.5rem;
    }

    .summary-ring strong {
      font-size: 3rem;
      line-height: 1;
      color: currentColor;
    }

    .summary-ring span {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #cbd5e1;
    }

    .summary-message {
      margin: 1rem 0 0;
      color: #cbd5e1;
      max-width: 40ch;
      line-height: 1.6;
      font-size: 1.05rem;
    }

    .summary-score.good { color: #10b981; }
    .summary-score.warn { color: #f59e0b; }
    .summary-score.bad { color: #ef4444; }

    .summary-preview img {
      width: 100%;
      height: auto;
      min-height: 280px;
      max-height: 400px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(15, 23, 42, 0.8);
    }

    /* Category Scores */
    .category-scores {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .ps-page.embedded-mode .category-scores {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .category-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1.5px solid rgba(148, 163, 184, 0.3);
      border-radius: 6px;
      padding: 1.8rem;
      display: flex;
      align-items: center;
      gap: 1.2rem;
      transition: all 0.3s ease;
      cursor: default;
      box-shadow: 0 10px 30px rgba(2, 6, 23, 0.2);
    }

    .category-card:hover {
      border-color: rgba(96, 165, 250, 0.5);
      box-shadow: 0 15px 40px rgba(2, 6, 23, 0.4);
    }

    .score-badge {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 2.5rem;
      font-weight: 800;
      border: 5px solid currentColor;
      flex-shrink: 0;
      color: currentColor;
    }

    .card-content {
      flex: 1;
    }

    .card-content h3 {
      margin: 0 0 0.5rem;
      color: #f1f5f9;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .card-content p {
      margin: 0;
      color: #cbd5e1;
      font-size: 1rem;
    }

    .category-card.good { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
    .category-card.warn { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
    .category-card.bad { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

    /* Metadata */
    .meta-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 6px;
      padding: 1.5rem;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    }

    .meta-item:last-child {
      border-bottom: none;
    }

    .meta-item .label {
      color: #cbd5e1;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .meta-item .value {
      color: #f1f5f9;
      font-size: 0.95rem;
      word-break: break-word;
      text-align: right;
    }

    /* Section Headers */
    .section-header {
      font-size: 1.3rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 2rem 0 1.2rem;
      padding-bottom: 0.8rem;
      border-bottom: 2px solid rgba(96, 165, 250, 0.3);
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.2rem;
      margin-bottom: 2.5rem;
    }

    .ps-page.embedded-mode .metrics-grid {
      margin-bottom: 1.5rem;
      gap: 0.9rem;
    }

    .metric-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 6px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      box-shadow: 0 10px 25px rgba(2, 6, 23, 0.2);
    }

    .metric-label {
      color: #cbd5e1;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .metric-value {
      color: #38bdf8;
      font-size: 1.6rem;
      font-weight: 800;
    }

    /* Vitals Section */
    .vitals-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .ps-page.embedded-mode .vitals-row {
      grid-template-columns: 1fr;
      gap: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .vitals-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 6px;
      padding: 1.8rem;
      box-shadow: 0 10px 25px rgba(2, 6, 23, 0.2);
    }

    .vitals-box h4 {
      margin: 0 0 1.2rem;
      color: #f1f5f9;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .vital-items {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .vital-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 4px;
      border-left: 3px solid rgba(96, 165, 250, 0.4);
    }

    .vital-label {
      color: #cbd5e1;
      font-weight: 600;
      font-size: 1rem;
    }

    .vital-value {
      color: #38bdf8;
      font-size: 1.2rem;
      font-weight: 800;
    }

    /* Audit Sections */
    .audit-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 2.5rem;
    }

    .ps-page.embedded-mode .audit-sections {
      grid-template-columns: 1fr;
      gap: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .audit-section {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 6px;
      padding: 2rem;
      box-shadow: 0 15px 40px rgba(2, 6, 23, 0.3);
    }

    .audit-section .section-header {
      margin: 0 0 1.5rem;
      border-bottom-color: rgba(96, 165, 250, 0.4);
    }

    .audit-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .audit-item {
      padding: 1.2rem;
      background: rgba(30, 41, 59, 0.6);
      border-radius: 4px;
      border-left: 4px solid #ef4444;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      transition: all 0.2s ease;
    }

    .audit-item.ok {
      border-left-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    .audit-item.fail {
      border-left-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .audit-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .audit-status {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ef4444;
      flex-shrink: 0;
    }

    .audit-status.ok {
      background: #10b981;
    }

    .audit-title {
      color: #f1f5f9;
      font-size: 1.05rem;
      font-weight: 700;
      flex: 1;
    }

    .audit-desc {
      color: #cbd5e1;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-left: 1.5rem;
    }

    .audit-value {
      color: #ef4444;
      font-size: 0.95rem;
      font-weight: 700;
      text-align: left;
      margin-left: 1.5rem;
    }

    .audit-value.ok {
      color: #10b981;
    }

    .empty-note {
      color: #94a3b8;
      font-size: 1rem;
      text-align: center;
      padding: 1.5rem;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 4px;
    }

    /* Back Button */
    .back-btn {
      width: 100%;
      margin-top: 1.5rem;
      border-color: rgba(148, 163, 184, 0.5);
      background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
      font-size: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: linear-gradient(135deg, #475569 0%, #334155 100%);
      transform: translateY(-2px);
    }

    /* Responsive */
    @media (max-width: 1400px) {
      .ps-search {
        grid-template-columns: 1fr 160px 140px;
      }
    }

    @media (max-width: 1200px) {
      .summary-section {
        grid-template-columns: 1fr;
      }

      .category-scores {
        grid-template-columns: repeat(2, 1fr);
      }

      .vitals-row {
        grid-template-columns: 1fr;
      }

      .audit-sections {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .ps-page {
        padding: 1.2rem 1rem 2rem;
      }

      .ps-page.embedded-mode {
        padding: 0.75rem;
      }

      .ps-header h1 {
        font-size: 2rem;
      }

      .ps-search {
        grid-template-columns: 1fr;
        gap: 0.8rem;
      }

      input, select, button {
        padding: 0.9rem 1rem;
      }

      .category-scores {
        grid-template-columns: 1fr;
      }

      .category-card {
        padding: 1.2rem;
      }

      .score-badge {
        width: 80px;
        height: 80px;
        font-size: 2rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .audit-sections {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PageSpeedComponent implements OnInit, OnChanges {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = getApiBaseUrl();

  @Input() embedded = false;
  @Input() presetUrl = '';
  @Input() autoAnalyzeToken = 0;

  @HostBinding('class.embedded')
  get embeddedClass(): boolean {
    return this.embedded;
  }

  url = 'https://seo-ia123.vercel.app/';
  strategy: 'mobile' | 'desktop' = 'mobile';
  loading = false;
  errorMessage = '';
  result: LocalPageSpeedResponse | null = null;

  ngOnInit(): void {
    this.applyPresetUrl();
    if (this.autoAnalyzeToken > 0) {
      void this.analyze();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['presetUrl']) {
      this.applyPresetUrl();
    }

    if (changes['autoAnalyzeToken'] && !changes['autoAnalyzeToken'].firstChange) {
      void this.analyze();
    }
  }

  private applyPresetUrl(): void {
    const nextUrl = this.presetUrl?.trim();
    if (nextUrl) {
      this.url = nextUrl;
    }
  }

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
