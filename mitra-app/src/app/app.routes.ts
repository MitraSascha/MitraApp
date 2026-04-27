import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    title: 'Anmelden',
  },
  {
    path: '',
    loadComponent: () => import('./app').then(m => m.App),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        title: 'Dashboard',
      },
      {
        path: 'notizen',
        loadChildren: () => import('./features/notizen/notizen.routes').then(m => m.NOTIZEN_ROUTES),
        title: 'Notizen',
      },
      {
        path: 'termine',
        loadChildren: () => import('./features/termine/termine.routes').then(m => m.TERMINE_ROUTES),
        title: 'Termine',
      },
      {
        path: 'angebote',
        loadChildren: () => import('./features/angebote/angebote.routes').then(m => m.ANGEBOTE_ROUTES),
        title: 'Angebote',
      },
      {
        path: 'visitenkarten',
        loadChildren: () => import('./features/visitenkarten/visitenkarten.routes').then(m => m.VISITENKARTEN_ROUTES),
        title: 'Visitenkarten',
      },
      {
        path: 'wissen',
        loadChildren: () => import('./features/wissen/wissen.routes').then(m => m.WISSEN_ROUTES),
        title: 'Wissensdatenbank',
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
