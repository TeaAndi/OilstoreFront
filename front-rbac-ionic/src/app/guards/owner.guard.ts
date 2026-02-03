import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Debe estar logueado
  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  // Debe ser db_owner y además username=sa
  if (!auth.isOwner() || !auth.isSa()) {
    router.navigateByUrl('/home-admin');
    return false;
  }

  return true;
};
