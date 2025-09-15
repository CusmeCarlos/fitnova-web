// src/app/core/auth.service.ts
// 🔐 AUTH SERVICE COMPARTIDO - COMPATIBLE CON MÓVIL

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../interfaces/user.interface';
import { environment } from '../../environments/environment';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {
    this.initializeAuthListener();
  }

  private initializeAuthListener(): void {
    this.afAuth.authState.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener datos del usuario desde Firestore
        const userDoc = await this.firestore
          .collection('users')
          .doc(firebaseUser.uid)
          .get()
          .toPromise();

        if (userDoc?.exists) {
          const userData = userDoc.data() as any;
          
          // ✅ VERIFICAR QUE EL USUARIO TIENE ROL PERMITIDO EN WEB
          if (this.isAllowedRole(userData.role)) {
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || userData.displayName,
              photoURL: firebaseUser.photoURL || undefined,
              emailVerified: firebaseUser.emailVerified,
              role: userData.role,
              isActive: userData.isActive !== false,
              lastLoginAt: new Date(),
              trainerProfile: userData.trainerProfile
            };

            this.userSubject.next(user);
            
            // Actualizar último login
            await this.updateLastLogin(firebaseUser.uid);
          } else {
            // Usuario no autorizado para plataforma web
            console.warn('🚫 Usuario sin permisos para plataforma web:', userData.role);
            await this.logout();
          }
        } else {
          // Usuario no existe en Firestore
          console.warn('🚫 Usuario no encontrado en Firestore');
          await this.logout();
        }
      } else {
        this.userSubject.next(null);
      }
    });
  }

  // ✅ VERIFICAR ROLES PERMITIDOS EN WEB
  private isAllowedRole(role: string): boolean {
    return environment.webConfig.allowedRoles.includes(role);
  }

  // 🔐 LOGIN ESPECÍFICO PARA ENTRENADORES/ADMIN
  async login(email: string, password: string): Promise<void> {
    try {
      console.log('🔐 Iniciando login plataforma web:', email);
      
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      
      if (userCredential.user) {
        // Verificar rol en Firestore
        const userDoc = await this.firestore
          .collection('users')
          .doc(userCredential.user.uid)
          .get()
          .toPromise();

        const userData = userDoc?.data() as any;
        
        if (!userData || !this.isAllowedRole(userData.role)) {
          await this.afAuth.signOut();
          throw new Error('No tienes permisos para acceder a la plataforma web');
        }

        console.log('✅ Login exitoso - Rol:', userData.role);
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // 🚪 LOGOUT
  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
      this.userSubject.next(null);
      this.router.navigate(['/auth/login']);
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  }

  // 👤 OBTENER USUARIO ACTUAL
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // 🔍 VERIFICAR SI ESTÁ AUTENTICADO
  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  // 🔍 VERIFICAR ROL
  hasRole(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin tiene acceso a todo
    if (user.role === 'admin') return true;
    
    // Verificar rol específico
    return user.role === requiredRole;
  }

  // 🔍 VERIFICAR SI ES ENTRENADOR
  isTrainer(): boolean {
    return this.hasRole('trainer');
  }

  // 🔍 VERIFICAR SI ES ADMIN
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // 📝 ACTUALIZAR ÚLTIMO LOGIN
  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.firestore.collection('users').doc(uid).update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginPlatform: 'web'
      });
    } catch (error) {
      console.warn('⚠️ No se pudo actualizar último login:', error);
    }
  }

  // 🔄 RESET PASSWORD
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      console.log('✅ Email de reset enviado');
    } catch (error: any) {
      console.error('❌ Error enviando reset:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // 🛠️ OBTENER MENSAJE DE ERROR AMIGABLE
  private getErrorMessage(error: any): string {
    const errorCode = error.code || error.message;
    
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Usuario deshabilitado';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Inténtalo más tarde';
      default:
        return error.message || 'Error de autenticación';
    }
  }
}