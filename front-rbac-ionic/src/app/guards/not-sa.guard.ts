import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Bloquea acceso a rutas de Admin cuando el usuario es SA.
export const notSaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  if (auth.isSa()) {
    router.navigateByUrl('/home-sa');
    return false;
  }

  return true;
};
