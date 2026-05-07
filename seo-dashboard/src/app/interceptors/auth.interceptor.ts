import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Prefer the project's `auth_token` (used across the app); fall back to `access_token` if present.
  const raw = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
  let token = '';

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      token = parsed?.token || (typeof parsed === 'string' ? parsed : '');
    } catch {
      token = raw;
    }
  }

  if (token) {
    // Backend expects `Token <token>` (DRF TokenAuth) across services.
    req = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`
      }
    });
  }

  return next(req);
};
