// src/app/guards/admin.guard.ts
// 👑 GUARD PARA ADMINISTRADORES

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (authService.isAdmin()) {
      return true;
    } else {
      console.log('🚫 Acceso denegado - Requiere rol de administrador');
      router.navigate(['/forbidden']);
      return false;
    }
  } else {
    console.log('🚫 Acceso denegado - No autenticado');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
};