// src/app/core/auth.service.ts
// 🔐 AUTH SERVICE WEB ADAPTADO - BASADO EN MÓVIL FUNCIONAL

import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { User } from '../interfaces/user.interface';
import { MatSnackBar } from '@angular/material/snack-bar'; // ✅ CAMBIO: Angular Material en lugar de Ionic

@Injectable({ providedIn: 'root' })
export class AuthService {
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
      console.log('Usuario autenticado:', user?.displayName || 'No autenticado');
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

  // 🚀 MÉTODO createUserForWeb ACTUALIZADO - USA CLOUD FUNCTIONS
// Reemplazar el método actual en auth.service.ts

async createUserForWeb(userData: {
  email: string;
  password: string;
  displayName: string;
  role: 'user';
  assignedTrainer?: string;
}): Promise<void> {
  try {
    console.log('👤 Creando usuario web via Cloud Function:', userData.email);
    
    // ✅ VERIFICAR PERMISOS LOCALMENTE (doble verificación)
    const currentUser = this.currentUserSubject.value;
    if (!currentUser || !['trainer', 'admin'].includes(currentUser.role)) {
      throw new Error('Solo los entrenadores y administradores pueden crear usuarios');
    }

    // ✅ PREPARAR DATOS PARA CLOUD FUNCTION
    const functionData = {
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      assignedTrainer: currentUser.role === 'trainer' ? currentUser.uid : userData.assignedTrainer
    };

    console.log('📡 Llamando Cloud Function con datos:', {
      email: functionData.email,
      displayName: functionData.displayName,
      assignedTrainer: functionData.assignedTrainer,
      callerRole: currentUser.role
    });

    // ✅ OBTENER TOKEN DE AUTENTICACIÓN
    const user = await this.afAuth.currentUser;
    const idToken = user ? await user.getIdToken() : null;
    if (!idToken) {
      throw new Error('Token de autenticación no disponible');
    }

    // ✅ LLAMAR CLOUD FUNCTION
    const createUserFunction = firebase.functions().httpsCallable('createMobileUser');
    
    // Llamada con retry en caso de timeout
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`📞 Intento ${attempts + 1}/${maxAttempts} - Llamando Cloud Function...`);
        
        result = await createUserFunction(functionData);
        
        console.log('✅ Cloud Function ejecutada exitosamente:', result.data);
        break;
        
      } catch (functionError: any) {
        attempts++;
        console.error(`❌ Error en intento ${attempts}:`, functionError);
        
        if (attempts >= maxAttempts) {
          throw functionError;
        }
        
        // Esperar 1 segundo antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // ✅ PROCESAR RESPUESTA
    if (result?.data?.success) {
      const userData = result.data.userData;
      
      // Mensaje personalizado según el rol
      let successMessage = '';
      if (currentUser.role === 'trainer') {
        successMessage = `Usuario ${userData.displayName} registrado exitosamente y asignado a ti como entrenador`;
      } else {
        successMessage = `Usuario ${userData.displayName} creado exitosamente`;
        if (userData.assignedTrainerName) {
          successMessage += ` y asignado al entrenador ${userData.assignedTrainerName}`;
        }
      }
      
      await this.showSuccessMessage(successMessage);
      console.log('🎉 Usuario creado exitosamente:', userData);
      
      return; // Éxito completo
    } else {
      throw new Error('La Cloud Function no retornó éxito');
    }
    
  } catch (error: any) {
    console.error('❌ Error completo al crear usuario:', error);
    
    // ✅ MANEJO DE ERRORES ESPECÍFICOS DE CLOUD FUNCTIONS
    let errorMessage = 'Error al crear el usuario';
    
    if (error.code) {
      switch (error.code) {
        case 'functions/unauthenticated':
          errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente';
          // Opcional: redirigir al login
          this.router.navigate(['/auth/login']);
          break;
          
        case 'functions/permission-denied':
          errorMessage = 'No tienes permisos para crear usuarios';
          break;
          
        case 'functions/already-exists':
          errorMessage = 'Ya existe una cuenta con este email';
          break;
          
        case 'functions/invalid-argument':
          errorMessage = error.message || 'Datos inválidos';
          break;
          
        case 'functions/internal':
          errorMessage = 'Error interno del servidor. Intenta nuevamente';
          break;
          
        case 'functions/unavailable':
          errorMessage = 'Servicio temporalmente no disponible. Intenta más tarde';
          break;
          
        case 'functions/deadline-exceeded':
          errorMessage = 'Tiempo de espera agotado. Intenta nuevamente';
          break;
          
        default:
          errorMessage = error.message || 'Error desconocido';
          console.error('Error de Cloud Function no manejado:', error.code, error);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    await this.showErrorMessage(errorMessage);
    throw error;
  }
}

// 🚀 MÉTODO ADICIONAL: Obtener estadísticas via Cloud Function (bonus)
async getUserStatsViaFunction(userId?: string): Promise<any> {
  try {
    const getUserStatsFunction = firebase.functions().httpsCallable('getUserStats');
    const result = await getUserStatsFunction({ userId });
    
    if (result?.data?.success) {
      return result.data.stats;
    } else {
      throw new Error('No se pudieron obtener las estadísticas');
    }
  } catch (error: any) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
}
getCurrentUser(): User | null {
  return this.currentUserSubject.value;
}

// ✅ MÉTODO PARA OBTENER USUARIO ACTUAL - ASINCRONO (PARA ALERT SERVICE)
async getCurrentUserAsync(): Promise<User | null> {
  try {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      return currentUser;
    }
    
    // Si no hay usuario en el subject, intentar obtenerlo de Firebase
    const user = await this.afAuth.currentUser;
    if (user) {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        return {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: userData?.['role'] || 'user',
          emailVerified: user.emailVerified,
          createdAt: userData?.['createdAt']?.toDate() || new Date(),
          ...userData
        } as User;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo usuario actual:', error);
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