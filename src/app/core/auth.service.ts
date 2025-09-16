// src/app/core/auth.service.ts
// 🔐 AUTH SERVICE WEB ADAPTADO - BASADO EN MÓVIL FUNCIONAL

import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { User } from '../interfaces/user.interface';
import { MatSnackBar } from '@angular/material/snack-bar'; // ✅ CAMBIO: Angular Material en lugar de Ionic

@Injectable({ providedIn: 'root' })
export class AuthService {
  createUserForWeb(email: any, password: any, arg2: { displayName: any; role: string; assignedTrainer: any; }) {
    throw new Error('Method not implemented.');
  }
  user$: Observable<User | null>;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private snackBar: MatSnackBar // ✅ CAMBIO: Material SnackBar
  ) {
    // ✅ CONFIGURAR OBSERVABLE DEL USUARIO (misma lógica que móvil)
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          this.currentUserSubject.next(null);
          return of(null);
        }
        
        const db = firebase.firestore();
        return new Observable<User | null>(subscriber => {
          db.doc(`users/${user.uid}`).onSnapshot(doc => {
            if (doc.exists) {
              const userData = doc.data() as User;
              
              // ✅ VERIFICAR ROL PERMITIDO EN PLATAFORMA WEB
              if (this.isWebAllowedRole(userData.role)) {
                this.currentUserSubject.next(userData);
                subscriber.next(userData);
              } else {
                console.warn('🚫 Acceso denegado - Rol no autorizado para web:', userData.role);
                this.currentUserSubject.next(null);
                subscriber.next(null);
                this.router.navigate(['/shared/forbidden']);
              }
            } else {
              this.currentUserSubject.next(null);
              subscriber.next(null);
            }
          });
        });
      })
    );

    // Debug para desarrollo
    this.user$.subscribe(user => {
      console.log('🔥 AuthService Web - Usuario actualizado:', user ? 
        `${user.displayName} (${user.role})` : 'No autenticado');
    });
  }

  // ✅ VERIFICAR ROLES PERMITIDOS EN WEB (solo trainer/admin)
  private isWebAllowedRole(role: string): boolean {
    return ['trainer', 'admin'].includes(role?.toLowerCase());
  }

  // ✅ LOGIN - MISMA LÓGICA QUE MÓVIL, NAVEGACIÓN ADAPTADA
  async login(email: string, password: string): Promise<void> {
    try {
      console.log('🔐 Iniciando login web para:', email);
      
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      
      if (userCredential.user) {
        // Verificar rol antes de navegar
        const db = firebase.firestore();
        const userDoc = await db.doc(`users/${userCredential.user.uid}`).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data() as User;
          
          if (this.isWebAllowedRole(userData.role)) {
            await this.showSuccessMessage('¡Bienvenido a FitNova Web!');
            console.log('✅ Login web exitoso para:', email);
            
            // ✅ CAMBIO: Navegar a dashboard en lugar de tabs
            this.router.navigate(['/dashboard/overview']);
          } else {
            await this.afAuth.signOut();
            throw new Error('Acceso denegado: Solo entrenadores y administradores pueden acceder a la plataforma web');
          }
        } else {
          await this.afAuth.signOut();
          throw new Error('Usuario no encontrado en la base de datos');
        }
      }
    } catch (error: any) {
      console.error('❌ Error en login web:', error);
      await this.showErrorMessage(this.getErrorMessage(error));
      throw error;
    }
  }

  // ✅ LOGOUT - MISMA LÓGICA, NAVEGACIÓN ADAPTADA
  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
      await this.showSuccessMessage('Sesión cerrada correctamente');
      
      // ✅ CAMBIO: Navegar a login en lugar de móvil
      this.router.navigate(['/auth/login']);
      console.log('✅ Logout web exitoso');
    } catch (error) {
      console.error('❌ Error en logout web:', error);
      await this.showErrorMessage('Error al cerrar sesión');
    }
  }

  // ✅ CREAR USUARIO - SOLO PARA ADMIN (funcionalidad web)
  async createUser(userData: {
    email: string;
    password: string;
    displayName: string;
    role: 'trainer' | 'admin';
  }): Promise<void> {
    try {
      console.log('👤 Creando usuario web:', userData.email);
      
      // Verificar que el usuario actual sea admin
      const currentUser = this.currentUserSubject.value;
      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error('Solo los administradores pueden crear usuarios');
      }
      
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(
        userData.email, 
        userData.password
      );

      if (userCredential.user) {
        // Actualizar perfil
        await userCredential.user.updateProfile({
          displayName: userData.displayName
        });

        // Crear documento en Firestore
        const db = firebase.firestore();
        await db.doc(`users/${userCredential.user.uid}`).set({
          uid: userCredential.user.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          createdBy: currentUser.uid, // Quien creó el usuario
          trainerProfile: userData.role === 'trainer' ? {
            specialties: [],
            certifications: [],
            assignedUsers: []
          } : undefined
        });

        await this.showSuccessMessage('Usuario creado exitosamente');
        console.log('✅ Usuario web creado exitosamente');
      }
    } catch (error: any) {
      console.error('❌ Error creando usuario web:', error);
      await this.showErrorMessage(this.getErrorMessage(error));
      throw error;
    }
  }

  // ✅ OBTENER USUARIO ACTUAL SINCRONO
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ✅ OBTENER UID DEL USUARIO ACTUAL
  async getCurrentUserId(): Promise<string | null> {
    try {
      const user = await this.afAuth.currentUser;
      return user?.uid || null;
    } catch (error) {
      console.error('Error obteniendo UID actual:', error);
      return null;
    }
  }

  // ✅ VERIFICAR SI ES ADMIN
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // ✅ VERIFICAR SI ES TRAINER O ADMIN
  isTrainerOrAdmin(): boolean {
    const user = this.getCurrentUser();
    return ['trainer', 'admin'].includes(user?.role || '');
  }

  // ✅ MENSAJES CON MATERIAL DESIGN (reemplaza toasts de Ionic)
  private async showSuccessMessage(message: string): Promise<void> {
    try {
      this.snackBar.open(message, 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error mostrando mensaje de éxito:', error);
    }
  }

  private async showErrorMessage(message: string): Promise<void> {
    try {
      this.snackBar.open(message, 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['error-snackbar']
      });
    } catch (error) {
      console.error('Error mostrando mensaje de error:', error);
    }
  }

  // ✅ MANEJO DE ERRORES FIREBASE (misma lógica que móvil)
  private getErrorMessage(error: any): string {
    if (error?.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'No existe una cuenta con este correo electrónico';
        case 'auth/wrong-password':
          return 'Contraseña incorrecta';
        case 'auth/email-already-in-use':
          return 'Ya existe una cuenta con este correo electrónico';
        case 'auth/weak-password':
          return 'La contraseña debe tener al menos 6 caracteres';
        case 'auth/invalid-email':
          return 'El formato del correo electrónico no es válido';
        case 'auth/too-many-requests':
          return 'Demasiados intentos fallidos. Intente más tarde';
        case 'auth/network-request-failed':
          return 'Error de conexión. Verifica tu conexión a internet';
        case 'auth/operation-not-allowed':
          return 'Método de autenticación no habilitado';
        case 'auth/user-disabled':
          return 'Esta cuenta ha sido deshabilitada';
        case 'auth/requires-recent-login':
          return 'Por seguridad, debes iniciar sesión nuevamente';
        default:
          return error.message || 'Error de autenticación';
      }
    }
    
    return error?.message || 'Error desconocido';
  }

  // ✅ RESET PASSWORD
  async resetPassword(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
      await this.showSuccessMessage('Se ha enviado un enlace de restablecimiento a tu correo');
    } catch (error: any) {
      console.error('Error en reset password:', error);
      await this.showErrorMessage(this.getErrorMessage(error));
      throw error;
    }
  }

  // ✅ VERIFICAR ESTADO DE AUTENTICACIÓN
  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.afAuth.currentUser;
      return !!user;
    } catch {
      return false;
    }
  }

  // ✅ OBTENER TOKEN PARA API CALLS
  async getIdToken(): Promise<string | null> {
    try {
      const user = await this.afAuth.currentUser;
      return user ? await user.getIdToken() : null;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }
}