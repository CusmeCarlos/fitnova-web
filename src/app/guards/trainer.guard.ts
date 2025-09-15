// src/app/guards/trainer.guard.ts
// 👨‍💼 GUARD PARA ENTRENADORES

import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TrainerGuard {
  
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.user$.pipe(
      take(1),
      map(user => {
        if (!user) {
          console.log('❌ TrainerGuard: No autenticado');
          return this.router.createUrlTree(['/auth/login']);
        }
        
        if (['trainer', 'admin'].includes(user.role)) {
          console.log('✅ TrainerGuard: Acceso permitido para', user.role);
          return true;
        } else {
          console.log('🚫 TrainerGuard: Rol no autorizado:', user.role);
          return this.router.createUrlTree(['/shared/forbidden']);
        }
      })
    );
  }
}