import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que redirige a la ruta correcta según el rol del usuario
 * SA → /sa/{route}
 * Admin (db_owner no SA) → /admin/{route}
 */
export const roleRouteGuard = (targetRoute: string) => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
      router.navigate(['/login']);
      return false;
    }

    const isSA = auth.isSa();
    
    if (isSA) {
      // Usuario SA → ruta /sa/
      router.navigate([`/sa/${targetRoute}`]);
    } else {
      // Usuario Admin → ruta /admin/
      router.navigate([`/admin/${targetRoute}`]);
    }

    return false; // No permitir acceso directo a la ruta genérica
  };
};
