import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs';
import {
  ContentAnalysisDetail,
  ContentAnalysisListItem,
  ContentOptimizerService,
} from '../../services/content-optimizer.service';

@Component({
  selector: 'app-content-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './content-optimizer.component.html',
  styleUrls: ['./content-optimizer.component.scss'],
})
export class ContentOptimizerComponent implements OnInit, OnDestroy {
  private readonly contentOptimizerService = inject(ContentOptimizerService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  analyses: ContentAnalysisListItem[] = [];
  filteredAnalyses: ContentAnalysisListItem[] = [];
  selectedDetail: ContentAnalysisDetail | null = null;

  filterQuery = '';
  targetUrl = '';
  loading = false;
  detailLoading = false;
  refreshing = false;
  errorMessage = '';
  detailErrorMessage = '';
  refreshMessage = '';
  activeTab: 'recommendations' | 'technical' = 'recommendations';
  averageSemanticScore = 0;

  private refreshPollTimer: ReturnType<typeof setInterval> | null = null;
  private refreshPollAttempts = 0;
  private authRedirecting = false;

  userInitial = 'H';
  userName = 'hassen selmi';
  isAdmin = false;
  isSuperUser = false;

  get userRoleLabel(): string {
    return this.isSuperUser ? 'Administrateur' : 'Utilisateur';
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadAnalyses();
  }

  ngOnDestroy(): void {
    this.stopRefreshPolling();
  }

  private loadUserData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const authData = localStorage.getItem('auth_token');
    if (!authData) {
      return;
    }

    try {
      const parsed = JSON.parse(authData);
      this.userName = parsed.username || this.userName;
      this.isAdmin = parsed.is_admin || false;
      this.isSuperUser = parsed.is_superuser || false;
      this.userInitial = (this.userName.charAt(0) || 'H').toUpperCase();
    } catch {
      // Ignore malformed auth data.
    }
  }

  loadAnalyses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.contentOptimizerService.getAnalyses().subscribe({
      next: (response) => {
        this.analyses = response.results || [];
        this.filteredAnalyses = [...this.analyses];
        this.averageSemanticScore = response.average_semantic_score || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.toUiErrorMessage(error, 'Impossible de charger les analyses de contenu.');
      },
    });
  }

  onFilterChange(): void {
    const normalized = this.filterQuery.trim().toLowerCase();
    if (!normalized) {
      this.filteredAnalyses = [...this.analyses];
      return;
    }

    this.filteredAnalyses = this.analyses.filter((item) => item.url.toLowerCase().includes(normalized));
  }

  openDetail(item: ContentAnalysisListItem): void {
    this.detailLoading = true;
    this.detailErrorMessage = '';
    this.activeTab = 'recommendations';
    this.selectedDetail = null;

    this.contentOptimizerService.getAnalysisDetail(item.id).pipe(timeout(15000)).subscribe({
      next: (detail) => {
        this.selectedDetail = detail;
        this.detailLoading = false;
      },
      error: (error) => {
        this.detailErrorMessage = this.toUiErrorMessage(error, 'Impossible de charger le detail (timeout ou acces refuse).');
        this.detailLoading = false;
      },
    });
  }

  closeDetail(): void {
    this.selectedDetail = null;
    this.detailLoading = false;
    this.detailErrorMessage = '';
  }

  triggerRefresh(): void {
    this.refreshing = true;
    this.refreshMessage = '';

    this.contentOptimizerService.refreshAnalyses(50).subscribe({
      next: (response) => {
        const count = response?.result?.max_urls || 0;
        const target = (response?.result?.target_url || '').trim();
        this.refreshMessage = target
          ? `Mise a jour lancee pour ${target} (max ${count} URL(s)). Recharge dans quelques secondes.`
          : `Mise a jour lancee en arriere-plan (max ${count} URL(s)). Recharge dans quelques secondes.`;
        this.startRefreshPolling(target);
      },
      error: (error) => {
        this.refreshing = false;
        this.refreshMessage = this.toUiErrorMessage(error, 'La relance a echoue.');
      },
    });
  }

  getScoreClass(score: number): string {
    if (score >= 75) {
      return 'score-good';
    }
    if (score >= 50) {
      return 'score-medium';
    }
    return 'score-low';
  }

  getScoreBarWidth(score: number): string {
    return `${Math.max(0, Math.min(100, score))}%`;
  }

  trackByAnalysisId(_: number, item: ContentAnalysisListItem): number {
    return item.id;
  }

  refreshForTargetUrl(): void {
    this.refreshing = true;
    this.refreshMessage = '';

    this.contentOptimizerService.refreshAnalyses(50, this.targetUrl).subscribe({
      next: (response) => {
        const count = response?.result?.max_urls || 0;
        const target = (response?.result?.target_url || '').trim();
        this.refreshMessage = target
          ? `Mise a jour lancee pour ${target} (max ${count} URL(s)). Recharge dans quelques secondes.`
          : `Mise a jour lancee en arriere-plan (max ${count} URL(s)). Recharge dans quelques secondes.`;
        this.startRefreshPolling(target);
      },
      error: (error) => {
        this.refreshing = false;
        this.refreshMessage = this.toUiErrorMessage(error, 'La relance a echoue.');
      },
    });
  }

  private startRefreshPolling(targetUrl: string): void {
    const normalizedTarget = this.normalizeUrl(targetUrl);
    this.stopRefreshPolling();
    this.refreshPollAttempts = 0;

    this.refreshPollTimer = setInterval(() => {
      this.refreshPollAttempts += 1;

      this.contentOptimizerService.getAnalyses().subscribe({
        next: (response) => {
          this.analyses = response.results || [];
          this.averageSemanticScore = response.average_semantic_score || 0;
          this.onFilterChange();

          const foundTarget = normalizedTarget
            ? this.analyses.find((item) => this.normalizeUrl(item.url) === normalizedTarget)
            : null;

          if (foundTarget) {
            this.refreshMessage = `Analyse terminee pour ${foundTarget.url}.`;
            this.stopRefreshPolling();
            this.refreshing = false;
            this.openDetail(foundTarget);
            return;
          }

          if (this.refreshPollAttempts >= 15) {
            this.refreshMessage = normalizedTarget
              ? 'Analyse en cours. Les donnees arriveront sous peu, essayez de recharger la liste.'
              : 'Mise a jour terminee partiellement. Rechargez la liste si besoin.';
            this.stopRefreshPolling();
            this.refreshing = false;
          }
        },
        error: () => {
          if (this.refreshPollAttempts >= 15) {
            this.refreshMessage = 'Impossible de verifier la fin de mise a jour automatiquement.';
            this.stopRefreshPolling();
            this.refreshing = false;
          }
        },
      });
    }, 2000);
  }

  private stopRefreshPolling(): void {
    if (this.refreshPollTimer) {
      clearInterval(this.refreshPollTimer);
      this.refreshPollTimer = null;
    }
  }

  private normalizeUrl(value: string): string {
    const raw = (value || '').trim().toLowerCase();
    if (!raw) {
      return '';
    }

    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
  }

  private toUiErrorMessage(error: unknown, fallback: string): string {
    const httpError = error as Partial<HttpErrorResponse> | null;
    if (httpError?.status === 401) {
      this.redirectToLogin();
      return 'Session expiree ou invalide. Merci de vous reconnecter.';
    }

    const payload = httpError?.error as { message?: string; error?: string } | undefined;
    return payload?.message || payload?.error || fallback;
  }

  private redirectToLogin(): void {
    if (this.authRedirecting || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.authRedirecting = true;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_is_admin');
    localStorage.removeItem('user_is_superuser');
    localStorage.removeItem('user_id');
    void this.router.navigate(['/login']);
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
    localStorage.removeItem('user_is_superuser');
    localStorage.removeItem('user_id');
    this.router.navigate(['/login']);
  }
}
