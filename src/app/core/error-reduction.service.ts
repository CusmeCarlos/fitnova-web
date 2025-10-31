// src/app/core/error-reduction.service.ts
// Servicio para gestionar la reducción de errores (equivalente a la app móvil)

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, catchError, of } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {
  ExerciseSession,
  ExerciseProgress,
  WeeklyErrorSummary,
  WeeklyHistory,
  GlobalErrorReductionMetrics,
  UserErrorReductionMetrics
} from '../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class ErrorReductionService {
  private db = firebase.firestore();
  private exerciseProgressSubject = new BehaviorSubject<ExerciseProgress[]>([]);
  private weeklyHistorySubject = new BehaviorSubject<WeeklyHistory | null>(null);

  constructor() {
    console.log('🔄 ErrorReductionService inicializado');
  }

  /**
   * Obtiene el ID de la semana actual en formato YYYY-WW
   */
  private getCurrentWeekId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = this.getWeekNumber(now);
    return `${year}-${String(weekNumber).padStart(2, '0')}`;
  }

  /**
   * Calcula el número de semana del año
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Parsea un weekId en formato "YYYY-WW" a weekNumber y year
   */
  private parseWeekId(weekId: string): { weekNumber: number; year: number } {
    const [year, week] = weekId.split('-').map(Number);
    return { weekNumber: week, year };
  }

  /**
   * Obtiene el rango de fechas de una semana dada
   */
  private getWeekDateRange(weekId: string): { start: Date; end: Date } {
    const [year, week] = weekId.split('-').map(Number);
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;

    const startDate = new Date(firstDayOfYear);
    startDate.setDate(firstDayOfYear.getDate() + daysOffset - firstDayOfYear.getDay() + 1);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return { start: startDate, end: endDate };
  }

  /**
   * Obtiene el resumen de la semana actual para un usuario específico
   */
  getCurrentWeekSummary(userId: string): Observable<WeeklyErrorSummary> {
    const weekId = this.getCurrentWeekId();
    return this.getWeekSummary(userId, weekId, 'Semana Actual');
  }

  /**
   * Obtiene el resumen de una semana específica
   */
  private getWeekSummary(userId: string, weekId: string, weekLabel: string): Observable<WeeklyErrorSummary> {
    return new Observable(observer => {
      const { start, end } = this.getWeekDateRange(weekId);

      const { weekNumber, year } = this.parseWeekId(weekId);

      console.log(`🔍 Buscando datos para usuario ${userId}, semana ${weekNumber}/${year} (${weekLabel})`);

      // Buscar documentos por UID (cada documento es un ejercicio con array de sessions)
      this.db.collection('exerciseProgressTracking')
        .where('uid', '==', userId)
        .onSnapshot(
          async snapshot => {
            try {
              console.log(`📦 Encontrados ${snapshot.size} documentos (ejercicios) en exerciseProgressTracking`);

              const exercises: ExerciseProgress[] = [];
              let totalErrorsReduced = 0;
              let exercisesImproved = 0;

              snapshot.forEach(doc => {
                const data = doc.data();
                const exerciseName = data['exerciseName'] || 'Ejercicio';
                const sessions = (data['sessions'] || []) as any[];

                console.log(`📄 Ejercicio: ${exerciseName}, ${sessions.length} sesiones totales`);

                // Filtrar sesiones de esta semana específica
                const weekSessions = sessions.filter((s: any) =>
                  s.weekNumber === weekNumber && s.year === year
                );

                console.log(`   → Sesiones en semana ${weekNumber}/${year}: ${weekSessions.length}`);

                if (weekSessions.length === 0) {
                  return; // Skip este ejercicio si no tiene sesiones esta semana
                }

                // Buscar sesión 1 y sesión 2
                const session1Data = weekSessions.find((s: any) => s.sessionNumber === 1);
                const session2Data = weekSessions.find((s: any) => s.sessionNumber === 2);

                const progress: ExerciseProgress = {
                  exerciseName,
                  session1: session1Data ? {
                    errorsDetected: session1Data.errorsCount || 0,
                    timestamp: session1Data.timestamp?.toDate ? session1Data.timestamp.toDate() : new Date(session1Data.timestamp)
                  } : undefined,
                  session2: session2Data ? {
                    errorsDetected: session2Data.errorsCount || 0,
                    timestamp: session2Data.timestamp?.toDate ? session2Data.timestamp.toDate() : new Date(session2Data.timestamp)
                  } : undefined,
                  status: 'pending'
                };

                // Calcular reducción si hay ambas sesiones
                if (session1Data && session2Data) {
                  const session1Errors = session1Data.errorsCount || 0;
                  const session2Errors = session2Data.errorsCount || 0;
                  const reduction = session1Errors - session2Errors;

                  progress.errorReduction = reduction;

                  if (session1Errors > 0) {
                    progress.improvementPercentage = Math.round((reduction / session1Errors) * 100);
                  }

                  if (reduction > 0) {
                    progress.status = 'improved';
                    totalErrorsReduced += reduction;
                    exercisesImproved++;
                  } else if (reduction < 0) {
                    progress.status = 'worsened';
                  } else {
                    progress.status = 'baseline';
                  }

                  console.log(`   → S1: ${session1Errors} errores, S2: ${session2Errors} errores, Reducción: ${reduction}`);
                } else if (session1Data) {
                  progress.status = 'baseline';
                  console.log(`   → Solo S1: ${session1Data.errorsCount} errores`);
                }

                exercises.push(progress);
              });

              const summary: WeeklyErrorSummary = {
                weekId,
                userId,
                weekLabel,
                totalErrorsReduced,
                exercisesImproved,
                exercises,
                startDate: start,
                endDate: end
              };

              console.log('✅ Resumen semanal calculado:', {
                weekLabel,
                totalErrorsReduced,
                exercisesImproved,
                ejerciciosEncontrados: exercises.length
              });

              observer.next(summary);
            } catch (error) {
              console.error('❌ Error procesando resumen semanal:', error);
              observer.error(error);
            }
          },
          error => {
            console.error('❌ Error obteniendo sesiones de la semana:', error);
            observer.error(error);
          }
        );
    });
  }

  /**
   * Obtiene el historial de las últimas 3 semanas para un usuario
   */
  getWeeklyHistory(userId: string): Observable<WeeklyHistory> {
    const currentWeekId = this.getCurrentWeekId();
    const [year, week] = currentWeekId.split('-').map(Number);

    // Calcular IDs de semanas anteriores
    const previousWeek1Id = this.getPreviousWeekId(year, week, 1);
    const previousWeek2Id = this.getPreviousWeekId(year, week, 2);

    return combineLatest([
      this.getWeekSummary(userId, currentWeekId, 'Semana Actual'),
      this.getWeekSummary(userId, previousWeek1Id, 'Hace 1 semana'),
      this.getWeekSummary(userId, previousWeek2Id, 'Hace 2 semanas')
    ]).pipe(
      map(([current, prev1, prev2]) => ({
        currentWeek: current,
        previousWeeks: [prev1, prev2]
      })),
      catchError(error => {
        console.error('❌ Error obteniendo historial semanal:', error);
        return of({
          currentWeek: this.getEmptyWeekSummary(userId, currentWeekId, 'Semana Actual'),
          previousWeeks: []
        });
      })
    );
  }

  /**
   * Calcula el ID de una semana anterior
   */
  private getPreviousWeekId(year: number, week: number, weeksAgo: number): string {
    let targetWeek = week - weeksAgo;
    let targetYear = year;

    while (targetWeek < 1) {
      targetYear--;
      targetWeek += 52; // Aproximación (años pueden tener 53 semanas)
    }

    return `${targetYear}-${String(targetWeek).padStart(2, '0')}`;
  }

  /**
   * Crea un resumen vacío
   */
  private getEmptyWeekSummary(userId: string, weekId: string, weekLabel: string): WeeklyErrorSummary {
    const { start, end } = this.getWeekDateRange(weekId);
    return {
      weekId,
      userId,
      weekLabel,
      totalErrorsReduced: 0,
      exercisesImproved: 0,
      exercises: [],
      startDate: start,
      endDate: end
    };
  }

  /**
   * Obtiene métricas globales de reducción de errores (todos los usuarios)
   */
  getGlobalErrorReductionMetrics(userIds: string[]): Observable<GlobalErrorReductionMetrics> {
    const { weekNumber, year } = this.parseWeekId(this.getCurrentWeekId());

    return new Observable(observer => {
      if (userIds.length === 0) {
        observer.next({
          totalErrorsReducedThisWeek: 0,
          totalExercisesImprovedThisWeek: 0,
          averageErrorReductionPerUser: 0,
          topPerformingUsers: [],
          weeklyTrend: []
        });
        return;
      }

      console.log(`🌐 Calculando métricas globales para semana ${weekNumber}/${year}, ${userIds.length} usuarios`);

      // Listener para exerciseProgressTracking (todos los ejercicios de todos los usuarios)
      this.db.collection('exerciseProgressTracking')
        .onSnapshot(
          snapshot => {
            console.log(`📦 Encontrados ${snapshot.size} documentos de ejercicios en total`);

            let totalErrorsReduced = 0;
            let totalExercisesImproved = 0;
            const userMetrics: Map<string, { errorsReduced: number; exercisesImproved: number; displayName: string }> = new Map();

            snapshot.forEach(doc => {
              const data = doc.data();
              const uid = data['uid'];

              // Filtrar solo usuarios en la lista
              if (!userIds.includes(uid)) {
                return;
              }

              const sessions = (data['sessions'] || []) as any[];

              // Filtrar sesiones de esta semana
              const weekSessions = sessions.filter((s: any) =>
                s.weekNumber === weekNumber && s.year === year
              );

              if (weekSessions.length === 0) {
                return;
              }

              // Buscar sesión 1 y 2
              const session1 = weekSessions.find((s: any) => s.sessionNumber === 1);
              const session2 = weekSessions.find((s: any) => s.sessionNumber === 2);

              // Si tiene ambas sesiones, calcular reducción
              if (session1 && session2) {
                const reduction = (session1.errorsCount || 0) - (session2.errorsCount || 0);

                if (reduction > 0) {
                  // Inicializar métricas del usuario si no existen
                  if (!userMetrics.has(uid)) {
                    userMetrics.set(uid, {
                      errorsReduced: 0,
                      exercisesImproved: 0,
                      displayName: 'Usuario' // Lo actualizaremos después
                    });
                  }

                  const userMetric = userMetrics.get(uid)!;
                  userMetric.errorsReduced += reduction;
                  userMetric.exercisesImproved += 1;

                  totalErrorsReduced += reduction;
                  totalExercisesImproved += 1;
                }
              }
            });

            console.log(`✅ Métricas globales calculadas: ${totalErrorsReduced} errores reducidos, ${totalExercisesImproved} ejercicios mejorados`);

            // Top usuarios
            const topPerformingUsers = Array.from(userMetrics.entries())
              .map(([userId, metrics]) => ({
                userId,
                displayName: metrics.displayName,
                errorsReduced: metrics.errorsReduced,
                exercisesImproved: metrics.exercisesImproved
              }))
              .sort((a, b) => b.errorsReduced - a.errorsReduced)
              .slice(0, 5);

            const metrics: GlobalErrorReductionMetrics = {
              totalErrorsReducedThisWeek: totalErrorsReduced,
              totalExercisesImprovedThisWeek: totalExercisesImproved,
              averageErrorReductionPerUser: userIds.length > 0 ?
                Math.round(totalErrorsReduced / userIds.length) : 0,
              topPerformingUsers,
              weeklyTrend: []
            };

            observer.next(metrics);
          },
          error => {
            console.error('❌ Error obteniendo métricas globales:', error);
            observer.error(error);
          }
        );
    });
  }

  /**
   * Obtiene métricas completas de un usuario específico
   */
  getUserErrorReductionMetrics(userId: string, displayName: string): Observable<UserErrorReductionMetrics> {
    return this.getWeeklyHistory(userId).pipe(
      map(history => ({
        userId,
        displayName,
        currentWeekSummary: history.currentWeek,
        weeklyHistory: history,
        totalErrorsReducedAllTime: this.calculateTotalErrorsReduced(history),
        totalExercisesImprovedAllTime: this.calculateTotalExercisesImproved(history),
        averageImprovementRate: this.calculateAverageImprovementRate(history)
      })),
      catchError(error => {
        console.error('❌ Error obteniendo métricas del usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Calcula total de errores reducidos en el historial
   */
  private calculateTotalErrorsReduced(history: WeeklyHistory): number {
    const currentTotal = history.currentWeek.totalErrorsReduced;
    const previousTotal = history.previousWeeks.reduce(
      (sum, week) => sum + week.totalErrorsReduced, 0
    );
    return currentTotal + previousTotal;
  }

  /**
   * Calcula total de ejercicios mejorados en el historial
   */
  private calculateTotalExercisesImproved(history: WeeklyHistory): number {
    const currentTotal = history.currentWeek.exercisesImproved;
    const previousTotal = history.previousWeeks.reduce(
      (sum, week) => sum + week.exercisesImproved, 0
    );
    return currentTotal + previousTotal;
  }

  /**
   * Calcula tasa promedio de mejora
   */
  private calculateAverageImprovementRate(history: WeeklyHistory): number {
    const allExercises = [
      ...history.currentWeek.exercises,
      ...history.previousWeeks.flatMap(week => week.exercises)
    ];

    const improvementRates = allExercises
      .filter(ex => ex.improvementPercentage !== undefined)
      .map(ex => ex.improvementPercentage!);

    if (improvementRates.length === 0) return 0;

    const sum = improvementRates.reduce((acc, rate) => acc + rate, 0);
    return Math.round(sum / improvementRates.length);
  }

  /**
   * Registra una sesión de ejercicio (llamado desde la app móvil o manualmente)
   * Esta función es equivalente a recordExerciseSession() de la app móvil
   */
  async recordExerciseSession(
    userId: string,
    exerciseName: string,
    errorsDetected: number,
    details?: any
  ): Promise<void> {
    try {
      const weekId = this.getCurrentWeekId();
      const timestamp = firebase.firestore.Timestamp.now();

      // Buscar sesiones previas del mismo ejercicio en esta semana
      const existingSessions = await this.db.collection('exerciseProgressTracking')
        .where('userId', '==', userId)
        .where('exerciseName', '==', exerciseName)
        .where('weekId', '==', weekId)
        .get();

      const sessionNumber = existingSessions.size + 1;

      // Guardar nueva sesión
      const sessionData: any = {
        userId,
        exerciseName,
        sessionNumber,
        errorsDetected,
        timestamp,
        weekId,
        details: details || {}
      };

      await this.db.collection('exerciseProgressTracking').add(sessionData);

      // Actualizar resumen semanal
      await this.updateWeeklySummary(userId, weekId);

      console.log(`✅ Sesión ${sessionNumber} de ${exerciseName} registrada para usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error registrando sesión de ejercicio:', error);
      throw error;
    }
  }

  /**
   * Actualiza el resumen semanal en weeklyErrorReduction
   */
  private async updateWeeklySummary(userId: string, weekId: string): Promise<void> {
    try {
      // Obtener todas las sesiones de la semana
      const sessionsSnapshot = await this.db.collection('exerciseProgressTracking')
        .where('userId', '==', userId)
        .where('weekId', '==', weekId)
        .get();

      const exerciseMap = new Map<string, ExerciseSession[]>();

      sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        const session: ExerciseSession = {
          id: doc.id,
          userId: data['userId'],
          exerciseName: data['exerciseName'],
          sessionNumber: data['sessionNumber'],
          errorsDetected: data['errorsDetected'] || 0,
          timestamp: data['timestamp']?.toDate() || new Date(),
          weekId: data['weekId']
        };

        if (!exerciseMap.has(session.exerciseName)) {
          exerciseMap.set(session.exerciseName, []);
        }
        exerciseMap.get(session.exerciseName)!.push(session);
      });

      let totalErrorsReduced = 0;
      let exercisesImproved = 0;

      exerciseMap.forEach(sessions => {
        sessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
        const session1 = sessions.find(s => s.sessionNumber === 1);
        const session2 = sessions.find(s => s.sessionNumber === 2);

        if (session1 && session2) {
          const reduction = session1.errorsDetected - session2.errorsDetected;
          if (reduction > 0) {
            totalErrorsReduced += reduction;
            exercisesImproved++;
          }
        }
      });

      // Actualizar o crear documento de resumen semanal
      const weeklyDocId = `${userId}_${weekId}`;
      await this.db.collection('weeklyErrorReduction').doc(weeklyDocId).set({
        userId,
        weekId,
        totalErrorsReduced,
        exercisesImproved,
        lastUpdated: firebase.firestore.Timestamp.now()
      }, { merge: true });

    } catch (error) {
      console.error('❌ Error actualizando resumen semanal:', error);
      throw error;
    }
  }
}
