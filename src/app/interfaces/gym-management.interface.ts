// src/app/interfaces/gym-management.interface.ts
// 🏋️ INTERFACES PARA GESTIÓN AVANZADA DEL GIMNASIO - FASE 18

// ================================================================================
// 🏋️ EQUIPAMIENTO
// ================================================================================
export interface GymEquipment {
    id: string; // 'dumbbell-1-5kg', 'barbell-olympic'
    category: 'free-weights' | 'machines' | 'cardio' | 'functional';
    name: string; // 'Mancuernas 1-5kg', 'Barra Olímpica 20kg'
    brand?: string; // 'Rogue', 'Life Fitness'
    quantity: number; // Cantidad disponible
    status: 'operational' | 'maintenance' | 'broken' | 'reserved';
    zone: string; // ID de la zona donde está ubicado
    purchaseDate?: Date;
    lastMaintenance?: Date;
    nextMaintenanceDate?: Date;
    cost?: number; // Valor de compra
    notes?: string; // Observaciones
    imageUrl?: string; // Foto del equipo
    specifications?: {
      weightRange?: string; // '1-40kg'
      maxWeight?: number;
      dimensions?: string;
      powerRequired?: boolean;
    };
    usageStats?: {
      totalUses: number;
      averageUsesPerDay: number;
      lastUsed?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string; // Email del admin
  }
  
  // ================================================================================
  // 🏢 ZONAS DEL GIMNASIO
  // ================================================================================
  export interface GymZone {
    id: string; // 'free-weights', 'machines', 'functional'
    name: string; // 'Zona Peso Libre'
    description?: string;
    maxCapacity: number; // Usuarios simultáneos máximos
    currentOccupancy: number; // En tiempo real (futuro)
    color: string; // Para identificación visual en dashboard
    floorArea?: number; // Metros cuadrados
    equipmentIds: string[]; // IDs de equipos en esta zona
    rules?: string[]; // Reglas específicas de la zona
    amenities?: string[]; // 'Aire acondicionado', 'Ventilación'
    isActive: boolean;
    operatingHours?: {
      start: string;
      end: string;
    };
    maintenanceSchedule?: {
      dayOfWeek: string;
      startTime: string;
      duration: number; // minutos
    }[];
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
  }
  
  // ================================================================================
  // 📅 HORARIOS
  // ================================================================================
  export interface GymSchedule {
    id: string;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    isOpen: boolean;
    shifts: {
      id: string;
      name: string; // 'Turno Mañana', 'Turno Tarde'
      startTime: string; // '07:30'
      endTime: string; // '12:00'
      maxCapacity: number; // Capacidad para este turno
      isPeakHour: boolean; // Indica si es hora pico
      staffRequired: number; // Personal mínimo requerido
      isActive: boolean;
    }[];
    specialHours?: {
      date: Date; // Fecha específica (feriados, eventos)
      reason: string; // 'Mantenimiento', 'Evento especial'
      startTime?: string;
      endTime?: string;
      isClosed: boolean;
    }[];
    breakTime?: {
      start: string;
      end: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface PeakHourConfig {
    id: string;
    timeRange: {
      start: string; // '17:00'
      end: string; // '19:00'
    };
    daysOfWeek: string[];
    capacityMultiplier: number; // 0.9 = 90% capacidad en horas pico
    staffMultiplier: number; // Personal adicional requerido
    description: string;
    isActive: boolean;
  }
  
  // ================================================================================
  // 🎯 EJERCICIOS
  // ================================================================================
  export interface Exercise {
    id: string; // 'squat-barbell', 'bench-press'
    name: string; // 'Sentadilla con Barra'
    nameEN?: string; // 'Barbell Squat'
    category: 'compound' | 'isolation' | 'cardio' | 'flexibility';
    muscleGroups: string[]; // ['quadriceps', 'glutes', 'hamstrings']
    primaryMuscles: string[]; // Músculos principales
    secondaryMuscles: string[]; // Músculos secundarios
    
    // MediaPipe Configuration
    mediaPipeEnabled: boolean; // Si tiene detección postural
    detectionPoints: number[]; // IDs de puntos MediaPipe usados
    detectionConfig?: {
      minConfidence: number;
      criticalAngles: {
        joint: string; // 'knee', 'elbow', 'hip'
        minAngle: number;
        maxAngle: number;
        tolerance: number;
      }[];
      commonErrors: {
        id: string;
        name: string; // 'knee-valgus', 'rounded-back'
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        detectionLogic: string; // Descripción del algoritmo
        correction: string; // Instrucciones de corrección
      }[];
    };
    
    // Exercise Details
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    equipmentRequired: string[]; // IDs de equipos necesarios
    equipmentOptional: string[]; // IDs de equipos opcionales
    spaceRequired: number; // Metros cuadrados
    safetyLevel: 1 | 2 | 3 | 4 | 5; // 1=muy seguro, 5=alto riesgo
    
    // Instructions
    instructions: {
      setup: string[];
      execution: string[];
      breathing: string;
      tips: string[];
      safetyNotes: string[];
    };
    
    // Media
    videoUrl?: string; // Video demostrativo
    imageUrl?: string; // Imagen del ejercicio
    thumbnailUrl?: string;
    
    // Progression
    progressionOf?: string; // ID del ejercicio más básico
    regressionTo?: string; // ID del ejercicio más avanzado
    alternatives: string[]; // IDs de ejercicios alternativos
    
    // Contraindications
    contraindications: string[]; // Lesiones o condiciones que lo impiden
    requiredExperience: number; // Meses mínimos de entrenamiento
    
    // System
    isActive: boolean;
    isAvailableForBeginners: boolean;
    popularityScore: number; // Para ordenamiento
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
  }
  
  export interface ExerciseCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    exercises: string[]; // IDs de ejercicios en esta categoría
  }
  
  // ================================================================================
  // 💳 MEMBRESÍAS
  // ================================================================================
  export interface MembershipPlan {
    id: string; // 'monthly-basic', 'quarterly-premium'
    name: string; // 'Plan Mensual Básico'
    description: string;
    type: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'day-pass';
    
    // Pricing
    price: number; // Precio en USD
    currency: 'USD';
    discount?: {
      percentage: number;
      validUntil?: Date;
      reason?: string; // 'Promoción Navidad'
    };
    
    // Duration
    durationDays: number; // 30, 90, 180, 365
    
    // Benefits
    benefits: {
      unlimitedAccess: boolean;
      weeklyLimit?: number; // Visitas por semana
      monthlyLimit?: number; // Visitas por mes
      peakHourAccess: boolean; // Acceso en horas pico
      personalTrainerSessions?: number; // Sesiones incluidas
      routineGeneration: boolean; // Rutinas IA incluidas
      postureDetection: boolean; // MediaPipe incluido
      guestPasses?: number; // Pases para invitados
      lockerIncluded: boolean;
      towelService: boolean;
      nutritionConsultation: boolean;
      freezeDays?: number; // Días de congelamiento permitidos
    };
    
    // Restrictions
    restrictions?: {
      zoneAccess: string[]; // IDs de zonas permitidas
      timeRestrictions?: {
        allowedDays: string[];
        allowedHours: {
          start: string;
          end: string;
        };
      };
      equipmentRestrictions?: string[]; // Equipos NO permitidos
    };
    
    // Target Audience
    targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'all';
    recommendedFor: string[]; // ['students', 'adults', 'seniors']
    minAge?: number;
    maxAge?: number;
    
    // System
    isActive: boolean;
    isPromoted: boolean; // Destacado en la app
    popularityRank: number;
    maxActiveMembers?: number; // Límite de miembros con este plan
    currentActiveMembers: number;
    
    // Auto-renewal
    autoRenewal: boolean;
    renewalDiscount?: number; // Descuento en renovación
    
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
  }
  
  export interface UserMembership {
    id: string;
    userId: string;
    planId: string;
    
    // Status
    status: 'active' | 'expired' | 'frozen' | 'cancelled' | 'pending-payment';
    
    // Dates
    startDate: Date;
    endDate: Date;
    purchaseDate: Date;
    lastRenewalDate?: Date;
    nextBillingDate?: Date;
    
    // Freeze Management
    frozenDays: number; // Días congelados usados
    freezeHistory: {
      startDate: Date;
      endDate: Date;
      reason: string;
      approvedBy: string;
    }[];
    
    // Usage Stats
    totalVisits: number;
    visitsThisMonth: number;
    visitsThisWeek: number;
    lastVisit?: Date;
    averageVisitsPerWeek: number;
    
    // Payment
    paymentMethod: 'cash' | 'card' | 'transfer' | 'pending';
    paymentHistory: {
      date: Date;
      amount: number;
      method: string;
      receipt?: string; // URL del comprobante
      processedBy: string;
    }[];
    
    // Auto-renewal
    autoRenewalEnabled: boolean;
    
    createdAt: Date;
    updatedAt: Date;
  }
  
  // ================================================================================
  // 🤖 MEDIAPIPE AVANZADO
  // ================================================================================
  export interface MediaPipeAdvancedConfig {
    // Global Settings (ya existen en SystemSettings)
    poseSensitivity: number;
    confidenceThreshold: number;
    
    // Per-Exercise Configuration
    exerciseConfigs: {
      exerciseId: string;
      enabled: boolean; // Activar/desactivar MediaPipe para este ejercicio
      customThresholds?: {
        confidenceThreshold?: number; // Override global
        criticalThreshold?: number;
      };
      monitoredJoints: string[]; // Articulaciones a monitorear
      alertCooldown: number; // ms entre alertas del mismo error
    }[];
    
    // Camera Settings
    cameraConfig: {
      preferredResolution: '720p' | '1080p' | 'auto';
      preferredFPS: number;
      autoAdjustQuality: boolean; // Reducir calidad si lag
      mirrorMode: boolean; // Espejo horizontal
    };
    
    // Alert Behavior
    alertConfig: {
      vibrationEnabled: boolean;
      soundEnabled: boolean;
      visualOverlayEnabled: boolean;
      voiceFeedbackEnabled: boolean;
      captureScreenshotOnCritical: boolean;
      maxAlertsPerSession: number; // Evitar spam
    };
    
    // Performance Optimization
    performance: {
      enableGPUAcceleration: boolean;
      reducedModeThreshold: number; // % CPU para modo reducido
      backgroundProcessing: boolean;
      adaptiveFrameSkipping: boolean;
    };
    
    // Analytics
    analytics: {
      trackDetectionAccuracy: boolean;
      storeRawPoseData: boolean; // Para análisis posterior
      generateHeatmaps: boolean; // Zonas más problemáticas
    };
  }