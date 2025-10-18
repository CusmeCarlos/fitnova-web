// Script temporal para sincronizar emailVerified de Auth → Firestore
// Ejecutar: node sync-email-verified.js

const admin = require('firebase-admin');
const serviceAccount = require('./fitnova-app-firebase-adminsdk.json'); // Debes descargar este archivo de Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function syncAllUsers() {
  console.log('🔄 Iniciando sincronización de emailVerified...\n');

  let syncedCount = 0;
  let errorCount = 0;

  try {
    // Obtener todos los usuarios de Firestore
    const usersSnapshot = await db.collection('users').get();

    console.log(`📊 Total de usuarios en Firestore: ${usersSnapshot.size}\n`);

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const firestoreData = userDoc.data();

      try {
        // Obtener datos de Auth (fuente de verdad)
        const authUser = await auth.getUser(uid);

        // Comparar estados
        if (authUser.emailVerified !== firestoreData.emailVerified) {
          console.log(`🔧 Sincronizando ${firestoreData.email || uid}:`);
          console.log(`   Auth: ${authUser.emailVerified} | Firestore: ${firestoreData.emailVerified}`);

          // Actualizar Firestore
          await db.collection('users').doc(uid).update({
            emailVerified: authUser.emailVerified,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`   ✅ Actualizado a: ${authUser.emailVerified}\n`);
          syncedCount++;
        }
      } catch (error) {
        console.error(`❌ Error con usuario ${uid}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 RESUMEN:');
    console.log(`   ✅ Usuarios sincronizados: ${syncedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📊 Total procesados: ${usersSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }

  process.exit(0);
}

syncAllUsers();
