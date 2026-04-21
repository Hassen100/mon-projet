import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

const allowedDashboardUrl = 'https://seo-ia123.vercel.app/';
const analysisGateKey = 'analysis_target_url';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  url = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  analyzeUrl(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const normalizedUrl = this.normalizeUrl(this.url);
    if (!normalizedUrl) {
      this.errorMessage = 'Saisissez une URL valide.';
      return;
    }

    if (normalizedUrl !== allowedDashboardUrl) {
      this.errorMessage = 'Veuillez saisir exactement https://seo-ia123.vercel.app/ pour accéder au dashboard.';
      return;
    }

    this.isLoading = true;

    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(analysisGateKey, normalizedUrl);
    }

    this.successMessage = 'URL validée. Ouverture du dashboard...';
    void this.router.navigateByUrl('/dashboard').finally(() => {
      this.isLoading = false;
    });
  }

  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
        return '';
      }

      return `${parsed.origin}/`;
    } catch {
      return '';
    }
  }
}