// Script para sincronizar emailVerified de todos los usuarios
// Ejecutar: node sync-all-users.js

const https = require('https');

const CLOUD_FUNCTION_URL = 'https://checkemailverification-fh7y4ycjoa-uc.a.run.app';

// Usuario específico que necesita sincronización
const userToSync = {
  uid: 'XBS7bXQZA5gKI3k7BPJRTJg4jqk1',
  email: 'cusmecisco@gmail.com'
};

console.log('🔄 Sincronizando usuario:', userToSync.email);

const data = JSON.stringify({ data: { uid: userToSync.uid } });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(CLOUD_FUNCTION_URL, options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('\n📊 Respuesta:');
    console.log(responseData);

    try {
      const result = JSON.parse(responseData);
      if (result.result && result.result.success) {
        console.log('\n✅ ÉXITO: Email verificado sincronizado correctamente');
        console.log('📧 emailVerified:', result.result.emailVerified);
      } else {
        console.log('\n⚠️ Respuesta:', result);
      }
    } catch (e) {
      console.log('\n❌ Error parseando respuesta:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(data);
req.end();
