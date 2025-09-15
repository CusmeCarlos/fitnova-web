// src/app/guards/auth.guard.ts  
// 🛡️ GUARD DE AUTENTICACIÓN ADAPTADO

import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          console.log('✅ AuthGuard: Usuario autenticado');
          return true;
        } else {
          console.log('❌ AuthGuard: Usuario no autenticado, redirigiendo...');
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
}
