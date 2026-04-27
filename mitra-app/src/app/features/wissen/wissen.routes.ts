import { Routes } from '@angular/router';

export const WISSEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./chat/chat.component').then(m => m.ChatComponent),
  },
];
