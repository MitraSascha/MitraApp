import { Routes } from '@angular/router';

export const ANGEBOTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./angebote-liste/angebote-liste.component').then(
        m => m.AngeboteListeComponent
      ),
  },
  {
    path: 'neu',
    loadComponent: () =>
      import('./angebot-editor/angebot-editor.component').then(
        m => m.AngebotEditorComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./angebot-editor/angebot-editor.component').then(
        m => m.AngebotEditorComponent
      ),
  },
];
