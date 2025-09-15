// src/app/guards/admin.guard.ts
// 👑 GUARD PARA ADMINISTRADORES

import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.user$.pipe(
      take(1),
      map(user => {
        if (!user) {
          console.log('❌ AdminGuard: No autenticado');
          return this.router.createUrlTree(['/auth/login']);
        }
        
        if (user.role === 'admin') {
          console.log('✅ AdminGuard: Acceso de admin permitido');
          return true;
        } else {
          console.log('🚫 AdminGuard: Solo administradores. Rol actual:', user.role);
          return this.router.createUrlTree(['/shared/forbidden']);
        }
      })
    );
  }
}