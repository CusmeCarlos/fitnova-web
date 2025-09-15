// src/app/guards/trainer.guard.ts
// 👨‍💼 GUARD PARA ENTRENADORES

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

export const trainerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (authService.isTrainer() || authService.isAdmin()) {
      return true;
    } else {
      console.log('🚫 Acceso denegado - Requiere rol de entrenador');
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