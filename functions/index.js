// functions/index.js
// 🚀 CLOUD FUNCTIONS FITNOVA - CON EMAIL DE VERIFICACIÓN Y SINCRONIZACIÓN

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');

// Configurar región
setGlobalOptions({ region: 'us-central1' });

// Inicializar Firebase Admin
initializeApp();
const auth = getAuth();
const db = getFirestore();

// 🚀 FUNCIÓN: CREAR USUARIO MÓVIL CON EMAIL DE VERIFICACIÓN
exports.createMobileUser = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const callerUid = request.auth.uid;
    const callerDoc = await db.doc(`users/${callerUid}`).get();
    
    if (!callerDoc.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    const callerData = callerDoc.data();
    const callerRole = callerData.role;

    if (!['trainer', 'admin'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Solo entrenadores y administradores pueden crear usuarios');
    }

    const { 
      email, 
      password, 
      displayName, 
      phoneNumber,
      gender,
      assignedTrainer 
    } = request.data;

    if (!email || !password || !displayName) {
      throw new HttpsError('invalid-argument', 'Email, contraseña y nombre son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError('invalid-argument', 'Formato de email inválido');
    }

    if (password.length < 6) {
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres');
    }

    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
      throw new HttpsError('invalid-argument', 'El teléfono debe tener exactamente 10 dígitos');
    }

    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    if (gender && !validGenders.includes(gender)) {
      throw new HttpsError('invalid-argument', 'Género no válido');
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    // 🔧 CONFIGURACIÓN - Firebase maneja la verificación
    const actionCodeSettings = {
      // URL donde llegará después de verificar
      url: 'https://fitnova-app.web.app/email-verified',
      // handleCodeInApp false = Firebase maneja la verificación automáticamente
      handleCodeInApp: false
    };

    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    console.log('🔗 Link de verificación generado:', verificationLink);

    // Crear documento en Firestore para enviar el email
    await db.collection('mail').add({
      to: email,
      from: 'FitNova <noreplyfitnovaapp@gmail.com>',
      replyTo: 'noreplyfitnovaapp@gmail.com',
      message: {
        subject: '💪 Verifica tu cuenta - FitNova',
        text: `Hola ${displayName}, por favor verifica tu correo visitando: ${verificationLink}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">💪 FitNova</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Tu viaje fitness comienza aquí</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                  ¡Hola ${displayName}! 👋
                </h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  ¡Bienvenido al equipo de GymShark! 🦈 Estamos emocionados de que te unas a la familia FitNova.
                </p>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Solo falta un paso para completar tu registro. Verifica tu email haciendo clic en el botón:
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${verificationLink}" 
                     style="display: inline-block; 
                            padding: 18px 40px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white; 
                            text-decoration: none; 
                            border-radius: 50px; 
                            font-size: 16px; 
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                            transition: all 0.3s ease;">
                    ✅ VERIFICAR MI CUENTA
                  </a>
                </div>
                
                <!-- Alternative Link -->
                <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 30px 0;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                    ¿Problemas con el botón? Usa este enlace:
                  </p>
                  <p style="color: #667eea; font-size: 13px; word-break: break-all; margin: 0;">
                    ${verificationLink}
                  </p>
                </div>
                
                <!-- What's Next -->
                <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 10px; padding: 25px; margin-top: 30px;">
                  <h3 style="color: #667eea; font-size: 18px; margin: 0 0 15px 0;">
                    📱 ¿Qué sigue después?
                  </h3>
                  <ol style="color: #666; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Verifica tu email haciendo clic en el botón</li>
                    <li>Descarga la app FitNova en tu móvil</li>
                    <li>Inicia sesión con tu email y contraseña</li>
                    <li>¡Comienza tu entrenamiento personalizado!</li>
                  </ol>
                </div>
                
                <!-- Footer Message -->
                <p style="color: #999; font-size: 13px; margin: 30px 0 0 0; text-align: center;">
                  Si no creaste esta cuenta, puedes ignorar este mensaje.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2025 FitNova - GymShark Team 🦈
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                Transformando vidas, un entrenamiento a la vez
              </p>
            </div>
          </body>
          </html>
        `
      },
      createdAt: FieldValue.serverTimestamp()
    });

    console.log('📧 Email de verificación enviado a:', email);
    
    // Obtener nombre del entrenador asignado
    let assignedTrainerName = 'Sin asignar';
    const assignedTrainerId = assignedTrainer || null;
    
    if (assignedTrainerId) {
      const trainerDoc = await db.doc(`users/${assignedTrainerId}`).get();
      if (trainerDoc.exists) {
        assignedTrainerName = trainerDoc.data().displayName || 'Entrenador';
      }
    }

    // Crear documento del usuario en Firestore
    await db.doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      phoneNumber: phoneNumber || null,
      gender: gender || null,
      role: 'user',
      status: 'active',
      assignedTrainer: assignedTrainerId,
      assignedTrainerName: assignedTrainerName,
      createdBy: callerData.displayName,
      createdByUid: callerUid,
      createdByRole: callerRole,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
      emailVerified: false,
      profileImageUrl: null,
      emailSent: true
    });

    // Crear perfil inicial
    await db.doc(`profiles/${userRecord.uid}`).set({
      userId: userRecord.uid,
      personalInfo: {
        age: null,
        gender: gender || null,
        weight: null,
        height: null,
        phoneNumber: phoneNumber || null,
        dateOfBirth: null,
        emergencyContact: { name: null, phone: null, relationship: null }
      },
      medicalHistory: { 
        chronicConditions: [], 
        injuries: [], 
        medications: [], 
        allergies: [], 
        surgeries: [], 
        doctorNotes: null 
      },
      currentConditions: { 
        hasChronicPain: false, 
        hasHeartCondition: false, 
        hasRespiratoryIssues: false, 
        hasJointProblems: false, 
        isPregnant: false, 
        otherConditions: [], 
        recentInjuries: [], 
        painLevel: null, 
        energyLevel: null 
      },
      fitnessGoals: { 
        primaryGoals: [], 
        targetWeight: null, 
        targetBodyFat: null, 
        preferredWorkoutTypes: [], 
        preferredWorkoutDuration: null, 
        preferredWorkoutFrequency: null, 
        specificGoals: [] 
      },
      fitnessLevel: { 
        overallLevel: 'beginner', 
        strengthTraining: null, 
        cardioTraining: null, 
        flexibilityTraining: null, 
        sportsExperience: null, 
        yearsOfTraining: null, 
        monthsOfTraining: null, 
        previousGymExperience: false 
      },
      trainingPreferences: { 
        availableDays: [], 
        preferredTimeSlots: [], 
        maxSessionDuration: null, 
        preferredEnvironment: [], 
        spaceConstraints: null, 
        preferredIntensity: null, 
        needsMotivation: false, 
        prefersGroupWorkouts: false, 
        feedbackPreferences: { 
          audioFeedback: true, 
          visualFeedback: true, 
          hapticFeedback: false, 
          realTimeCorrections: true, 
          postWorkoutAnalysis: true 
        } 
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Crear estadísticas iniciales
    await db.doc(`userStats/${userRecord.uid}`).set({
      userId: userRecord.uid,
      totalWorkouts: 0,
      totalExercises: 0,
      totalRepetitions: 0,
      totalErrors: 0,
      criticalErrors: 0,
      totalMinutes: 0,
      lastWorkoutDate: null,
      streak: 0,
      achievements: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      userId: userRecord.uid,
      emailVerificationSent: true,
      userData: {
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        phoneNumber: phoneNumber || null,
        gender: gender || null,
        assignedTrainer: assignedTrainerId,
        assignedTrainerName: assignedTrainerName,
        createdBy: callerData.displayName,
        emailVerified: false
      }
    };

  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    
    if (error instanceof HttpsError) throw error;

    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-exists':
          throw new HttpsError('already-exists', 'Ya existe una cuenta con este email');
        case 'auth/invalid-email':
          throw new HttpsError('invalid-argument', 'Formato de email inválido');
        case 'auth/weak-password':
          throw new HttpsError('invalid-argument', 'La contraseña es muy débil');
        default:
          throw new HttpsError('internal', `Error: ${error.message}`);
      }
    }

    throw new HttpsError('internal', error.message);
  }
});

// 🔥 TRIGGER: SINCRONIZAR EMAIL CUANDO SE ACTUALIZA lastActiveAt
// Se ejecuta automáticamente cuando el usuario hace login
exports.syncEmailOnLogin = onDocumentWritten('users/{userId}', async (event) => {
  try {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Solo procesar si se actualizó lastActiveAt (indicador de login)
    const beforeActiveAt = beforeData?.lastActiveAt?.toMillis() || 0;
    const afterActiveAt = afterData?.lastActiveAt?.toMillis() || 0;

    if (afterActiveAt <= beforeActiveAt) {
      // No hubo actualización de lastActiveAt, ignorar
      return null;
    }

    const uid = event.params.userId;
    console.log(`🔍 Login detectado para usuario: ${uid}`);

    // Obtener el estado real de emailVerified desde Auth
    const userRecord = await auth.getUser(uid);

    // Si el email está verificado en Auth pero no en Firestore, sincronizar
    if (userRecord.emailVerified && !afterData?.emailVerified) {
      await db.doc(`users/${uid}`).update({
        emailVerified: true,
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`✅ emailVerified sincronizado automáticamente para: ${uid}`);
    }

    return null;
  } catch (error) {
    console.error('❌ Error en syncEmailOnLogin:', error);
    return null;
  }
});

// 🔥 FUNCIÓN CALLABLE: SINCRONIZAR ESTADO DE EMAIL MANUALMENTE
// Se puede llamar desde la app para forzar la sincronización
exports.checkEmailVerification = onCall(async (request) => {
  try {
    // Obtener UID del parámetro o del usuario autenticado
    let uid = request.data?.uid;

    if (!uid && request.auth) {
      uid = request.auth.uid;
    }

    if (!uid) {
      throw new HttpsError('invalid-argument', 'UID de usuario requerido');
    }

    console.log(`🔍 Verificando email para UID: ${uid}`);

    // Obtener datos de Firebase Auth (la fuente de verdad)
    const userRecord = await auth.getUser(uid);

    // Solo actualizar si el email está verificado en Auth
    if (userRecord.emailVerified) {
      // Actualizar Firestore con el estado real de Auth
      await db.doc(`users/${uid}`).update({
        emailVerified: true,
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`✅ Email verificado y sincronizado en Firestore para: ${uid}`);

      return {
        success: true,
        emailVerified: true,
        message: 'Email verificado exitosamente'
      };
    } else {
      console.log(`⏳ Email aún no verificado en Auth para: ${uid}`);

      return {
        success: false,
        emailVerified: false,
        message: 'Email aún no verificado'
      };
    }

  } catch (error) {
    console.error('❌ Error al verificar email:', error);

    if (error instanceof HttpsError) throw error;

    // Manejar error de usuario no encontrado
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    throw new HttpsError('internal', error.message);
  }
});

// 🔐 FUNCIÓN: ACTUALIZAR CONTRASEÑA DE USUARIO
// Para sistema de recuperación de contraseña
exports.updateUserPassword = onCall(async (request) => {
  try {
    console.log('🔒 Iniciando actualización de contraseña');

    const { userId, newPassword } = request.data;

    // Validar datos de entrada
    if (!userId || !newPassword) {
      throw new HttpsError('invalid-argument', 'userId y newPassword son requeridos');
    }

    // Validar que la contraseña tenga al menos 8 caracteres
    if (newPassword.length < 8) {
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 8 caracteres');
    }

    // Validar requisitos de seguridad de la contraseña
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new HttpsError(
        'invalid-argument',
        'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'
      );
    }

    console.log('✅ Validación de contraseña exitosa');

    // Actualizar la contraseña del usuario en Firebase Auth
    await auth.updateUser(userId, {
      password: newPassword
    });

    console.log('✅ Contraseña actualizada en Firebase Auth');

    // Registrar el cambio de contraseña en Firestore
    await db.doc(`users/${userId}`).update({
      passwordChangedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Registro de cambio de contraseña guardado en Firestore');

    // Registrar en auditoría
    await db.collection('auditLogs').add({
      userId: userId,
      action: 'PASSWORD_RESET',
      timestamp: FieldValue.serverTimestamp(),
      method: 'verification_code',
      ipAddress: request.rawRequest?.ip || 'unknown',
      userAgent: request.rawRequest?.headers['user-agent'] || 'unknown'
    });

    console.log('✅ Registro de auditoría creado');

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };

  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error);

    // Si es un error de Firebase Admin
    if (error.code) {
      if (error.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'Usuario no encontrado');
      }
      if (error.code === 'auth/invalid-password') {
        throw new HttpsError('invalid-argument', 'La contraseña no cumple con los requisitos de Firebase');
      }
    }

    // Si ya es un HttpsError, re-lanzarlo
    if (error instanceof HttpsError) {
      throw error;
    }

    // Error genérico
    throw new HttpsError('internal', 'Error al actualizar la contraseña: ' + error.message);
  }
});

