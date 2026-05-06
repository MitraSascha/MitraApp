import { Routes } from '@angular/router';

export const BAUTAGEBUCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./bautagebuch-liste/bautagebuch-liste.component').then(m => m.BautagebuchListeComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./bautagebuch-editor/bautagebuch-editor.component').then(m => m.BautagebuchEditorComponent),
  },
];
