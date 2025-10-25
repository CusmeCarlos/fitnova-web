// functions/index.js
// 🚀 CLOUD FUNCTIONS FITNOVA - CON EMAIL DE VERIFICACIÓN Y SINCRONIZACIÓN

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
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

// 🔐 FUNCIÓN: VERIFICAR SI SE PUEDEN REGISTRAR MÁS ADMINS
// Limita el registro de administradores a solo 2
exports.checkAdminRegistrationAvailable = onCall(async (request) => {
  try {
    console.log('🔍 Verificando disponibilidad de registro de admin');

    // Contar cuántos admins ACTIVOS hay actualmente
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .where('isActive', '==', true)
      .get();

    const adminCount = adminsSnapshot.size;
    const maxAdmins = 2;
    const availableSlots = maxAdmins - adminCount;

    console.log(`📊 Administradores activos encontrados: ${adminCount}/${maxAdmins}`);

    // Log detallado de cada admin encontrado
    adminsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - Admin: ${data.email} (isActive: ${data.isActive}, role: ${data.role})`);
    });

    return {
      success: true,
      canRegister: adminCount < maxAdmins,
      currentAdmins: adminCount,
      maxAdmins: maxAdmins,
      availableSlots: availableSlots,
      message: adminCount < maxAdmins
        ? `Puedes registrar ${availableSlots} administrador(es) más`
        : 'Límite de administradores alcanzado'
    };

  } catch (error) {
    console.error('❌ Error al verificar disponibilidad de admin:', error);
    throw new HttpsError('internal', 'Error al verificar disponibilidad: ' + error.message);
  }
});

// 🔐 FUNCIÓN: REGISTRAR ADMINISTRADOR INICIAL
// Solo permite registrar hasta 2 administradores
exports.registerInitialAdmin = onCall(async (request) => {
  try {
    console.log('👤 Iniciando registro de administrador inicial');

    const { email, password, displayName } = request.data;

    // Validar datos
    if (!email || !password || !displayName) {
      throw new HttpsError('invalid-argument', 'Email, contraseña y nombre son requeridos');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError('invalid-argument', 'Formato de email inválido');
    }

    // Validar contraseña
    if (password.length < 8) {
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 8 caracteres');
    }

    // Verificar que no se haya alcanzado el límite de admins
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .where('isActive', '==', true)
      .get();

    const adminCount = adminsSnapshot.size;
    const maxAdmins = 2;

    if (adminCount >= maxAdmins) {
      throw new HttpsError(
        'failed-precondition',
        `Límite de administradores alcanzado (${maxAdmins}/${maxAdmins}). No se pueden registrar más administradores.`
      );
    }

    console.log(`✅ Registro permitido: ${adminCount}/${maxAdmins} admins`);

    // Crear usuario en Firebase Auth (sin verificar)
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false // Requiere verificación por código
    });

    console.log('✅ Usuario creado en Firebase Auth:', userRecord.uid);

    // Generar código de verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('📧 Código de verificación generado');

    // Guardar código de verificación en Firestore
    await db.collection('emailVerificationCodes').doc(userRecord.uid).set({
      email: email,
      code: verificationCode,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 minutos
      used: false,
      type: 'admin_registration'
    });

    console.log('✅ Código de verificación guardado');

    // Crear documento del administrador en Firestore
    await db.doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'admin',
      status: 'pending_verification', // Pendiente de verificación
      isActive: false, // Se activará al verificar
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
      emailVerified: false,
      isInitialAdmin: true,
      adminNumber: adminCount + 1, // 1 o 2
      createdBy: 'system',
      profileImageUrl: null
    });

    console.log('✅ Administrador registrado en Firestore');

    // Enviar email con código de verificación
    await db.collection('mail').add({
      to: email,
      message: {
        subject: 'Verificación de Cuenta de Administrador - FitNova',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { background: white; border: 2px dashed #3b82f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #3b82f6; }
              .admin-badge { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 12px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-weight: bold; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🛡️ Verificación de Administrador</h1>
                <p>FitNova</p>
              </div>
              <div class="content">
                <div class="admin-badge">
                  👤 ADMINISTRADOR ${adminCount + 1}/2
                </div>
                <p>Hola <strong>${displayName}</strong>,</p>
                <p>¡Bienvenido al equipo de administradores de FitNova!</p>
                <p>Para completar tu registro como administrador, por favor verifica tu correo electrónico ingresando el siguiente código:</p>
                <div class="code">${verificationCode}</div>
                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul>
                    <li>Este código expira en <strong>10 minutos</strong></li>
                    <li>Solo puedes usarlo una vez</li>
                    <li>Es necesario para activar tu cuenta de administrador</li>
                    <li>Si no solicitaste este registro, ignora este correo</li>
                  </ul>
                </div>
                <p><strong>Privilegios de Administrador:</strong></p>
                <ul>
                  <li>✅ Acceso completo al dashboard web</li>
                  <li>✅ Gestión de entrenadores y usuarios</li>
                  <li>✅ Configuración del sistema</li>
                  <li>✅ Administración de equipamiento y membresías</li>
                </ul>
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

    console.log('📧 Email de verificación enviado');

    // Crear perfil básico
    await db.doc(`profiles/${userRecord.uid}`).set({
      userId: userRecord.uid,
      personalInfo: {
        displayName: displayName,
        email: email
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Registrar en auditoría
    await db.collection('auditLogs').add({
      userId: userRecord.uid,
      action: 'ADMIN_REGISTRATION',
      adminNumber: adminCount + 1,
      timestamp: FieldValue.serverTimestamp(),
      method: 'initial_setup',
      details: `Administrador ${adminCount + 1} de ${maxAdmins} registrado`
    });

    console.log(`🎉 Administrador ${adminCount + 1}/${maxAdmins} registrado exitosamente`);

    return {
      success: true,
      userId: userRecord.uid,
      adminNumber: adminCount + 1,
      message: `Administrador ${adminCount + 1} de ${maxAdmins} registrado exitosamente. Verifica tu correo.`,
      remainingSlots: maxAdmins - (adminCount + 1),
      requiresVerification: true
    };

  } catch (error) {
    console.error('❌ Error al registrar administrador:', error);

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

// 🔐 FUNCIÓN: VERIFICAR EMAIL DE ADMINISTRADOR
// Verifica el código de email para administradores y activa la cuenta
exports.verifyAdminEmail = onCall(async (request) => {
  try {
    console.log('📧 Verificando email de administrador');

    const { userId, code } = request.data;

    // Validar datos
    if (!userId || !code) {
      throw new HttpsError('invalid-argument', 'UserID y código son requeridos');
    }

    // Obtener el código de verificación de Firestore
    const codeDoc = await db.collection('emailVerificationCodes').doc(userId).get();

    if (!codeDoc.exists) {
      throw new HttpsError('not-found', 'Código de verificación no encontrado');
    }

    const codeData = codeDoc.data();

    // Verificar que el código no haya sido usado
    if (codeData.used) {
      throw new HttpsError('failed-precondition', 'Este código ya ha sido utilizado');
    }

    // Verificar que el código no haya expirado
    const expiresAt = codeData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      throw new HttpsError('failed-precondition', 'El código ha expirado. Solicita uno nuevo.');
    }

    // Verificar que el código coincida
    if (codeData.code !== code) {
      throw new HttpsError('invalid-argument', 'Código de verificación incorrecto');
    }

    console.log('✅ Código verificado correctamente');

    // Actualizar el usuario en Firebase Auth
    await auth.updateUser(userId, {
      emailVerified: true
    });

    console.log('✅ Usuario verificado en Firebase Auth');

    // Actualizar el documento del usuario en Firestore
    await db.doc(`users/${userId}`).update({
      emailVerified: true,
      status: 'active',
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      verifiedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Usuario activado en Firestore');

    // Marcar el código como usado
    await db.collection('emailVerificationCodes').doc(userId).update({
      used: true,
      usedAt: FieldValue.serverTimestamp()
    });

    // Obtener datos del usuario
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    // Registrar en auditoría
    await db.collection('auditLogs').add({
      userId: userId,
      action: 'ADMIN_EMAIL_VERIFIED',
      adminNumber: userData.adminNumber,
      timestamp: FieldValue.serverTimestamp(),
      method: 'email_verification',
      details: `Administrador ${userData.adminNumber} verificó su email`
    });

    // Enviar email de bienvenida
    await db.collection('mail').add({
      to: userData.email,
      message: {
        subject: '✅ Cuenta de Administrador Activada - FitNova',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
              .admin-badge { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 12px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-weight: bold; }
              .button { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Cuenta Activada!</h1>
                <p>FitNova</p>
              </div>
              <div class="content">
                <div class="admin-badge">
                  🛡️ ADMINISTRADOR ${userData.adminNumber}/2
                </div>
                <div class="success">
                  <strong>✅ Tu cuenta de administrador ha sido verificada exitosamente</strong>
                </div>
                <p>Hola <strong>${userData.displayName}</strong>,</p>
                <p>¡Bienvenido oficialmente al equipo de administradores de FitNova!</p>
                <p>Tu cuenta ha sido activada y ahora tienes acceso completo al dashboard administrativo.</p>

                <h3>🔑 Tus credenciales de acceso:</h3>
                <ul>
                  <li><strong>Email:</strong> ${userData.email}</li>
                  <li><strong>Rol:</strong> Administrador</li>
                  <li><strong>Estado:</strong> Activo</li>
                </ul>

                <h3>📊 Acceso al Dashboard:</h3>
                <p>Ya puedes iniciar sesión en el dashboard administrativo de FitNova:</p>
                <a href="https://fitnova-web.web.app/auth/login" class="button">
                  Iniciar Sesión en Dashboard
                </a>

                <h3>🛡️ Privilegios de Administrador:</h3>
                <ul>
                  <li>✅ Gestión completa de usuarios y entrenadores</li>
                  <li>✅ Administración de equipamiento y membresías</li>
                  <li>✅ Configuración del sistema</li>
                  <li>✅ Acceso a estadísticas y reportes</li>
                  <li>✅ Control de alertas y notificaciones</li>
                </ul>

                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
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

    console.log('🎉 Administrador verificado y activado exitosamente');

    return {
      success: true,
      message: 'Email verificado exitosamente. Tu cuenta de administrador está activa.',
      userData: {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        adminNumber: userData.adminNumber
      }
    };

  } catch (error) {
    console.error('❌ Error al verificar email de administrador:', error);

    if (error instanceof HttpsError) throw error;

    throw new HttpsError('internal', error.message || 'Error al verificar email');
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

// ================================================================================
// 🏋️ FUNCIONES PARA ENTRENADORES (TRAINERS)
// ================================================================================

// 🔐 FUNCIÓN: REGISTRAR ENTRENADOR
// Los administradores pueden registrar nuevos entrenadores
exports.registerTrainer = onCall(async (request) => {
  try {
    console.log('👤 Iniciando registro de entrenador');

    // Verificar que el usuario esté autenticado y sea admin
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const callerUid = request.auth.uid;
    const callerDoc = await db.doc(`users/${callerUid}`).get();

    if (!callerDoc.exists) {
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    const callerData = callerDoc.data();
    if (callerData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Solo los administradores pueden registrar entrenadores');
    }

    const {
      email,
      password,
      displayName,
      phoneNumber,
      gender,
      specialization,
      certifications,
      experience,
      availability
    } = request.data;

    // Validar datos requeridos
    if (!email || !password || !displayName || !phoneNumber || !gender) {
      throw new HttpsError('invalid-argument', 'Email, contraseña, nombre, teléfono y género son requeridos');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError('invalid-argument', 'Formato de email inválido');
    }

    // Validar contraseña
    if (password.length < 6) {
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres');
    }

    // Validar teléfono (requerido)
    if (!/^[0-9]{10}$/.test(phoneNumber)) {
      throw new HttpsError('invalid-argument', 'El teléfono debe tener exactamente 10 dígitos');
    }

    // Validar género (requerido)
    const validGenders = ['male', 'female', 'other', 'prefer-not-to-say'];
    if (!validGenders.includes(gender)) {
      throw new HttpsError('invalid-argument', 'Género no válido');
    }

    console.log(`✅ Registro iniciado por admin: ${callerData.displayName}`);

    // Crear usuario en Firebase Auth (sin verificar)
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false // Requiere verificación por código
    });

    console.log('✅ Usuario creado en Firebase Auth:', userRecord.uid);

    // 🔧 CONFIGURACIÓN - Firebase maneja la verificación automáticamente
    const actionCodeSettings = {
      url: 'https://fitnova-app.web.app/email-verified',
      handleCodeInApp: false
    };

    const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
    console.log('🔗 Link de verificación generado:', verificationLink);

    // Enviar email con link de verificación
    await db.collection('mail').add({
      to: email,
      from: 'FitNova <noreplyfitnovaapp@gmail.com>',
      replyTo: 'noreplyfitnovaapp@gmail.com',
      message: {
        subject: '🏋️ Verifica tu cuenta de Entrenador - FitNova',
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
              <!-- Header con tema verde para entrenador -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🏋️ FitNova</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Cuenta de Entrenador</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                  ¡Hola ${displayName}! 💪
                </h2>

                <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Has sido registrado como <strong>Entrenador</strong> en FitNova por el administrador <strong>${callerData.displayName}</strong>.
                </p>

                <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                  Para activar tu cuenta y comenzar a gestionar tus clientes, necesitas verificar tu dirección de correo electrónico.
                </p>

                <!-- Botón de verificación -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${verificationLink}"
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;">
                    ✅ Verificar Mi Cuenta
                  </a>
                </div>

                <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 30px 0;">
                  <p style="margin: 0 0 15px 0; color: #333; font-weight: 600;">📋 Información de tu cuenta:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #666;">
                    <li style="margin: 8px 0;"><strong>Email:</strong> ${email}</li>
                    <li style="margin: 8px 0;"><strong>Rol:</strong> Entrenador</li>
                    <li style="margin: 8px 0;"><strong>Especialización:</strong> ${specialization || 'General'}</li>
                    <li style="margin: 8px 0;"><strong>Registrado por:</strong> ${callerData.displayName}</li>
                  </ul>
                </div>

                <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                  Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                  <a href="${verificationLink}" style="color: #10b981; word-break: break-all;">${verificationLink}</a>
                </p>

                <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                  Si no solicitaste esta cuenta, puedes ignorar este mensaje de forma segura.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  Este es un correo automático, por favor no respondas.
                </p>
                <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} FitNova. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      }
    });

    console.log('📧 Email de verificación enviado');

    // Crear documento del entrenador en Firestore (pendiente de verificación)
    await db.doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      phoneNumber: phoneNumber,
      gender: gender,
      specialization: specialization || null,
      role: 'trainer',
      status: 'pending', // Pendiente hasta verificar email
      isActive: false, // No activo hasta verificar
      emailVerified: false,
      createdBy: callerData.displayName,
      createdByUid: callerUid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      profileImageUrl: null,
      // Stats iniciales para entrenadores
      stats: {
        totalClients: 0,
        activeClients: 0,
        totalWorkouts: 0,
        totalSessions: 0
      }
    });

    // Crear perfil del entrenador
    await db.doc(`profiles/${userRecord.uid}`).set({
      userId: userRecord.uid,
      personalInfo: {
        displayName: displayName,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender
      },
      professionalInfo: {
        specialization: specialization || null,
        certifications: certifications || null,
        experience: experience || null,
        availability: availability || null,
        bio: null
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Registrar en auditoría
    await db.collection('auditLogs').add({
      userId: userRecord.uid,
      action: 'TRAINER_REGISTRATION',
      performedBy: callerUid,
      performedByName: callerData.displayName,
      timestamp: FieldValue.serverTimestamp(),
      details: `Entrenador ${displayName} registrado por ${callerData.displayName}`
    });

    console.log(`🎉 Entrenador registrado exitosamente: ${displayName}`);

    return {
      success: true,
      userId: userRecord.uid,
      message: `Entrenador registrado exitosamente. Se envió un link de verificación a ${email}`,
      requiresVerification: true,
      trainerData: {
        uid: userRecord.uid,
        email: email,
        displayName: displayName,
        role: 'trainer',
        status: 'pending'
      }
    };

  } catch (error) {
    console.error('❌ Error al registrar entrenador:', error);

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

// 🔐 FUNCIÓN: VERIFICAR EMAIL DE ENTRENADOR
// Verifica el código de email para entrenadores y activa la cuenta
exports.verifyTrainerEmail = onCall(async (request) => {
  try {
    console.log('📧 Verificando email de entrenador');

    const { userId, code } = request.data;

    // Validar datos
    if (!userId || !code) {
      throw new HttpsError('invalid-argument', 'UserID y código son requeridos');
    }

    // Obtener el código de verificación de Firestore
    const codeDoc = await db.collection('emailVerificationCodes').doc(userId).get();

    if (!codeDoc.exists) {
      throw new HttpsError('not-found', 'Código de verificación no encontrado');
    }

    const codeData = codeDoc.data();

    // Verificar que el código no haya sido usado
    if (codeData.used) {
      throw new HttpsError('failed-precondition', 'Este código ya ha sido utilizado');
    }

    // Verificar que el código no haya expirado
    const expiresAt = codeData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      throw new HttpsError('failed-precondition', 'El código ha expirado. Solicita uno nuevo.');
    }

    // Verificar que el código coincida
    if (codeData.code !== code) {
      throw new HttpsError('invalid-argument', 'Código de verificación incorrecto');
    }

    console.log('✅ Código verificado correctamente');

    // Actualizar el usuario en Firebase Auth
    await auth.updateUser(userId, {
      emailVerified: true
    });

    // Obtener datos del usuario
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    // Actualizar el documento del usuario en Firestore
    await db.doc(`users/${userId}`).update({
      emailVerified: true,
      status: 'active',
      isActive: true,
      verifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Marcar el código como usado
    await db.collection('emailVerificationCodes').doc(userId).update({
      used: true,
      usedAt: FieldValue.serverTimestamp()
    });

    console.log('✅ Entrenador verificado en Auth y Firestore');

    // Enviar email de confirmación
    await db.collection('mail').add({
      to: userData.email,
      from: 'FitNova <noreplyfitnovaapp@gmail.com>',
      replyTo: 'noreplyfitnovaapp@gmail.com',
      message: {
        subject: '✅ Cuenta de Entrenador Activada - FitNova',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
              .button { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Cuenta Activada!</h1>
                <p>FitNova - Panel de Entrenadores</p>
              </div>
              <div class="content">
                <div class="success">
                  <strong>✅ Tu cuenta de entrenador ha sido verificada exitosamente</strong>
                </div>
                <p>Hola <strong>${userData.displayName}</strong>,</p>
                <p>¡Bienvenido oficialmente al equipo de entrenadores de FitNova!</p>
                <p>Tu cuenta ha sido activada y ahora tienes acceso completo al dashboard de entrenadores.</p>

                <h3>🔑 Tus credenciales de acceso:</h3>
                <ul>
                  <li><strong>Email:</strong> ${userData.email}</li>
                  <li><strong>Rol:</strong> Entrenador</li>
                  <li><strong>Especialización:</strong> ${userData.specialization || 'General'}</li>
                  <li><strong>Estado:</strong> Activo</li>
                </ul>

                <h3>📊 Acceso al Dashboard:</h3>
                <p>Ya puedes iniciar sesión en el dashboard de entrenadores de FitNova:</p>
                <a href="https://fitnova-web.web.app/auth/login" class="button">
                  Iniciar Sesión
                </a>

                <h3>🏋️ Como Entrenador puedes:</h3>
                <ul>
                  <li>✅ Gestionar tus clientes asignados</li>
                  <li>✅ Crear y asignar rutinas personalizadas</li>
                  <li>✅ Monitorear el progreso de tus clientes</li>
                  <li>✅ Ver análisis biomecánicos de ejercicios</li>
                  <li>✅ Recibir alertas de rendimiento</li>
                </ul>

                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador.</p>
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

    console.log('🎉 Entrenador verificado y activado exitosamente');

    return {
      success: true,
      message: 'Email verificado exitosamente. Tu cuenta de entrenador está activa.',
      userData: {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        specialization: userData.specialization
      }
    };

  } catch (error) {
    console.error('❌ Error al verificar email de entrenador:', error);

    if (error instanceof HttpsError) throw error;

    throw new HttpsError('internal', error.message || 'Error al verificar email');
  }
});

