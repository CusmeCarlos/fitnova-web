 
// src/app/interfaces/user.interface.ts
// 🔗 EXACTAMENTE LA MISMA INTERFAZ QUE EN TU MÓVIL

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified: boolean;
    role: 'user' | 'trainer' | 'admin';
    createdAt?: Date;
    lastLoginAt?: Date;
    isActive?: boolean;
    
    // Campos específicos para entrenadores (web)
    trainerProfile?: {
      specialization: string[];
      certifications: string[];
      experienceYears: number;
      assignedUsers: string[];
    };
  }
  
  // src/app/interfaces/profile.interface.ts
  // 🔗 MISMAS INTERFACES QUE TU MÓVIL
  
  export interface PersonalInfo {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    weight?: number;
    height?: number;
    dateOfBirth?: Date;
    phoneNumber?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    bodyMassIndex?: number;
  }
  
  export interface MedicalHistory {
    injuries?: string[];
    conditions?: string[];
    limitations?: string[];
    currentConditions?: string[];
    chronicDiseases?: string[];
    allergies?: string[];
    medications?: string[];
    heartConditions?: string[];
    lastMedicalCheckup?: Date;
    doctorClearance?: boolean;
    doctorNotes?: string;
    
    // Campos críticos para IA
    currentInjuries?: string;
    painfulAreas?: string[];
    forbiddenExercises?: string;
    movementLimitations?: string;
    exercisesToAvoid?: string;
    
    physicalCapacity?: {
      walkingCapacity: 'less_5min' | '5_15min' | '15_30min' | '30_60min' | 'more_60min';
      stairsCapacity: 'no_difficulty' | 'mild_difficulty' | 'moderate_difficulty' | 'high_difficulty' | 'cannot';
      weightExperience: 'never' | 'few_times' | 'some_experience' | 'experienced' | 'very_experienced';
      maxComfortableWeight?: number;
      energyLevel: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
    };
    
    aiReadiness?: number;
    readyForAI?: boolean;
    lastUpdated?: Date;
  }
  
  export interface Profile {
    uid: string;
    personalInfo: PersonalInfo;
    medicalHistory: MedicalHistory;
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    goals?: string[];
    profileComplete: boolean;
    
    // Campos expandidos
    fitnessGoals?: {
      primaryGoals: string[];
      targetWeight?: number;
      shortTermGoals?: string[];
      preferredWorkoutTypes?: string[];
      preferredWorkoutDuration?: number;
    };
    
    currentAIRoutine?: string;
    lastRoutineGenerated?: Date;
    assignedTrainer?: string;
    trainerNotes?: string;
    
    profileCompletionPercentage?: number;
    aiReadinessPercentage?: number;
    
    createdAt?: Date;
    lastUpdated?: Date;
  }
  
  // src/app/interfaces/dashboard.interface.ts
  // 🔗 MISMAS INTERFACES QUE TU DASHBOARD SERVICE
  
  export interface UserStats {
    uid: string;
    lastCriticalError: any;
    totalCriticalErrors: number;
    lastErrorType: string;
    lastExercise: string;
    lastSessionId: string;
    accuracy?: number;
    weeklyGoalProgress?: number;
    totalWorkouts?: number;
    totalHours?: number;
    averageAccuracy?: number;
    weeklyStreak?: number;
    improvementRate?: number;
    lastSessionDurationSeconds?: number;
    totalSeconds?: number;
  }
  
  export interface CriticalAlert {
    id: string;
    uid: string;
    errorType: string;
    exercise: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    timestamp: any;
    processedAt: any;
    biomechanicsData: any;
    affectedJoints: string[];
    angles: any;
    captureURL: string;
    lastSessionId?: string;
  }
  
  export interface DashboardMetrics {
    totalWorkouts: number;
    accuracy: number;
    totalHours: number;
    weeklyImprovement: number;
    weeklyGoalProgress: number;
    currentStreak: number;
    criticalErrorsToday: number;
    mostCommonError: string;
    recentAlerts: CriticalAlert[];
    errorsByType: { [key: string]: number };
    weeklyProgress: { day: string; workouts: number; errors: number }[];
    accuracyTrend: { date: string; accuracy: number }[];
    exerciseStats: { exercise: string; count: number; avgAccuracy: number }[];
    isEmpty: boolean;
  }
  
  // src/app/interfaces/routine.interface.ts  
  // 🔗 MISMAS INTERFACES QUE TU AI ROUTINE SERVICE
  
  export interface AIGeneratedRoutine {
    id: string;
    userId: string;
    generatedAt: Date;
    
    baseProfile: {
      fitnessLevel: string;
      primaryGoals: string[];
      medicalLimitations: string[];
      physicalCapacity: any;
    };
    
    routine: {
      name: string;
      description: string;
      duration: number;
      difficulty: 'beginner' | 'intermediate' | 'advanced' | 'custom';
      exercises: any[];
      estimatedCalories: number;
      focusAreas: string[];
      adaptations: string[];
    };
    
    status: 'pending_approval' | 'approved' | 'rejected' | 'needs_modification';
    trainerNotes?: string;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    
    aiConfidence: number;
    generationTime: number;
    adaptationLevel: 'none' | 'minimal' | 'moderate' | 'extensive';
    
    lastUpdated: Date;
  }