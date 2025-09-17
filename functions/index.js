// functions/src/index.js
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

    // ✅ VALIDAR CONTRASEÑA
    if (password.length < 6) {
      console.error('❌ Contraseña muy corta');
      throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres');
    }

    // ✅ DETERMINAR ENTRENADOR ASIGNADO
    let assignedTrainerId = '';
    let assignedTrainerName = '';

    if (callerRole === 'trainer') {
      // Para trainers: auto-asignar a ellos mismos
      assignedTrainerId = callerUid;
      assignedTrainerName = callerData.displayName || 'Entrenador';
      console.log('👨‍💼 Usuario será asignado al trainer:', assignedTrainerName);
    } else if (callerRole === 'admin' && assignedTrainer) {
      // Para admins: usar el entrenador seleccionado (si se especifica)
      assignedTrainerId = assignedTrainer;
      
      // Buscar nombre del entrenador asignado
      const trainerDoc = await db.doc(`users/${assignedTrainer}`).get();
      if (trainerDoc.exists) {
        assignedTrainerName = trainerDoc.data().displayName || 'Entrenador';
      } else {
        assignedTrainerName = 'Entrenador';
      }
      console.log('👨‍💼 Usuario será asignado al trainer seleccionado:', assignedTrainerName);
    }

    console.log('📋 Entrenador asignado - ID:', assignedTrainerId, 'Nombre:', assignedTrainerName);

    // ✅ CREAR USUARIO EN FIREBASE AUTH
    console.log('🔐 Creando usuario en Firebase Auth...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    console.log('✅ Usuario creado en Auth con UID:', userRecord.uid);

    // ✅ CREAR DOCUMENTO EN COLECCIÓN 'users'
    const userDocData = {
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: 'user', // Siempre 'user' para usuarios móvil
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
      createdBy: callerUid,
      createdByRole: callerRole,
      createdByName: callerData.displayName || '',
      
      // ✅ ENTRENADOR ASIGNADO
      assignedTrainer: assignedTrainerId,
      assignedTrainerName: assignedTrainerName,
      
      // ✅ CONFIGURACIÓN INICIAL
      preferences: {
        notifications: true,
        language: 'es',
        theme: 'light',
        units: 'metric'
      },
      
      // ✅ PERFIL MÓVIL BÁSICO
      profile: {
        height: 0,
        weight: 0,
        age: 0,
        fitnessLevel: 'beginner',
        goals: [],
        medicalConditions: [],
        preferredWorkoutTime: 'morning'
      }
    };

    console.log('📄 Creando documento en colección users...');
    await db.doc(`users/${userRecord.uid}`).set(userDocData);
    console.log('✅ Documento users creado exitosamente');

    // ✅ CREAR DOCUMENTO EN COLECCIÓN 'userStats'
    const userStatsData = {
      uid: newUserId,
      
      // ✅ ESTADÍSTICAS BÁSICAS
      totalWorkouts: 0,
      averageAccuracy: 0,
      totalCriticalErrors: 0,
      totalExerciseTime: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      
      // ✅ METAS Y PROGRESO
      weeklyGoalMinutes: 150, // Meta recomendada por OMS
      currentStreak: 0,
      maxStreak: 0,
      
      // ✅ ACTIVIDAD
      lastActiveAt: FieldValue.serverTimestamp(),
      isActiveToday: true,
      lastWorkoutDate: null,
      
      // ✅ TIMESTAMPS
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      
      // ✅ MÉTRICAS POR EJERCICIO (estructura inicial vacía)
      exerciseStats: {},
      
      // ✅ PROGRESO SEMANAL (estructura inicial vacía)
      weeklyStats: {
        currentWeek: {
          weekStart: FieldValue.serverTimestamp(),
          totalMinutes: 0,
          workoutsCompleted: 0,
          averageAccuracy: 0
        }
      },
      
      // ✅ ENTRENADOR ASIGNADO
      assignedTrainer: assignedTrainerId,
      assignedTrainerName: assignedTrainerName,
      
      // ✅ MÉTRICAS ADICIONALES
      improvementRate: 0,
      lastSessionDurationSeconds: 0,
      weeklyStreak: 0
    };

    console.log('📊 Creando documento en colección userStats...');
    await db.doc(`userStats/${userRecord.uid}`).set(userStatsData);
    console.log('✅ Documento userStats creado exitosamente');

    // ✅ ACTUALIZAR CONTADOR DEL ENTRENADOR (si aplica)
    if (assignedTrainerId && assignedTrainerId !== '') {
      try {
        console.log('📈 Actualizando contador del entrenador...');
        
        // Verificar si el entrenador ya tiene perfil de entrenador
        const trainerRef = db.doc(`users/${assignedTrainerId}`);
        const trainerDoc = await trainerRef.get();
        
        if (trainerDoc.exists) {
          const currentTrainerData = trainerDoc.data();
          const currentCount = 
          (currentTrainerData.trainerProfile && currentTrainerData.trainerProfile.totalAssignedUsers) || 0;
                  
          await trainerRef.update({
            'trainerProfile.totalAssignedUsers': currentCount + 1,
            'trainerProfile.lastAssignedUserAt': FieldValue.serverTimestamp(),
            'trainerProfile.lastAssignedUserName': displayName,
            updatedAt: FieldValue.serverTimestamp()
          });
          
          console.log('✅ Contador del entrenador actualizado');
        }
      } catch (trainerError) {
        console.warn('⚠️ Error actualizando contador del entrenador (no crítico):', trainerError);
        // No lanzamos error porque el usuario ya fue creado exitosamente
      }
    }

    // ✅ RESPUESTA EXITOSA
    const response = {
      success: true,
      userId: userRecord.uid,
      message: 'Usuario creado exitosamente',
      userData: {
        uid: userRecord.uid,
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