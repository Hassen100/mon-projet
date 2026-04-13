import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ReportMetric {
  label: string;
  value: string;
}

interface PageSpeedReport {
  urlLabel: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metaPills: string[];
  metrics: ReportMetric[];
  insights: string[];
  diagnostics: string[];
  seoDetails: string[];
  accessibilityDetails: string[];
  bestPracticesDetails: string[];
  summary: string;
}

@Component({
  selector: 'app-ai-model',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-speed-report">
      <header class="report-hero">
        <div class="hero-copy">
          <span class="eyebrow">#SEO-IA</span>
          <h1>Rapport PageSpeed détaillé</h1>
          <p>
            Saisis l'URL du site ci-dessous. Quand l'URL <strong>https://seo-ia123-vercel.app</strong> est entrée,
            la page affiche le rapport complet correspondant à l'analyse mobile.
          </p>
        </div>

        <div class="url-box">
          <label for="siteUrl">URL du site</label>
          <div class="url-row">
            <input
              id="siteUrl"
              type="url"
              [(ngModel)]="siteUrl"
              name="siteUrl"
              placeholder="https://seo-ia123-vercel.app"
              (ngModelChange)="onUrlChange()"
            />
            <button type="button" class="analyze-btn" (click)="applyTargetReport()">Afficher le rapport</button>
          </div>
          <p class="helper-text">Le rapport est affiché automatiquement si l'URL correspond au site cible.</p>
        </div>

        <div class="hero-meta">
          <div class="meta-pill" *ngFor="let item of currentReport.metaPills">{{ item }}</div>
        </div>

        <button type="button" class="back-btn" (click)="goDashboard()">Retour au dashboard</button>
      </header>

      <main class="report-body" *ngIf="hasTargetUrl; else emptyState">
        <section class="score-grid">
          <article class="score-card performance">
            <span class="score-label">Performance</span>
            <strong>{{ currentReport.scores.performance }}</strong>
            <p>Score calculé à partir du FCP, LCP, TBT, CLS et Speed Index.</p>
          </article>

          <article class="score-card accessibility">
            <span class="score-label">Accessibility</span>
            <strong>{{ currentReport.scores.accessibility }}</strong>
            <p>Le site passe les vérifications visibles du rapport d'accessibilité.</p>
          </article>

          <article class="score-card best-practices">
            <span class="score-label">Best Practices</span>
            <strong>{{ currentReport.scores.bestPractices }}</strong>
            <p>Les bonnes pratiques techniques et de sécurité sont validées.</p>
          </article>

          <article class="score-card seo">
            <span class="score-label">SEO</span>
            <strong>{{ currentReport.scores.seo }}</strong>
            <p>Le score SEO montre un bon socle, mais certains points restent à corriger.</p>
          </article>
        </section>

        <section class="panel-grid">
          <article class="panel">
            <h2>Metrics</h2>
            <div class="metrics-list">
              <div class="metric-item" *ngFor="let metric of currentReport.metrics">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
              </div>
            </div>
            <p class="note">{{ currentReport.urlLabel }}</p>
          </article>

          <article class="panel">
            <h2>Insights</h2>
            <ul class="list">
              <li *ngFor="let item of currentReport.insights">{{ item }}</li>
            </ul>
          </article>

          <article class="panel">
            <h2>Diagnostics</h2>
            <ul class="list">
              <li *ngFor="let item of currentReport.diagnostics">{{ item }}</li>
            </ul>
          </article>

          <article class="panel">
            <h2>SEO details</h2>
            <ul class="list">
              <li *ngFor="let item of currentReport.seoDetails">{{ item }}</li>
            </ul>
          </article>

          <article class="panel">
            <h2>Accessibility details</h2>
            <ul class="list">
              <li *ngFor="let item of currentReport.accessibilityDetails">{{ item }}</li>
            </ul>
          </article>

          <article class="panel">
            <h2>Best practices details</h2>
            <ul class="list">
              <li *ngFor="let item of currentReport.bestPracticesDetails">{{ item }}</li>
            </ul>
          </article>
        </section>

        <section class="full-width panel">
          <h2>Summary of the report</h2>
          <p>{{ currentReport.summary }}</p>
        </section>
      </main>

      <ng-template #emptyState>
        <main class="report-body empty">
          <section class="panel empty-panel">
            <h2>Entrez l'URL du site</h2>
            <p>
              Pour afficher le rapport complet, saisis <strong>https://seo-ia123-vercel.app</strong> dans le champ ci-dessus.
            </p>
          </section>
        </main>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 24%),
        radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.12), transparent 30%),
        #0a0e1a;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .report-hero {
      padding: 2rem 2rem 1.5rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.92));
    }

    .hero-copy h1 {
      margin: 0.25rem 0 0.75rem;
      color: #f8fafc;
      font-size: clamp(1.8rem, 3vw, 3rem);
      line-height: 1.08;
      max-width: 980px;
    }

    .hero-copy p,
    .note,
    .panel p,
    .helper-text {
      color: #cbd5e1;
      line-height: 1.65;
      margin: 0;
    }

    .eyebrow {
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #7c8cff;
      font-size: 0.78rem;
      font-weight: 800;
    }

    .url-box {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      max-width: 920px;
    }

    .url-box label {
      display: block;
      margin-bottom: 0.65rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .url-row {
      display: flex;
      gap: 0.75rem;
    }

    .url-row input {
      flex: 1;
      border-radius: 0.9rem;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.7);
      color: #fff;
      padding: 0.95rem 1rem;
      font: inherit;
      outline: none;
    }

    .analyze-btn,
    .back-btn {
      border: none;
      border-radius: 999px;
      padding: 0.8rem 1.1rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .analyze-btn {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .back-btn {
      margin-top: 1rem;
      background: rgba(99, 102, 241, 0.12);
      color: #c7d2fe;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1rem 0 1.25rem;
    }

    .meta-pill {
      padding: 0.55rem 0.85rem;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: #c7d2fe;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .report-body {
      padding: 1.5rem 2rem 2rem;
      display: grid;
      gap: 1.25rem;
    }

    .score-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }

    .score-card,
    .panel {
      background: rgba(15, 23, 42, 0.84);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 1.3rem;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(10px);
    }

    .score-card {
      padding: 1rem;

      .score-label {
        display: inline-block;
        margin-bottom: 0.6rem;
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
      }

      strong {
        display: block;
        font-size: 2.6rem;
        line-height: 1;
        margin-bottom: 0.45rem;
      }

      p {
        font-size: 0.92rem;
      }
    }

    .performance strong { color: #f59e0b; }
    .accessibility strong { color: #22c55e; }
    .best-practices strong { color: #38bdf8; }
    .seo strong { color: #a78bfa; }

    .panel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .panel {
      padding: 1.15rem 1.2rem;
    }

    .panel h2 {
      margin: 0 0 0.9rem;
      color: #ffffff;
      font-size: 1.05rem;
    }

    .metrics-list,
    .list {
      display: grid;
      gap: 0.7rem;
    }

    .metric-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.8rem 0.9rem;
      border-radius: 0.9rem;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.12);
    }

    .metric-item span,
    .list li {
      color: #cbd5e1;
    }

    .metric-item strong {
      color: #f8fafc;
    }

    .list {
      padding-left: 1.1rem;
      margin: 0;
      line-height: 1.65;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .empty {
      padding-top: 1rem;
    }

    .empty-panel {
      max-width: 760px;
    }

    @media (max-width: 1100px) {
      .score-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .panel-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .report-hero,
      .report-body {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .score-grid {
        grid-template-columns: 1fr;
      }

      .url-row {
        flex-direction: column;
      }

      .analyze-btn {
        width: 100%;
      }
    }
  `]
})
export class AiModelComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly targetUrl = 'https://seo-ia123-vercel.app';

  siteUrl = this.targetUrl;
  hasTargetUrl = true;

  currentReport: PageSpeedReport = this.createTargetReport();

  ngOnInit(): void {
    this.applyTargetReport();
  }

  onUrlChange(): void {
    this.normalizeAndLoadReport();
  }

  applyTargetReport(): void {
    this.normalizeAndLoadReport();
  }

  private normalizeAndLoadReport(): void {
    const normalized = this.normalizeUrl(this.siteUrl);
    this.hasTargetUrl = normalized === this.normalizeUrl(this.targetUrl);

    if (this.hasTargetUrl) {
      this.currentReport = this.createTargetReport();
      return;
    }

    this.currentReport = this.createGenericReport(normalized || this.targetUrl);
  }

  private normalizeUrl(value: string): string {
    return value.trim().toLowerCase().replace(/\/$/, '');
  }

  private createTargetReport(): PageSpeedReport {
    return {
      urlLabel: 'Report from Apr 13, 2026, 12:02:24 AM - https://seo-ia123-vercel.app/',
      scores: {
        performance: 80,
        accessibility: 100,
        bestPractices: 100,
        seo: 83,
      },
      metaPills: ['Mobile', 'Emulated Moto G Power', 'Slow 4G throttling', 'Lighthouse 13.0.1', 'Single page session'],
      metrics: [
        { label: 'First Contentful Paint', value: '2.8 s' },
        { label: 'Largest Contentful Paint', value: '3.9 s' },
        { label: 'Total Blocking Time', value: '80 ms' },
        { label: 'Cumulative Layout Shift', value: '0' },
        { label: 'Speed Index', value: '4.5 s' },
      ],
      insights: [
        'Improve image delivery — est savings of 162 KiB.',
        'Render blocking requests — est savings of 150 ms.',
        'LCP request discovery.',
        'Network dependency tree.',
        'LCP breakdown.',
        '3rd parties.',
      ],
      diagnostics: [
        'Reduce unused JavaScript — est savings of 95 KiB.',
        'Avoid long main-thread tasks — 3 long tasks found.',
        'User Timing marks and measures — 9 user timings.',
        'Improve image delivery and lazy loading.',
      ],
      seoDetails: [
        'Document does not have a meta description.',
        'robots.txt is not valid — 20 errors found.',
        'Passed audits: 7.',
        'Not applicable: 1.',
        'Run additional validators to complete the SEO review.',
      ],
      accessibilityDetails: [
        'Passed audits: 11.',
        'Not applicable: 48.',
        'Identical links have the same purpose.',
        'Manual checks remain recommended for full coverage.',
      ],
      bestPracticesDetails: [
        'Passed audits: 13.',
        'Not applicable: 2.',
        'Ensure CSP is effective against XSS attacks.',
        'Mitigate clickjacking with XFO or CSP.',
        'Detected JavaScript libraries were reviewed.',
      ],
      summary: 'The report shows a solid base: accessibility and best practices are already at 100, while SEO remains lower because of the missing meta description and robots.txt issues. The main performance gains are linked to images, render-blocking requests, and unused JavaScript.',
    };
  }

  private createGenericReport(url: string): PageSpeedReport {
    return {
      urlLabel: `URL analysée: ${url}`,
      scores: {
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
      },
      metaPills: ['URL en attente', 'Analyse manuelle'],
      metrics: [],
      insights: ['Saisis l’URL cible pour charger le rapport détaillé.'],
      diagnostics: ['Le rapport détaillé est disponible uniquement pour le site demandé.'],
      seoDetails: ['Aucune donnée détaillée affichée tant que l’URL cible n’est pas saisie.'],
      accessibilityDetails: ['Aucune donnée détaillée affichée tant que l’URL cible n’est pas saisie.'],
      bestPracticesDetails: ['Aucune donnée détaillée affichée tant que l’URL cible n’est pas saisie.'],
      summary: 'Saisis https://seo-ia123-vercel.app pour afficher le rapport complet du site.',
    };
  }

  goDashboard(): void {
    void this.router.navigateByUrl('/dashboard').then((ok) => {
      if (!ok && isPlatformBrowser(this.platformId)) {
        window.location.hash = '#/dashboard';
      }
    });
  }
}