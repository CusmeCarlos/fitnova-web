// src/app/core/alert.service.ts
// 🚨 ALERT SERVICE SIMPLIFICADO - SIN CONSULTAS COMPLEJAS

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// ✅ USAR MISMAS INTERFACES QUE TU DASHBOARD SERVICE
import { CriticalAlert, UserStats } from './dashboard.service';

// ✅ INTERFACES ADICIONALES PARA ALERTAS
export interface AlertFilter {
  severity?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  errorType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  assignedTrainer?: string;
  status?: 'unread' | 'read' | 'resolved' | 'all';
}

export interface AlertMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  unreadAlerts: number;
  resolvedAlerts: number;
  alertsToday: number;
  alertsThisWeek: number;
  mostCommonError: string;
  mostAffectedUser: string;
  averageSeverity: number;
  responseTime: number; // minutos promedio de respuesta
}

export interface AlertDetail extends CriticalAlert {
  userDisplayName: string;
  userEmail: string;
  assignedTrainerName?: string;
  status: 'unread' | 'read' | 'resolved';
  readAt?: Date;
  readBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  trainerNotes?: string;
  followUpRequired?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<AlertDetail[]>([]);
  private filteredAlertsSubject = new BehaviorSubject<AlertDetail[]>([]);
  private alertMetricsSubject = new BehaviorSubject<AlertMetrics | null>(null);
  private currentFilterSubject = new BehaviorSubject<AlertFilter>({ severity: 'all', status: 'all' });
  private usersMapSubject = new BehaviorSubject<Map<string, UserStats>>(new Map());
  
  public alerts$ = this.alertsSubject.asObservable();
  public filteredAlerts$ = this.filteredAlertsSubject.asObservable();
  public alertMetrics$ = this.alertMetricsSubject.asObservable();
  public currentFilter$ = this.currentFilterSubject.asObservable();
  
  private db = firebase.firestore();
  private storage = firebase.storage();

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.initializeService();
  }

  private initializeService(): void {
    // Cargar usuarios para nombres
    this.loadUsersMap();
    
    // Listener principal de alertas - SIMPLIFICADO
    this.auth.user$.subscribe(currentUser => {
      if (currentUser && ['trainer', 'admin'].includes(currentUser.role)) {
        this.loadCriticalAlertsSimplified(currentUser);
      } else {
        this.resetAlerts();
      }
    });

    // Aplicar filtros automáticamente
    this.setupFilteredAlerts();
  }

  // ✅ CARGAR MAPA DE USUARIOS PARA NOMBRES
  private loadUsersMap(): void {
    this.db.collection('users')
      .where('role', '==', 'user')
      .onSnapshot((snapshot) => {
        const usersMap = new Map<string, UserStats>();
        
        snapshot.docs.forEach(doc => {
          const userData = doc.data();
          usersMap.set(doc.id, {
            uid: doc.id,
            displayName: userData['displayName'] || 'Usuario desconocido',
            email: userData['email'] || '',
            assignedTrainer: userData['assignedTrainer'] || '',
            ...userData
          } as UserStats);
        });
        
        this.usersMapSubject.next(usersMap);
      });
  }

 // ✅ CARGAR ALERTAS CRÍTICAS REALES - SIN DATOS DE EJEMPLO
private loadCriticalAlertsSimplified(currentUser: any): void {
  try {
    console.log('🚨 Cargando alertas críticas REALES desde Firebase...');
    
    // NOTA: Cambiar 'criticalAlerts' por el nombre correcto según tu app móvil
    // Opciones: 'criticalAlerts', 'critical-errors', o 'criticalErrors'
    // Verificar en Firebase Console cual está siendo usada
    
    this.db.collection('criticalAlerts') // ← VERIFICAR NOMBRE EN FIREBASE
      .orderBy('timestamp', 'desc') // Usar timestamp en lugar de processedAt
      .onSnapshot((snapshot) => {
        const usersMap = this.usersMapSubject.getValue();
        let alerts: AlertDetail[] = [];
        
        console.log(`📥 Recibidos ${snapshot.docs.length} documentos de Firebase`);
        
        if (snapshot.docs.length === 0) {
          console.log('📭 No hay alertas críticas en Firebase aún');
        }
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const user = usersMap.get(data['uid']);
          
          console.log('📄 Documento encontrado:', {
            id: doc.id,
            uid: data['uid'],
            errorType: data['errorType'],
            captureURL: data['captureURL'] ? 'SÍ' : 'NO'
          });
          
          // FILTRAR POR TRAINER si aplica
          if (currentUser.role === 'trainer') {
            if (user?.assignedTrainer !== currentUser.uid) {
              console.log(`⏭️ Saltando alerta de usuario no asignado: ${data['uid']}`);
              return;
            }
          }
          
          // MAPEAR DATOS REALES DE FIREBASE
          const alert: AlertDetail = {
            id: doc.id,
            uid: data['uid'] || '',
            userDisplayName: user?.displayName || data['userDisplayName'] || `Usuario ${data['uid']?.substring(0, 8)}`,
            userEmail: user?.email || data['userEmail'] || '',
            assignedTrainerName: user?.assignedTrainer || '',
            errorType: data['errorType'] || 'unknown',
            exercise: data['exercise'] || data['exerciseType'] || 'Ejercicio',
            severity: data['severity'] || 'medium',
            confidence: data['confidence'] || 0,
            timestamp: data['timestamp']?.toDate() || data['processedAt']?.toDate() || new Date(),
            processedAt: data['processedAt']?.toDate() || data['timestamp']?.toDate() || new Date(),
            biomechanicsData: data['biomechanicsData'] || {},
            affectedJoints: data['affectedJoints'] || [],
            angles: data['angles'] || {},
            captureURL: data['captureURL'] || '', // ← CLAVE: URL real de Firebase Storage
            lastSessionId: data['lastSessionId'] || data['sessionId'],
            status: data['status'] || 'unread',
            readAt: data['readAt']?.toDate(),
            readBy: data['readBy'],
            resolvedAt: data['resolvedAt']?.toDate(),
            resolvedBy: data['resolvedBy'],
            trainerNotes: data['trainerNotes'],
            followUpRequired: data['followUpRequired'] || false
          };
          
          alerts.push(alert);
        });
        
        console.log(`✅ ${alerts.length} alertas críticas procesadas`);
        console.log(`📸 ${alerts.filter(a => a.captureURL).length} alertas CON capturas`);
        console.log(`📭 ${alerts.filter(a => !a.captureURL).length} alertas SIN capturas`);
        
        this.alertsSubject.next(alerts);
        this.calculateAlertMetrics(alerts);
      }, (error) => {
        console.error('❌ Error cargando alertas desde Firebase:', error);
        console.error('🔍 Posible causa: Nombre de colección incorrecto o reglas de Firestore');
        // Si hay error, mostrar lista vacía (no datos de ejemplo)
        this.alertsSubject.next([]);
        this.calculateAlertMetrics([]);
      });
      
  } catch (error) {
    console.error('❌ Error configurando listener de alertas:', error);
    this.alertsSubject.next([]);
    this.calculateAlertMetrics([]);
  }
}


  // ✅ SETUP DE FILTROS AUTOMÁTICOS
  private setupFilteredAlerts(): void {
    combineLatest([
      this.alerts$,
      this.currentFilter$
    ]).pipe(
      map(([alerts, filter]) => this.applyFilters(alerts, filter))
    ).subscribe(filtered => {
      this.filteredAlertsSubject.next(filtered);
    });
  }

  // ✅ APLICAR FILTROS
  private applyFilters(alerts: AlertDetail[], filter: AlertFilter): AlertDetail[] {
    let filtered = [...alerts];

    // Filtrar por severidad
    if (filter.severity && filter.severity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filter.severity);
    }

    // Filtrar por tipo de error
    if (filter.errorType) {
      filtered = filtered.filter(alert => alert.errorType === filter.errorType);
    }

    // Filtrar por estado
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(alert => alert.status === filter.status);
    }

    // Filtrar por usuario
    if (filter.userId) {
      filtered = filtered.filter(alert => alert.uid === filter.userId);
    }

    // Filtrar por rango de fechas
    if (filter.dateRange) {
      filtered = filtered.filter(alert => 
        alert.processedAt >= filter.dateRange!.start &&
        alert.processedAt <= filter.dateRange!.end
      );
    }

    return filtered;
  }

  // ✅ CALCULAR MÉTRICAS DE ALERTAS
  private calculateAlertMetrics(alerts: AlertDetail[]): void {
    if (alerts.length === 0) {
      // Métricas de ejemplo cuando no hay datos
      this.alertMetricsSubject.next({
        totalAlerts: 0,
        criticalAlerts: 0,
        highAlerts: 0,
        mediumAlerts: 0,
        lowAlerts: 0,
        unreadAlerts: 0,
        resolvedAlerts: 0,
        alertsToday: 0,
        alertsThisWeek: 0,
        mostCommonError: 'Ninguno',
        mostAffectedUser: 'Ninguno',
        averageSeverity: 0,
        responseTime: 0
      });
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics: AlertMetrics = {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      highAlerts: alerts.filter(a => a.severity === 'high').length,
      mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
      lowAlerts: alerts.filter(a => a.severity === 'low').length,
      unreadAlerts: alerts.filter(a => a.status === 'unread').length,
      resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
      alertsToday: alerts.filter(a => a.processedAt >= today).length,
      alertsThisWeek: alerts.filter(a => a.processedAt >= weekAgo).length,
      mostCommonError: this.getMostCommonError(alerts),
      mostAffectedUser: this.getMostAffectedUser(alerts),
      averageSeverity: this.calculateAverageSeverity(alerts),
      responseTime: this.calculateAverageResponseTime(alerts)
    };

    this.alertMetricsSubject.next(metrics);
  }

  // ✅ MÉTODOS PÚBLICOS PARA COMPONENTES

  // Aplicar filtro
  applyFilter(filter: Partial<AlertFilter>): void {
    const currentFilter = this.currentFilterSubject.getValue();
    const newFilter = { ...currentFilter, ...filter };
    this.currentFilterSubject.next(newFilter);
  }

  // Limpiar filtros
  clearFilters(): void {
    this.currentFilterSubject.next({ severity: 'all', status: 'all' });
  }

  // Marcar alerta como leída
  async markAsRead(alertId: string): Promise<boolean> {
    try {
      const currentUser = await this.auth.getCurrentUserAsync();
      if (!currentUser) return false;

      await this.db.collection('criticalAlerts').doc(alertId).update({
        status: 'read',
        readAt: new Date(),
        readBy: currentUser.uid
      });

      this.snackBar.open('Alerta marcada como leída', 'Cerrar', { duration: 3000 });
      return true;
    } catch (error) {
      console.error('❌ Error marcando alerta como leída:', error);
      this.snackBar.open('Error al marcar alerta', 'Cerrar', { duration: 3000 });
      return false;
    }
  }

  // Resolver alerta
  async resolveAlert(alertId: string, notes?: string): Promise<boolean> {
    try {
      const currentUser = await this.auth.getCurrentUserAsync();
      if (!currentUser) return false;

      const updateData: any = {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: currentUser.uid
      };

      if (notes) {
        updateData.trainerNotes = notes;
      }

      await this.db.collection('criticalAlerts').doc(alertId).update(updateData);

      this.snackBar.open('Alerta resuelta correctamente', 'Cerrar', { duration: 3000 });
      return true;
    } catch (error) {
      console.error('❌ Error resolviendo alerta:', error);
      this.snackBar.open('Error al resolver alerta', 'Cerrar', { duration: 3000 });
      return false;
    }
  }

  // Obtener imagen de captura
  async getCaptureImage(captureURL: string): Promise<string | null> {
    try {
      if (!captureURL) return null;
      
      const url = await this.storage.refFromURL(captureURL).getDownloadURL();
      return url;
    } catch (error) {
      console.error('❌ Error obteniendo imagen:', error);
      return null;
    }
  }

  // ✅ MÉTODOS AUXILIARES PRIVADOS

  private getMostCommonError(alerts: AlertDetail[]): string {
    const errorCounts = alerts.reduce((acc, alert) => {
      acc[alert.errorType] = (acc[alert.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(errorCounts);
    if (entries.length === 0) return 'Ninguno';
    
    entries.sort((a, b) => b[1] - a[1]);
    return this.getErrorTypeLabel(entries[0][0]);
  }

  private getMostAffectedUser(alerts: AlertDetail[]): string {
    const userCounts = alerts.reduce((acc, alert) => {
      acc[alert.uid] = (acc[alert.uid] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(userCounts);
    if (entries.length === 0) return 'Ninguno';
    
    entries.sort((a, b) => b[1] - a[1]);
    const userId = entries[0][0];
    const user = this.usersMapSubject.getValue().get(userId);
    return user?.displayName || 'Usuario desconocido';
  }

  private calculateAverageSeverity(alerts: AlertDetail[]): number {
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const total = alerts.reduce((sum, alert) => sum + (severityWeights[alert.severity] || 0), 0);
    return alerts.length > 0 ? Math.round((total / alerts.length) * 100) / 100 : 0;
  }

  private calculateAverageResponseTime(alerts: AlertDetail[]): number {
    const respondedAlerts = alerts.filter(a => a.readAt);
    if (respondedAlerts.length === 0) return 0;

    const totalTime = respondedAlerts.reduce((sum, alert) => {
      if (alert.readAt) {
        return sum + (alert.readAt.getTime() - alert.processedAt.getTime());
      }
      return sum;
    }, 0);

    return Math.round(totalTime / (respondedAlerts.length * 60000)); // minutos
  }

  private getErrorTypeLabel(errorType: string): string {
    const labels: Record<string, string> = {
      'knee_valgus': 'Valgo de rodilla',
      'knee_cave': 'Colapso de rodilla', 
      'forward_head': 'Cabeza adelantada',
      'rounded_shoulders': 'Hombros redondeados',
      'anterior_pelvic_tilt': 'Inclinación pélvica anterior',
      'posterior_pelvic_tilt': 'Inclinación pélvica posterior',
      'excessive_lumbar_extension': 'Hiperextensión lumbar',
      'excessive_lumbar_flexion': 'Flexión lumbar excesiva'
    };

    return labels[errorType] || errorType;
  }

  private resetAlerts(): void {
    this.alertsSubject.next([]);
    this.filteredAlertsSubject.next([]);
    this.alertMetricsSubject.next(null);
  }
}