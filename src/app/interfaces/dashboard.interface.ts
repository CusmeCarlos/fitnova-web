// src/app/interfaces/dashboard.interface.ts
// Interfaces para el sistema de reducción de errores

/**
 * Representa una sesión de ejercicio individual
 */
export interface ExerciseSession {
  id?: string;
  userId: string;
  exerciseName: string;
  sessionNumber: number; // 1, 2, 3, etc.
  errorsDetected: number;
  timestamp: Date;
  weekId: string; // Formato: YYYY-WW (ej: 2025-44)
  details?: {
    errorTypes?: string[];
    duration?: number;
    confidence?: number;
  };
}

/**
 * Progreso de un ejercicio específico (comparación S1 vs S2)
 */
export interface ExerciseProgress {
  exerciseName: string;
  session1?: {
    errorsDetected: number;
    timestamp: Date;
  };
  session2?: {
    errorsDetected: number;
    timestamp: Date;
  };
  errorReduction?: number; // Cantidad de errores reducidos (puede ser negativo si empeoró)
  improvementPercentage?: number; // Porcentaje de mejora
  status: 'baseline' | 'improved' | 'worsened' | 'pending'; // Estado del progreso
}

/**
 * Resumen semanal de reducción de errores
 */
export interface WeeklyErrorSummary {
  weekId: string; // Formato: YYYY-WW
  userId: string;
  weekLabel: string; // Ej: "Semana Actual", "Hace 1 semana"
  totalErrorsReduced: number; // Total de errores reducidos en la semana
  exercisesImproved: number; // Cantidad de ejercicios que mejoraron (tienen S2)
  exercises: ExerciseProgress[]; // Detalle por ejercicio
  startDate: Date;
  endDate: Date;
}

/**
 * Historial de semanas (para mostrar las últimas 3 semanas)
 */
export interface WeeklyHistory {
  currentWeek: WeeklyErrorSummary;
  previousWeeks: WeeklyErrorSummary[]; // Últimas 2 semanas
}

/**
 * Métricas globales de reducción de errores (todos los usuarios)
 */
export interface GlobalErrorReductionMetrics {
  totalErrorsReducedThisWeek: number;
  totalExercisesImprovedThisWeek: number;
  averageErrorReductionPerUser: number;
  topPerformingUsers: {
    userId: string;
    displayName: string;
    errorsReduced: number;
    exercisesImproved: number;
  }[];
  weeklyTrend: {
    weekId: string;
    weekLabel: string;
    errorsReduced: number;
  }[];
}

/**
 * Métricas de usuario individual con reducción de errores
 */
export interface UserErrorReductionMetrics {
  userId: string;
  displayName: string;
  currentWeekSummary: WeeklyErrorSummary;
  weeklyHistory: WeeklyHistory;
  totalErrorsReducedAllTime: number;
  totalExercisesImprovedAllTime: number;
  averageImprovementRate: number; // Promedio de mejora en porcentaje
}
