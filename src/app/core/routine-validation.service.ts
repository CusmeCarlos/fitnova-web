// src/app/core/routine-validation.service.ts
// 🤖 ROUTINE VALIDATION SERVICE - PARA TRAINERS VALIDAR RUTINAS IA

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// ✅ USAR MISMAS INTERFACES QUE TU MOBILE
export interface AIGeneratedRoutine {
  id: string;
  uid: string;
  userId?: string; // Para compatibilidad
  generatedAt: any;
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
  approvedAt?: any;
  rejectionReason?: string;
  aiConfidence?: number;
  needsTrainerApproval?: boolean;
  adaptationLevel?: string;
  userDisplayName?: string;
  userEmail?: string;
}

export interface RoutineValidationFilter {
  status?: 'pending_approval' | 'approved' | 'rejected' | 'all';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  assignedTrainer?: string;
  adaptationLevel?: 'low' | 'medium' | 'high' | 'all';
  searchTerm?: string;
}

export interface ValidationMetrics {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageApprovalTime: number; // minutos
  mostCommonRejectionReason: string;
  routinesToday: number;
  routinesThisWeek: number;
  averageAIConfidence: number;
  adaptationDistribution: { [key: string]: number };
  trainerStats: {
    [trainerId: string]: {
      name: string;
      approved: number;
      rejected: number;
      averageTime: number;
    };
  };
}

export interface RoutineValidationAction {
  routineId: string;
  action: 'approve' | 'reject' | 'modify';
  trainerNotes?: string;
  rejectionReason?: string;
  modifications?: any;
  trainerId: string;
  trainerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoutineValidationService {
  private db = firebase.firestore();
  
  // ✅ SUBJECTS PARA DATOS REACTIVOS
  private routinesSubject = new BehaviorSubject<AIGeneratedRoutine[]>([]);
  private metricsSubject = new BehaviorSubject<ValidationMetrics | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  // ✅ OBSERVABLES PÚBLICOS
  public routines$ = this.routinesSubject.asObservable();
  public metrics$ = this.metricsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.initializeService();
  }

  private initializeService(): void {
    // Cargar datos cuando hay usuario autenticado
    this.auth.user$.subscribe(user => {
      if (user?.uid) {
        this.loadPendingRoutines();
        this.loadValidationMetrics();
      } else {
        this.routinesSubject.next([]);
        this.metricsSubject.next(null);
      }
    });
  }

  // ✅ CARGAR RUTINAS PENDIENTES - CON FALLBACK PARA ERRORES DE ÍNDICE
  async loadPendingRoutines(filter?: RoutineValidationFilter): Promise<void> {
    try {
      this.loadingSubject.next(true);
      console.log('🔍 Cargando rutinas pendientes con filtro:', filter);

      // ✅ USAR CONSULTA SIMPLE PRIMERO (FALLBACK)
      let routines: AIGeneratedRoutine[] = [];
      
      try {
        // Intenta consulta compleja primero
        routines = await this.loadRoutinesWithComplexQuery(filter);
      } catch (indexError) {
        console.warn('⚠️ Error con consulta compleja, usando fallback simple:', (indexError as Error).message);
        // Fallback a consulta simple
        routines = await this.loadRoutinesWithSimpleQuery(filter);
      }

      console.log(`✅ Cargadas ${routines.length} rutinas`);
      this.routinesSubject.next(routines);

    } catch (error) {
      console.error('❌ Error cargando rutinas:', error);
      this.showError('Error cargando rutinas pendientes. Verifica que los índices de Firebase estén creados.');
      this.routinesSubject.next([]);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  // ✅ CONSULTA COMPLEJA (REQUIERE ÍNDICES)
  private async loadRoutinesWithComplexQuery(filter?: RoutineValidationFilter): Promise<AIGeneratedRoutine[]> {
    let query: firebase.firestore.Query = this.db.collectionGroup('routines');

    // Aplicar filtros
    if (filter?.status && filter.status !== 'all') {
      query = query.where('status', '==', filter.status);
    } else {
      query = query.where('status', '==', 'pending_approval');
    }

    if (filter?.difficulty && filter.difficulty !== 'all') {
      query = query.where('routine.difficulty', '==', filter.difficulty);
    }

    if (filter?.adaptationLevel && filter.adaptationLevel !== 'all') {
      query = query.where('adaptationLevel', '==', filter.adaptationLevel);
    }

    if (filter?.dateRange) {
      query = query.where('generatedAt', '>=', filter.dateRange.start)
                   .where('generatedAt', '<=', filter.dateRange.end);
    }

    query = query.orderBy('generatedAt', 'desc').limit(50);
    
    const snapshot = await query.get();
    return await this.processQueryResults(snapshot, filter);
  }

  // ✅ CONSULTA SIMPLE (SIN ÍNDICES COMPLEJOS)
  private async loadRoutinesWithSimpleQuery(filter?: RoutineValidationFilter): Promise<AIGeneratedRoutine[]> {
    // Solo buscar rutinas pendientes sin filtros adicionales
    const query = this.db.collectionGroup('routines')
      .where('status', '==', 'pending_approval')
      .limit(50);
    
    const snapshot = await query.get();
    return await this.processQueryResults(snapshot, filter);
  }

  // ✅ PROCESAR RESULTADOS DE CONSULTA
  private async processQueryResults(snapshot: firebase.firestore.QuerySnapshot, filter?: RoutineValidationFilter): Promise<AIGeneratedRoutine[]> {
    const routines: AIGeneratedRoutine[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // ✅ OBTENER DATOS DEL USUARIO
      let userDisplayName = 'Usuario Desconocido';
      let userEmail = '';
      
      try {
        const userDoc = await this.db.collection('users').doc(data['uid']).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userDisplayName = userData?.['displayName'] || userData?.['email'] || 'Usuario';
          userEmail = userData?.['email'] || '';
        }
      } catch (error) {
        console.warn('Error obteniendo datos de usuario:', error);
      }

      const routine: AIGeneratedRoutine = {
        id: doc.id,
        uid: data['uid'] || data['userId'], // Fallback si uid no existe
        userId: data['uid'] || data['userId'], // Para compatibilidad
        generatedAt: data['generatedAt'],
        baseProfile: data['baseProfile'] || {},
        routine: data['routine'] || {},
        status: data['status'] || 'pending_approval',
        trainerNotes: data['trainerNotes'],
        approvedBy: data['approvedBy'],
        approvedAt: data['approvedAt'],
        rejectionReason: data['rejectionReason'],
        aiConfidence: data['aiConfidence'] || 0,
        needsTrainerApproval: data['needsTrainerApproval'],
        adaptationLevel: data['adaptationLevel'] || 'medium',
        userDisplayName,
        userEmail
      };

      // ✅ APLICAR FILTROS LOCALMENTE SI ES NECESARIO
      if (this.passesLocalFilters(routine, filter)) {
        routines.push(routine);
      }
    }

    return routines;
  }

  // ✅ FILTROS LOCALES
  private passesLocalFilters(routine: AIGeneratedRoutine, filter?: RoutineValidationFilter): boolean {
    if (!filter) return true;

    // Filtro de búsqueda
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      const matchesSearch = 
        routine.userDisplayName?.toLowerCase().includes(searchTerm) ||
        routine.userEmail?.toLowerCase().includes(searchTerm) ||
        routine.routine.name?.toLowerCase().includes(searchTerm) ||
        routine.routine.description?.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) return false;
    }

    // Filtro de dificultad (si no se aplicó en la consulta)
    if (filter.difficulty && filter.difficulty !== 'all' && routine.routine.difficulty !== filter.difficulty) {
      return false;
    }

    // Filtro de adaptación (si no se aplicó en la consulta)
    if (filter.adaptationLevel && filter.adaptationLevel !== 'all' && routine.adaptationLevel !== filter.adaptationLevel) {
      return false;
    }

    return true;
  }

  // ✅ APROBAR RUTINA
  async approveRoutine(action: RoutineValidationAction): Promise<boolean> {
    try {
      console.log('✅ Aprobando rutina:', action.routineId);

      // Buscar el documento en la colección correcta
      const routineRef = await this.findRoutineDocument(action.routineId);
      if (!routineRef) {
        throw new Error('Rutina no encontrada');
      }

      const updateData = {
        status: 'approved',
        approvedBy: action.trainerId,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        trainerNotes: action.trainerNotes || '',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      await routineRef.update(updateData);

      // ✅ CREAR NOTIFICACIÓN AL USUARIO
      await this.createUserNotification(action.routineId, 'approved', action.trainerNotes);

      this.showSuccess('Rutina aprobada exitosamente');
      
      // Recargar rutinas
      await this.loadPendingRoutines();
      
      return true;

    } catch (error) {
      console.error('❌ Error aprobando rutina:', error);
      this.showError('Error aprobando rutina');
      return false;
    }
  }

  // ✅ RECHAZAR RUTINA
  async rejectRoutine(action: RoutineValidationAction): Promise<boolean> {
    try {
      console.log('❌ Rechazando rutina:', action.routineId);

      const routineRef = await this.findRoutineDocument(action.routineId);
      if (!routineRef) {
        throw new Error('Rutina no encontrada');
      }

      const updateData = {
        status: 'rejected',
        rejectedBy: action.trainerId,
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
        rejectionReason: action.rejectionReason || 'No especificado',
        trainerNotes: action.trainerNotes || '',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      await routineRef.update(updateData);

      // ✅ CREAR NOTIFICACIÓN AL USUARIO
      await this.createUserNotification(action.routineId, 'rejected', action.rejectionReason);

      this.showSuccess('Rutina rechazada');
      
      // Recargar rutinas
      await this.loadPendingRoutines();
      
      return true;

    } catch (error) {
      console.error('❌ Error rechazando rutina:', error);
      this.showError('Error rechazando rutina');
      return false;
    }
  }

  // ✅ BUSCAR DOCUMENTO DE RUTINA - CORREGIDO
  private async findRoutineDocument(routineId: string): Promise<firebase.firestore.DocumentReference | null> {
    try {
      console.log('🔍 Buscando rutina con ID:', routineId);

      // ✅ NUEVA ESTRATEGIA: Buscar usando la rutina cargada en memoria
      const currentRoutines = this.routinesSubject.value;
      const targetRoutine = currentRoutines.find(r => r.id === routineId);
      
      if (!targetRoutine) {
        console.error('❌ Rutina no encontrada en las rutinas cargadas:', routineId);
        return null;
      }

      // ✅ CONSTRUIR REFERENCIA CORRECTA USANDO UID
      const routineRef = this.db.collection('aiRoutines')
        .doc(targetRoutine.uid)
        .collection('routines')
        .doc(routineId);

      // Verificar que existe
      const doc = await routineRef.get();
      if (!doc.exists) {
        console.error('❌ Documento no existe en la ruta construida');
        return null;
      }

      console.log('✅ Rutina encontrada correctamente');
      return routineRef;

    } catch (error) {
      console.error('❌ Error buscando rutina:', error);
      return null;
    }
  }

  // ✅ CREAR NOTIFICACIÓN AL USUARIO
  private async createUserNotification(routineId: string, status: string, message?: string): Promise<void> {
    try {
      const notification = {
        type: 'routine_validation',
        title: status === 'approved' ? 'Rutina Aprobada' : 'Rutina Rechazada',
        message: status === 'approved' 
          ? '¡Tu rutina IA ha sido aprobada y está lista para usar!'
          : `Tu rutina fue rechazada: ${message}`,
        routineId: routineId,
        status: status,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };

      // Buscar el uid del usuario desde la rutina
      const routineRef = await this.findRoutineDocument(routineId);
      if (routineRef) {
        const routineDoc = await routineRef.get();
        const routineData = routineDoc.data();
        
        if (routineData?.['uid']) {
          await this.db.collection('users')
            .doc(routineData['uid'])
            .collection('notifications')
            .add(notification);
            
          console.log('✅ Notificación creada para usuario:', routineData['uid']);
        }
      }
    } catch (error) {
      console.error('Error creando notificación:', error);
    }
  }

  // ✅ CARGAR MÉTRICAS DE VALIDACIÓN - SIMPLIFICADAS
  async loadValidationMetrics(): Promise<void> {
    try {
      console.log('📊 Cargando métricas de validación...');

      // ✅ USAR CONSULTAS SIMPLES PARA EVITAR PROBLEMAS DE ÍNDICES
      const metrics: ValidationMetrics = {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        averageApprovalTime: 0,
        mostCommonRejectionReason: 'Ejercicios inadecuados',
        routinesToday: 0,
        routinesThisWeek: 0,
        averageAIConfidence: 0,
        adaptationDistribution: {},
        trainerStats: {}
      };

      try {
        // Consulta simple para pendientes
        const pendingQuery = await this.db.collectionGroup('routines')
          .where('status', '==', 'pending_approval')
          .limit(100)
          .get();
        
        metrics.totalPending = pendingQuery.size;

        // Consulta simple para aprobadas
        const approvedQuery = await this.db.collectionGroup('routines')
          .where('status', '==', 'approved')
          .limit(100)
          .get();
        
        metrics.totalApproved = approvedQuery.size;

        // Consulta simple para rechazadas
        const rejectedQuery = await this.db.collectionGroup('routines')
          .where('status', '==', 'rejected')
          .limit(100)
          .get();
        
        metrics.totalRejected = rejectedQuery.size;

        // Calcular métricas adicionales si hay datos
        if (approvedQuery.size > 0) {
          let totalApprovalTime = 0;
          let totalAIConfidence = 0;
          let confidenceCount = 0;

          approvedQuery.docs.forEach(doc => {
            const data = doc.data();
            if (data['generatedAt'] && data['approvedAt']) {
              const generatedTime = data['generatedAt'].toDate();
              const approvedTime = data['approvedAt'].toDate();
              totalApprovalTime += (approvedTime.getTime() - generatedTime.getTime());
            }
            
            if (data['aiConfidence']) {
              totalAIConfidence += data['aiConfidence'];
              confidenceCount++;
            }
          });

          if (approvedQuery.size > 0) {
            metrics.averageApprovalTime = Math.round(totalApprovalTime / approvedQuery.size / (1000 * 60));
          }

          if (confidenceCount > 0) {
            metrics.averageAIConfidence = Math.round(totalAIConfidence / confidenceCount);
          }
        }

        console.log('✅ Métricas calculadas:', metrics);

      } catch (queryError) {
        console.warn('⚠️ Error en consultas de métricas, usando valores por defecto:', (queryError as Error).message);
        // Mantener métricas por defecto
      }

      this.metricsSubject.next(metrics);

    } catch (error) {
      console.error('❌ Error cargando métricas:', error);
      // Métricas por defecto en caso de error
      const defaultMetrics: ValidationMetrics = {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        averageApprovalTime: 0,
        mostCommonRejectionReason: 'Sin datos',
        routinesToday: 0,
        routinesThisWeek: 0,
        averageAIConfidence: 0,
        adaptationDistribution: {},
        trainerStats: {}
      };
      this.metricsSubject.next(defaultMetrics);
    }
  }

  // ✅ OBTENER RUTINA POR ID
  async getRoutineById(routineId: string): Promise<AIGeneratedRoutine | null> {
    try {
      const routineRef = await this.findRoutineDocument(routineId);
      if (!routineRef) return null;

      const doc = await routineRef.get();
      if (!doc.exists) return null;

      const data = doc.data()!;
      return {
        id: doc.id,
        uid: data['uid'],
        userId: data['uid'],
        generatedAt: data['generatedAt'],
        baseProfile: data['baseProfile'] || {},
        routine: data['routine'] || {},
        status: data['status'] || 'pending_approval',
        trainerNotes: data['trainerNotes'],
        approvedBy: data['approvedBy'],
        approvedAt: data['approvedAt'],
        rejectionReason: data['rejectionReason'],
        aiConfidence: data['aiConfidence'] || 0,
        needsTrainerApproval: data['needsTrainerApproval'],
        adaptationLevel: data['adaptationLevel'] || 'medium'
      };
    } catch (error) {
      console.error('Error obteniendo rutina:', error);
      return null;
    }
  }

  // ✅ UTILIDADES
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // ✅ MÉTODOS PÚBLICOS ADICIONALES
  getCurrentRoutines(): AIGeneratedRoutine[] {
    return this.routinesSubject.value;
  }

  getCurrentMetrics(): ValidationMetrics | null {
    return this.metricsSubject.value;
  }

  async refreshData(): Promise<void> {
    await Promise.all([
      this.loadPendingRoutines(),
      this.loadValidationMetrics()
    ]);
  }

  // ✅ FILTROS PREDEFINIDOS
  async loadAllRoutines(): Promise<void> {
    await this.loadPendingRoutines({ status: 'all' });
  }

  async loadApprovedRoutines(): Promise<void> {
    await this.loadPendingRoutines({ status: 'approved' });
  }

  async loadRejectedRoutines(): Promise<void> {
    await this.loadPendingRoutines({ status: 'rejected' });
  }
}