 
// src/environments/environment.ts
// 🔥 CONFIGURACIÓN DEVELOPMENT - EXACTAMENTE IGUAL QUE MÓVIL

export const environment = {
    production: false,
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
  
    // ✅ CONFIGURACIÓN ESPECÍFICA PARA PLATAFORMA WEB
    webConfig: {
      // Roles permitidos en la plataforma web
      allowedRoles: ['trainer', 'admin'],
      
      // Configuración de refresh de datos tiempo real
      realTimeConfig: {
        alertsRefreshMs: 5000,
        metricsRefreshMs: 30000,
        usersRefreshMs: 60000
      },
  
      // Configuración de paginación
      pagination: {
        defaultPageSize: 20,
        maxPageSize: 100
      },
  
      // URLs de la app móvil para referencias
      mobileAppUrl: 'http://localhost:8100',
      
      // Configuración de validación de rutinas IA
      aiValidation: {
        autoApproveThreshold: 85, // % de confianza para auto-aprobar
        requireTrainerReview: true
      }
    },
  
    // ✅ CONFIGURACIÓN DE APIs (MISMO ENDPOINT QUE MÓVIL)
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
  
    // ✅ CONFIGURACIÓN DE FEATURES
    features: {
      // Funcionalidades principales
      userManagement: true,
      routineValidation: true,
      realTimeAlerts: true,
      analytics: true,
      dataExports: true,
      
      // Funcionalidades beta
      beta: {
        advancedReports: true,
        predictiveAnalytics: false,
        aiParameterTuning: true
      }
    }
  };