// src/app/core/auth.service.ts
// 🔐 AUTH SERVICE WEB ADAPTADO - BASADO EN MÓVIL FUNCIONAL

import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
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
    private fns: AngularFireFunctions,
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
        // Sincronizar estado de email verificado desde Auth a Firestore
        await this.syncEmailVerificationStatus(userCredential.user.uid);

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

  // 🔄 SINCRONIZAR ESTADO DE EMAIL VERIFICADO
  private async syncEmailVerificationStatus(uid: string): Promise<void> {
    try {
      const checkEmailVerification = firebase.functions().httpsCallable('checkEmailVerification');
      const result = await checkEmailVerification({ uid });
      console.log('✅ Estado de email verificado sincronizado para UID:', uid, result.data);
    } catch (error) {
      console.warn('⚠️ No se pudo sincronizar el estado de email verificado:', error);
      // No lanzamos error porque esto no debe bloquear el login
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

  // ✅ RESET PASSWORD (Método original - mantener por compatibilidad)
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

  // 🔐 MÉTODOS DE RECUPERACIÓN DE CONTRASEÑA CON CÓDIGO DE VERIFICACIÓN

  /**
   * Envía un código de verificación al correo del usuario para recuperación de contraseña
   * @param email Correo electrónico del usuario
   */
  async sendPasswordResetCode(email: string): Promise<void> {
    try {
      console.log('📧 Enviando código de verificación a:', email);

      // Verificar que el usuario existe
      const db = firebase.firestore();
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw { code: 'auth/user-not-found' };
      }

      // Generar código de 6 dígitos
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Guardar el código en Firestore con expiración de 10 minutos
      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      await db.collection('passwordResetCodes').doc(userId).set({
        email: email,
        code: verificationCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 minutos
        used: false
      });

      // Enviar email con el código usando la extensión de Firebase
      await db.collection('mail').add({
        to: email,
        message: {
          subject: 'Código de Recuperación de Contraseña - FitNova',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #667eea; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Recuperación de Contraseña</h1>
                  <p>FitNova</p>
                </div>
                <div class="content">
                  <p>Hola,</p>
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en FitNova.</p>
                  <p>Tu código de verificación es:</p>
                  <div class="code">${verificationCode}</div>
                  <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                      <li>Este código expira en <strong>10 minutos</strong></li>
                      <li>Solo puedes usarlo una vez</li>
                      <li>Si no solicitaste este código, ignora este correo</li>
                    </ul>
                  </div>
                  <p>Ingresa este código en la aplicación para continuar con el proceso de recuperación.</p>
                </div>
                <div class="footer">
                  <p>Este es un correo automático, por favor no respondas.</p>
                  <p>&copy; ${new Date().getFullYear()} FitNova. Todos los derechos reservados.</p>
                </div>
              </div>
            </body>
            </html>
          `
        }
      });

      console.log('✅ Código de verificación enviado exitosamente');
    } catch (error: any) {
      console.error('❌ Error al enviar código de verificación:', error);
      throw error;
    }
  }

  /**
   * Verifica el código de recuperación ingresado por el usuario
   * @param email Correo electrónico del usuario
   * @param code Código de verificación de 6 dígitos
   * @returns true si el código es válido, false en caso contrario
   */
  async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    try {
      console.log('🔍 Verificando código para:', email);

      const db = firebase.firestore();

      // Buscar el usuario por email
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw { code: 'auth/user-not-found' };
      }

      const userId = usersSnapshot.docs[0].id;

      // Obtener el código almacenado
      const codeDoc = await db.collection('passwordResetCodes').doc(userId).get();

      if (!codeDoc.exists) {
        console.error('❌ No existe código para este usuario');
        return false;
      }

      const codeData = codeDoc.data();

      // Verificar que el código no haya sido usado
      if (codeData?.['used']) {
        console.error('❌ El código ya fue utilizado');
        return false;
      }

      // Verificar que el código no haya expirado
      const expiresAt = codeData?.['expiresAt']?.toDate();
      if (!expiresAt || expiresAt < new Date()) {
        console.error('❌ El código ha expirado');
        return false;
      }

      // Verificar que el código coincida
      if (codeData?.['code'] !== code) {
        console.error('❌ El código no coincide');
        return false;
      }

      console.log('✅ Código verificado exitosamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error al verificar código:', error);
      throw error;
    }
  }

  /**
   * Confirma el restablecimiento de contraseña con el código verificado
   * @param email Correo electrónico del usuario
   * @param code Código de verificación
   * @param newPassword Nueva contraseña
   */
  async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    try {
      console.log('🔒 Restableciendo contraseña para:', email);

      // Verificar el código nuevamente
      const isValid = await this.verifyPasswordResetCode(email, code);

      if (!isValid) {
        throw { code: 'auth/invalid-action-code' };
      }

      const db = firebase.firestore();

      // Buscar el usuario
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw { code: 'auth/user-not-found' };
      }

      const userId = usersSnapshot.docs[0].id;

      // Marcar el código como usado
      await db.collection('passwordResetCodes').doc(userId).update({
        used: true,
        usedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar la contraseña usando Firebase Admin via Cloud Function
      const updatePasswordFunction = firebase.functions().httpsCallable('updateUserPassword');

      try {
        const result = await updatePasswordFunction({
          userId: userId,
          newPassword: newPassword
        });

        if (result.data?.success) {
          console.log('✅ Contraseña actualizada exitosamente');

          // Enviar email de confirmación
          await db.collection('mail').add({
            to: email,
            message: {
              subject: 'Contraseña Actualizada - FitNova',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>✅ Contraseña Actualizada</h1>
                      <p>FitNova</p>
                    </div>
                    <div class="content">
                      <div class="success">
                        <strong>Tu contraseña ha sido actualizada exitosamente</strong>
                      </div>
                      <p>Tu contraseña de FitNova ha sido cambiada correctamente el ${new Date().toLocaleString('es-ES')}.</p>
                      <p>Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.</p>
                      <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                    </div>
                    <div class="footer">
                      <p>Este es un correo automático, por favor no respondas.</p>
                      <p>&copy; ${new Date().getFullYear()} FitNova. Todos los derechos reservados.</p>
                    </div>
                  </div>
                </body>
                </html>
              `
            }
          });
        } else {
          throw new Error('No se pudo actualizar la contraseña');
        }
      } catch (error: any) {
        // Si la Cloud Function no existe, intentar con el método tradicional
        if (error.code === 'functions/not-found') {
          console.warn('⚠️ Cloud Function no encontrada, usando método alternativo');

          // Usar el método tradicional de Firebase (enviar email de reset)
          await this.afAuth.sendPasswordResetEmail(email);
          throw new Error('Por favor, utiliza el enlace enviado a tu correo para restablecer tu contraseña');
        }
        throw error;
      }

      console.log('✅ Proceso de restablecimiento completado');
    } catch (error: any) {
      console.error('❌ Error al restablecer contraseña:', error);
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

  async createUserAndAssignMembership(userData: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber?: string;
    gender?: string;
    role: 'user';
    assignedTrainer?: string;
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      console.log('👤💳 Creando usuario web y preparando asignación de membresía:', userData.email);
      
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
        phoneNumber: userData.phoneNumber,
        gender: userData.gender,
        assignedTrainer: currentUser.role === 'trainer' ? currentUser.uid : userData.assignedTrainer
      };
  
      console.log('📡 Llamando Cloud Function con datos:', {
        email: functionData.email,
        displayName: functionData.displayName,
        phoneNumber: functionData.phoneNumber,
        gender: functionData.gender,
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
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
  
      // ✅ PROCESAR RESPUESTA
      if (result?.data?.success) {
        const createdUserData = result.data.userData;
        const userId = createdUserData.uid;
        
        console.log('🎉 Usuario creado exitosamente. UID:', userId);
        
        // ✅ MOSTRAR MENSAJE DE ÉXITO
        await this.showSuccessMessage(`Usuario ${createdUserData.displayName} registrado exitosamente`);
        
        // ✅ RETORNAR DATOS PARA QUE EL COMPONENTE HAGA LA REDIRECCIÓN
        return {
          success: true,
          userId: userId
        };
        
      } else {
        throw new Error('La Cloud Function no retornó éxito');
      }
      
    } catch (error: any) {
      console.error('❌ Error completo al crear usuario:', error);
      
      let errorMessage = 'Error al crear el usuario';
      
      if (error.code) {
        switch (error.code) {
          case 'functions/unauthenticated':
            errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
            break;
          case 'functions/permission-denied':
            errorMessage = 'No tienes permisos para crear usuarios';
            break;
          case 'functions/invalid-argument':
            errorMessage = 'Datos del usuario inválidos';
            break;
          case 'functions/already-exists':
            errorMessage = 'Ya existe un usuario con este correo electrónico';
            break;
          case 'functions/internal':
            errorMessage = 'Error interno del servidor. Intenta nuevamente';
            break;
          case 'functions/deadline-exceeded':
          case 'functions/unavailable':
            errorMessage = 'Tiempo de espera agotado. Verifica tu conexión e intenta nuevamente';
            break;
          default:
            errorMessage = error.message || 'Error desconocido al crear el usuario';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      await this.showErrorMessage(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // 🔐 MÉTODOS DE REGISTRO DE ADMINISTRADORES

  /**
   * Verifica si el registro de administradores está disponible (máximo 2)
   * @returns Objeto con información de disponibilidad
   */
  async checkAdminRegistrationAvailable(): Promise<{ canRegister: boolean; currentAdmins: number; maxAdmins: number }> {
    try {
      console.log('🔍 Verificando disponibilidad de registro de administradores...');

      const checkFunction = this.fns.httpsCallable('checkAdminRegistrationAvailable');
      const result = await checkFunction({}).toPromise();

      if (result) {
        console.log('✅ Estado de registro de admins:', result);
        return {
          canRegister: result.canRegister,
          currentAdmins: result.currentAdmins,
          maxAdmins: 2
        };
      }

      throw new Error('No se pudo verificar la disponibilidad');
    } catch (error: any) {
      console.error('❌ Error verificando disponibilidad de registro:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo administrador (máximo 2 en total)
   * @param adminData Datos del administrador a registrar
   */
  async registerInitialAdmin(adminData: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ success: boolean; adminNumber?: number }> {
    try {
      console.log('👤 Registrando nuevo administrador:', adminData.email);

      const registerFunction = this.fns.httpsCallable('registerInitialAdmin');
      const result = await registerFunction({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.displayName
      }).toPromise();

      if (result?.success) {
        console.log('✅ Administrador registrado exitosamente:', result);
        await this.showSuccessMessage(`Administrador ${adminData.displayName} registrado exitosamente`);

        return {
          success: true,
          adminNumber: result.adminNumber
        };
      }

      throw new Error('No se pudo registrar el administrador');
    } catch (error: any) {
      console.error('❌ Error registrando administrador:', error);

      let errorMessage = 'Error al registrar el administrador';

      if (error.code) {
        switch (error.code) {
          case 'functions/already-exists':
            errorMessage = 'Ya existe una cuenta con este correo electrónico';
            break;
          case 'functions/permission-denied':
            errorMessage = 'Ya se alcanzó el límite máximo de 2 administradores';
            break;
          case 'functions/invalid-argument':
            errorMessage = error.message || 'Datos inválidos';
            break;
          case 'functions/internal':
            errorMessage = 'Error interno del servidor. Intenta nuevamente';
            break;
          default:
            errorMessage = error.message || 'Error desconocido';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      await this.showErrorMessage(errorMessage);

      return {
        success: false
      };
    }
  }

  /**
   * Verifica el email de un administrador usando el código enviado
   * @param email Email del usuario administrador
   * @param code Código de verificación de 6 dígitos
   */
  async verifyAdminEmail(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📧 Verificando email de administrador:', email);

      // Primero buscar el userId por email
      const db = firebase.firestore();
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .where('role', '==', 'admin')
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('Usuario administrador no encontrado');
      }

      const userId = usersSnapshot.docs[0].id;
      console.log('✅ Usuario encontrado:', userId);

      const verifyFunction = this.fns.httpsCallable('verifyAdminEmail');
      const result = await verifyFunction({
        userId: userId,
        code: code
      }).toPromise();

      if (result?.success) {
        console.log('✅ Email de administrador verificado:', result);
        await this.showSuccessMessage(result.message || 'Email verificado exitosamente');

        return {
          success: true,
          message: result.message
        };
      }

      throw new Error('No se pudo verificar el email');
    } catch (error: any) {
      console.error('❌ Error verificando email de administrador:', error);

      let errorMessage = 'Error al verificar el email';

      if (error.code) {
        switch (error.code) {
          case 'functions/not-found':
            errorMessage = 'Código de verificación no encontrado';
            break;
          case 'functions/failed-precondition':
            errorMessage = error.message || 'El código ha expirado o ya fue usado';
            break;
          case 'functions/invalid-argument':
            errorMessage = 'Código de verificación incorrecto';
            break;
          default:
            errorMessage = error.message || 'Error al verificar el email';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      await this.showErrorMessage(errorMessage);

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // ================================================================================
  // 🏋️ MÉTODOS PARA ENTRENADORES (TRAINERS)
  // ================================================================================

  /**
   * Registra un nuevo entrenador (solo administradores)
   * @param trainerData Datos del entrenador a registrar
   */
  async registerTrainer(trainerData: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber: string;
    gender: string;
    specialization?: string;
    certifications?: string;
    experience?: number;
    availability?: string;
  }): Promise<{ success: boolean; userId?: string; message?: string }> {
    try {
      console.log('👤 Registrando nuevo entrenador:', trainerData.email);

      const registerFunction = this.fns.httpsCallable('registerTrainer');
      const result = await registerFunction({
        email: trainerData.email,
        password: trainerData.password,
        displayName: trainerData.displayName,
        phoneNumber: trainerData.phoneNumber,
        gender: trainerData.gender,
        specialization: trainerData.specialization || null,
        certifications: trainerData.certifications || null,
        experience: trainerData.experience || null,
        availability: trainerData.availability || null
      }).toPromise();

      if (result?.success) {
        console.log('✅ Entrenador registrado exitosamente:', result);
        await this.showSuccessMessage(`Entrenador ${trainerData.displayName} registrado exitosamente`);

        return {
          success: true,
          userId: result.userId,
          message: result.message
        };
      }

      throw new Error('No se pudo registrar el entrenador');
    } catch (error: any) {
      console.error('❌ Error registrando entrenador:', error);

      let errorMessage = 'Error al registrar el entrenador';

      if (error.code) {
        switch (error.code) {
          case 'functions/already-exists':
            errorMessage = 'Ya existe una cuenta con este correo electrónico';
            break;
          case 'functions/permission-denied':
            errorMessage = 'No tienes permisos para registrar entrenadores';
            break;
          case 'functions/invalid-argument':
            errorMessage = error.message || 'Datos inválidos';
            break;
          case 'functions/unauthenticated':
            errorMessage = 'Debes iniciar sesión como administrador';
            break;
          case 'functions/internal':
            errorMessage = 'Error interno del servidor. Intenta nuevamente';
            break;
          default:
            errorMessage = error.message || 'Error desconocido';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      await this.showErrorMessage(errorMessage);

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Verifica el email de un entrenador usando el código enviado
   * @param email Email del entrenador
   * @param code Código de verificación de 6 dígitos
   */
  async verifyTrainerEmail(email: string, code: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📧 Verificando email de entrenador:', email);

      // Primero buscar el userId por email
      const db = firebase.firestore();
      const usersSnapshot = await db.collection('users')
        .where('email', '==', email)
        .where('role', '==', 'trainer')
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('Usuario entrenador no encontrado');
      }

      const userId = usersSnapshot.docs[0].id;
      console.log('✅ Usuario encontrado:', userId);

      const verifyFunction = this.fns.httpsCallable('verifyTrainerEmail');
      const result = await verifyFunction({
        userId: userId,
        code: code
      }).toPromise();

      if (result?.success) {
        console.log('✅ Email de entrenador verificado:', result);
        await this.showSuccessMessage(result.message || 'Email verificado exitosamente');

        return {
          success: true,
          message: result.message
        };
      }

      throw new Error('No se pudo verificar el email');
    } catch (error: any) {
      console.error('❌ Error verificando email de entrenador:', error);

      let errorMessage = 'Error al verificar el email';

      if (error.code) {
        switch (error.code) {
          case 'functions/not-found':
            errorMessage = 'Código de verificación no encontrado';
            break;
          case 'functions/failed-precondition':
            errorMessage = error.message || 'El código ha expirado o ya fue usado';
            break;
          case 'functions/invalid-argument':
            errorMessage = 'Código de verificación incorrecto';
            break;
          default:
            errorMessage = error.message || 'Error al verificar el email';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      await this.showErrorMessage(errorMessage);

      return {
        success: false,
        message: errorMessage
      };
    }
  }
}