import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UIStore } from '../../shared/ui/ui.store';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const uiStore = inject(UIStore);

  if (!navigator.onLine) {
    uiStore.setOnline(false);
    if (req.method === 'GET') {
      // GET-Requests offline: leer zurückgeben, Komponente lädt aus IndexedDB
      return EMPTY;
    }
    // POST/PUT/DELETE offline: wird von Feature-Service in SyncQueue geschrieben
    return EMPTY;
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Netzwerkfehler
        uiStore.setOnline(false);
        return EMPTY;
      }
      return throwError(() => error);
    }),
  );
};
