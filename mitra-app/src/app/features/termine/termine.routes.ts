import { Routes } from '@angular/router';

export const TERMINE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./termine-liste/termine-liste.component').then(m => m.TermineListeComponent),
  },
  {
    path: 'neu',
    loadComponent: () => import('./termin-detail/termin-detail.component').then(m => m.TerminDetailComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./termin-detail/termin-detail.component').then(m => m.TerminDetailComponent),
  },
];
