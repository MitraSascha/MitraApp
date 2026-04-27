import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { from } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/refresh/') || isRefreshing) {
        return throwError(() => error);
      }

      isRefreshing = true;
      return from(auth.refreshToken()).pipe(
        switchMap(newToken => {
          isRefreshing = false;
          return next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          }));
        }),
        catchError(refreshError => {
          isRefreshing = false;
          auth.clearTokens();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
