import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

function clearAuthStorage(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_expires');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_is_admin');
  localStorage.removeItem('user_is_superuser');
  localStorage.removeItem('user_id');
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const tokenRaw = localStorage.getItem('auth_token');
  const expiresRaw = localStorage.getItem('auth_expires');

  if (!tokenRaw) {
    return router.createUrlTree(['/login']);
  }

  if (expiresRaw) {
    const expiresAt = Date.parse(expiresRaw);
    if (!Number.isNaN(expiresAt) && Date.now() > expiresAt) {
      clearAuthStorage();
      return router.createUrlTree(['/login']);
    }
  }

  try {
    const parsed = JSON.parse(tokenRaw);
    if (!parsed?.token) {
      clearAuthStorage();
      return router.createUrlTree(['/login']);
    }
  } catch {
    clearAuthStorage();
    return router.createUrlTree(['/login']);
  }

  return true;
};
