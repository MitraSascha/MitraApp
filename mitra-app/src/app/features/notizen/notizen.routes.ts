import { Routes } from '@angular/router';

export const NOTIZEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./notizen-liste/notizen-liste.component').then(m => m.NotizenListeComponent),
  },
];
