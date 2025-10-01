// functions/index.js
// 🚀 CLOUD FUNCTIONS FITNOVA - CREAR USUARIOS SIN AFECTAR CONTEXTO

const { onCall, HttpsError } = require('firebase-functions/v2/https');
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

// 🚀 FUNCIÓN: CREAR USUARIO MÓVIL
exports.createMobileUser = onCall(async (request) => {
  try {
    console.log('🔥 Cloud Function - createMobileUser iniciada');
    console.log('📝 Datos recibidos:', request.data);

    // ✅ VERIFICAR AUTENTICACIÓN
    if (!request.auth) {
      console.error('❌ Usuario no autenticado');
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    // ✅ OBTENER DATOS DEL USUARIO QUE LLAMA LA FUNCIÓN
    const callerUid = request.auth.uid;
    const callerDoc = await db.doc(`users/${callerUid}`).get();
    
    if (!callerDoc.exists) {
      console.error('❌ Usuario no encontrado en Firestore:', callerUid);
      throw new HttpsError('not-found', 'Usuario no encontrado');
    }

    const callerData = callerDoc.data();
    const callerRole = callerData.role;

    // ✅ VERIFICAR PERMISOS (solo trainer y admin)
    if (!['trainer', 'admin'].includes(callerRole)) {
      console.error('❌ Permisos insuficientes. Rol:', callerRole);
      throw new HttpsError(
        'permission-denied', 
        'Solo entrenadores y administradores pueden crear usuarios'
      );
    }

    console.log('✅ Permisos verificados. Caller:', callerData.displayName, 'Rol:', callerRole);

    // ✅ VALIDAR DATOS DE ENTRADA
    const { email, password, displayName, assignedTrainer } = request.data;

    if (!email || !password || !displayName) {
      console.error('❌ Datos requeridos faltantes');
      throw new HttpsError('invalid-argument', 'Email, contraseña y nombre son requeridos');
    }

    // ✅ VALIDAR FORMATO EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Formato de email inválido:', email);
      throw new HttpsError('invalid-argument', 'Formato de email inválido');
    }

    // ✅ VALIDAR LONGITUD CONTRASEÑA
    if (password.length < 6) {
      console.error('❌ Contraseña muy corta');
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres');
    }

    console.log('✅ Datos validados correctamente');

    // ✅ CREAR USUARIO EN FIREBASE AUTH
    console.log('🔐 Creando usuario en Firebase Auth...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    console.log('✅ Usuario creado en Auth. UID:', userRecord.uid);

    // ✅ OBTENER NOMBRE DEL ENTRENADOR ASIGNADO
    let assignedTrainerName = 'Sin asignar';
    const assignedTrainerId = assignedTrainer || null;
    
    if (assignedTrainerId) {
      try {
        const trainerDoc = await db.doc(`users/${assignedTrainerId}`).get();
        if (trainerDoc.exists) {
          assignedTrainerName = trainerDoc.data().displayName || 'Entrenador';
        }
      } catch (error) {
        console.warn('⚠️ No se pudo obtener nombre del entrenador:', error);
      }
    }

    // ✅ CREAR DOCUMENTO EN FIRESTORE
    console.log('📄 Creando documento en Firestore...');
    await db.doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'user',
      status: 'active',
      assignedTrainer: assignedTrainerId,
      assignedTrainerName: assignedTrainerName,
      createdBy: callerData.displayName,
      createdByUid: callerUid,
      createdByRole: callerRole,
      createdAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
      emailVerified: false,
      phoneNumber: null,
      profileImageUrl: null,
      age: null,
      gender: null,
      height: null,
      weight: null,
      fitnessGoals: [],
      medicalConditions: [],
      experience: 'beginner',
      preferences: {
        notifications: true,
        darkMode: false,
        language: 'es'
      }
    });

    console.log('✅ Documento creado en Firestore');

    // ✅ CREAR DOCUMENTO DE ESTADÍSTICAS INICIALES
    console.log('📊 Creando estadísticas iniciales...');
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

    console.log('✅ Estadísticas iniciales creadas');

    // ✅ RETORNAR RESPUESTA CON ÉXITO Y UID
    const response = {
      success: true,
      userData: {
        uid: userRecord.uid, // ✅ CORREGIDO: Usar userRecord.uid
        email: email,
        displayName: displayName,
        assignedTrainer: assignedTrainerId,
        assignedTrainerName: assignedTrainerName,
        createdBy: callerData.displayName
      }
    };

    console.log('🎉 Usuario creado exitosamente:', response);
    return response;

  } catch (error) {
    console.error('❌ Error en createMobileUser:', error);
    
    // ✅ MANEJO DE ERRORES ESPECÍFICOS
    if (error instanceof HttpsError) {
      throw error; // Re-lanzar errores HTTP específicos
    }
    
    // ✅ ERRORES DE FIREBASE AUTH
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-exists':
          throw new HttpsError('already-exists', 'Ya existe una cuenta con este email');
        case 'auth/invalid-email':
          throw new HttpsError('invalid-argument', 'Formato de email inválido');
        case 'auth/weak-password':
          throw new HttpsError('invalid-argument', 'La contraseña es muy débil');
        default:
          console.error('Error Firebase Auth no manejado:', error.code, error.message);
          throw new HttpsError('internal', `Error de Firebase Auth: ${error.message}`);
      }
    }
    
    // ✅ ERROR GENÉRICO
    throw new HttpsError('internal', `Error interno: ${error.message}`);
  }
});

// 🚀 FUNCIÓN: OBTENER ESTADÍSTICAS DE USUARIOS (bonus)
exports.getUserStats = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const userId = request.data.userId || request.auth.uid;
    const statsDoc = await db.doc(`userStats/${userId}`).get();
    
    if (!statsDoc.exists) {
      throw new HttpsError('not-found', 'Estadísticas no encontradas');
    }

    return {
      success: true,
      stats: statsDoc.data()
    };
  } catch (error) {
    console.error('❌ Error en getUserStats:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message);
  }
});