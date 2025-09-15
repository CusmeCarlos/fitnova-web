 
// src/environments/environment.prod.ts
// 🔥 CONFIGURACIÓN PRODUCCIÓN - OPTIMIZADA PARA PERFORMANCE

export const environment = {
    production: true,
    appName: 'FitNova Web Platform',
    version: '1.0.0',
    
    // ✅ EXACTAMENTE LA MISMA CONFIGURACIÓN QUE TU MÓVIL
    firebase: {
      apiKey: "AIzaSyBt14_G3joQabbwK15lDgYFn7jjVklAAO0",
      authDomain: "fitnova-app.firebaseapp.com",
      projectId: "fitnova-app",
      storageBucket: "fitnova-app.firebasestorage.app",
      messagingSenderId: "553990987723",
      appId: "1:553990987723:web:c6adf166677069789aa04e",
      measurementId: "G-85QSFTH679"
    },
  
    // ✅ CONFIGURACIÓN OPTIMIZADA PARA PRODUCCIÓN
    webConfig: {
      // Roles permitidos en la plataforma web
      allowedRoles: ['trainer', 'admin'],
      
      // Configuración de refresh optimizada para producción
      realTimeConfig: {
        alertsRefreshMs: 10000,   // Menos frecuente
        metricsRefreshMs: 60000,  // 1 minuto
        usersRefreshMs: 300000    // 5 minutos
      },
  
      // Configuración de paginación optimizada
      pagination: {
        defaultPageSize: 25,
        maxPageSize: 50  // Reducido para mejor performance
      },
  
      // URLs de producción
      mobileAppUrl: 'https://fitnova-app.web.app',
      
      // Configuración de validación de rutinas IA
      aiValidation: {
        autoApproveThreshold: 90, // Más estricto en producción
        requireTrainerReview: true
      }
    },
  
    // ✅ CONFIGURACIÓN DE APIs PRODUCCIÓN
    apis: {
      cloudFunctionsUrl: 'https://us-central1-fitnova-app.cloudfunctions.net',
      
      // Endpoints específicos
      endpoints: {
        generateAiRoutine: '/generateAiRoutineWithGPT',
        getUserMetrics: '/getUserMetrics', 
        processPostureError: '/processPostureError',
        ping: '/ping'
      }
    },
  
    // ✅ CONFIGURACIÓN DE FEATURES PRODUCCIÓN
    features: {
      // Funcionalidades principales
      userManagement: true,
      routineValidation: true,
      realTimeAlerts: true,
      analytics: true,
      dataExports: true,
      
      // Funcionalidades beta (más conservadoras)
      beta: {
        advancedReports: true,
        predictiveAnalytics: false,
        aiParameterTuning: false  // Deshabilitado en producción por seguridad
      }
    }
  };