import { Routes } from '@angular/router';

export const VISITENKARTEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./visitenkarten-liste/visitenkarten-liste.component').then(
        m => m.VisitenkartenListeComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./visitenkarte-detail/visitenkarte-detail.component').then(
        m => m.VisitenkartDetailComponent
      ),
  },
];
