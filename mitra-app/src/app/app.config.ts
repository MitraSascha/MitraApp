import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { offlineInterceptor } from './core/interceptors/offline.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([offlineInterceptor, jwtInterceptor, refreshInterceptor])
    ),
    provideServiceWorker(isDevMode() ? 'push-sw.js' : 'ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:3000',
    }),
  ],
};
