// functions/updateUserPassword.js
// Cloud Function para actualizar la contraseña de un usuario usando Firebase Admin

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.updateUserPassword = functions.https.onCall(async (data, context) => {
  try {
    console.log('🔒 Iniciando actualización de contraseña');

    // Validar datos de entrada
    const { userId, newPassword } = data;

    if (!userId || !newPassword) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId y newPassword son requeridos'
      );
    }

    // Validar que la contraseña tenga al menos 8 caracteres
    if (newPassword.length < 8) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'La contraseña debe tener al menos 8 caracteres'
      );
    }

    // Validar requisitos de seguridad de la contraseña
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'
      );
    }

    console.log('✅ Validación de contraseña exitosa');

    // Actualizar la contraseña del usuario en Firebase Auth
    await admin.auth().updateUser(userId, {
      password: newPassword
    });

    console.log('✅ Contraseña actualizada en Firebase Auth');

    // Registrar el cambio de contraseña en Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userId).update({
      passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Registro de cambio de contraseña guardado en Firestore');

    // Opcional: Registrar en auditoría
    await db.collection('auditLogs').add({
      userId: userId,
      action: 'PASSWORD_RESET',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      method: 'verification_code',
      ipAddress: context.rawRequest?.ip || 'unknown',
      userAgent: context.rawRequest?.headers['user-agent'] || 'unknown'
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
        throw new functions.https.HttpsError(
          'not-found',
          'Usuario no encontrado'
        );
      }
      if (error.code === 'auth/invalid-password') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'La contraseña no cumple con los requisitos de Firebase'
        );
      }
    }

    // Si ya es un HttpsError, re-lanzarlo
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Error genérico
    throw new functions.https.HttpsError(
      'internal',
      'Error al actualizar la contraseña: ' + error.message
    );
  }
});
