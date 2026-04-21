import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const allowedDashboardUrl = 'https://seo-ia123.vercel.app/';
const analysisGateKey = 'analysis_target_url';

export const analysisGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const storedUrl = sessionStorage.getItem(analysisGateKey);
  if (storedUrl === allowedDashboardUrl) {
    return true;
  }

  return router.createUrlTree(['/analysis']);
};