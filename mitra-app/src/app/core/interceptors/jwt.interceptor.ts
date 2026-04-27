import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const AUTH_BYPASS_URLS = ['/auth/login/', '/auth/refresh/'];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthUrl = AUTH_BYPASS_URLS.some(url => req.url.includes(url));

  if (isAuthUrl) return next(req);

  const token = auth.getAccessToken();
  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
