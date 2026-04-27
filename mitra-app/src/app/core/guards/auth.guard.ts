import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  const token = auth.getAccessToken();
  if (token && !auth.isTokenExpired(token)) {
    return auth.loadCurrentUser()
      .then(() => true)
      .catch(() => {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      });
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
