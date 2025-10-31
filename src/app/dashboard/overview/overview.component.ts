// src/app/dashboard/overview/overview.component.ts
// 📊 DASHBOARD GLOBAL - SUPERVISIÓN DE TODOS LOS USUARIOS

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DashboardService, GlobalDashboardMetrics, UserStats, UserDetailMetrics } from '../../core/dashboard.service';
import { ErrorReductionService } from '../../core/error-reduction.service';
import { WeeklyHistory, UserErrorReductionMetrics } from '../../interfaces/dashboard.interface';
import { User } from '../../interfaces/user.interface';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// ✅ MATERIAL DESIGN IMPORTS
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

// Registrar Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('globalActivityChart', { static: false }) globalActivityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('globalErrorsChart', { static: false }) globalErrorsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('userDetailChart', { static: false }) userDetailChartRef!: ElementRef<HTMLCanvasElement>;

  // ✅ DATOS GLOBALES DEL GIMNASIO
  currentUser: User | null = null;
  globalMetrics: GlobalDashboardMetrics | null = null;
  allUsers: UserStats[] = [];
  isLoading = true;
  lastUpdated: Date = new Date();

  // ✅ VISTA INDIVIDUAL DE USUARIO
  selectedUserId: string | null = null;
  selectedUserMetrics: UserDetailMetrics | null = null;
  isLoadingUserDetail = false;
  showUserDetail = false;

  // 🆕 REDUCCIÓN DE ERRORES
  selectedUserErrorMetrics: UserErrorReductionMetrics | null = null;
  weeklyHistory: WeeklyHistory | null = null;

  // ✅ CHARTS
  private globalActivityChart: Chart | null = null;
  private globalErrorsChart: Chart | null = null;
  private userDetailChart: Chart | null = null;

  // ✅ SUBSCRIPCIONES
  private subscriptions = new Subscription();

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService,
    private errorReductionService: ErrorReductionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('📊 Inicializando Dashboard Global de Supervisión...');
    this.loadCurrentUser();
    this.loadGlobalMetrics();
    this.loadAllUsers();
  }

  ngAfterViewInit() {
    console.log('📊 Vista Global inicializada, esperando datos...');
  }

  ngOnDestroy() {
    console.log('🧹 Limpiando Dashboard Global...');
    this.subscriptions.unsubscribe();
    this.destroyAllCharts();
  }

  // ✅ CARGAR USUARIO ACTUAL
  private loadCurrentUser(): void {
    const userSub = this.auth.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('👤 Usuario supervisor cargado:', user?.displayName, `(${user?.role})`);
      },
      error: (error) => {
        console.error('❌ Error cargando usuario:', error);
      }
    });

    this.subscriptions.add(userSub);
  }

  // ✅ CORREGIDO: CARGAR MÉTRICAS GLOBALES CON LISTENER TIEMPO REAL
  private loadGlobalMetrics(): void {
    this.isLoading = true;

    const metricsSub = this.dashboardService.getGlobalDashboardMetrics().subscribe({
      next: (metrics) => {
        console.log('📊 Métricas Globales actualizadas en tiempo real:', metrics);
        this.globalMetrics = metrics;
        this.isLoading = false;
        this.lastUpdated = new Date();
        
        // ✅ SOLO REINICIALIZAR GRÁFICOS GLOBALES SI NO ESTÁ EN VISTA DETALLADA
        if (!this.showUserDetail) {
          setTimeout(() => {
            this.initializeGlobalCharts();
          }, 100);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando métricas globales:', error);
        this.isLoading = false;
        this.showErrorMessage('Error cargando datos del dashboard global');
      }
    });

    this.subscriptions.add(metricsSub);
  }

  // ✅ CORREGIDO: CARGAR USUARIOS CON LISTENER TIEMPO REAL
  private loadAllUsers(): void {
    const usersSub = this.dashboardService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        console.log(`👥 Usuarios actualizados en tiempo real: ${users.length} usuarios`);
        
        // ✅ ACTUALIZAR ÚLTIMA FECHA DE SINCRONIZACIÓN
        this.lastUpdated = new Date();
      },
      error: (error) => {
        console.error('❌ Error cargando usuarios:', error);
      }
    });

    this.subscriptions.add(usersSub);
  }

  // ✅ INICIALIZAR GRÁFICOS GLOBALES
  private initializeGlobalCharts(): void {
    if (!this.globalMetrics || this.globalMetrics.isEmpty) {
      console.log('📊 Sin datos globales para gráficos');
      return;
    }

    console.log('📊 Inicializando gráficos globales...');
    this.destroyGlobalCharts();
    
    try {
      this.initGlobalActivityChart();
      this.initGlobalErrorsChart();
      console.log('✅ Gráficos globales inicializados correctamente');
    } catch (error) {
      console.error('❌ Error inicializando gráficos globales:', error);
    }
  }

  // ✅ GRÁFICO DE ACTIVIDAD GLOBAL
  private initGlobalActivityChart(): void {
    if (!this.globalActivityChartRef?.nativeElement || !this.globalMetrics) return;

    try {
      const ctx = this.globalActivityChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      this.globalActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.globalMetrics.dailyActivityGlobal.map(day => day.date),
          datasets: [
            {
              label: 'Usuarios Activos',
              data: this.globalMetrics.dailyActivityGlobal.map(day => day.users),
              backgroundColor: 'rgba(33, 150, 243, 0.6)',
              borderColor: '#2196f3',
              borderWidth: 1
            },
            {
              label: 'Total Entrenamientos',
              data: this.globalMetrics.dailyActivityGlobal.map(day => day.workouts),
              backgroundColor: 'rgba(76, 175, 80, 0.6)',
              borderColor: '#4caf50',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: { color: '#666' }
            },
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: { color: '#666' }
            }
          }
        }
      });

      console.log('📊 Gráfico de actividad global inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico de actividad global:', error);
    }
  }


  // ✅ GRÁFICO DE ERRORES GLOBALES
  private initGlobalErrorsChart(): void {
    if (!this.globalErrorsChartRef?.nativeElement || !this.globalMetrics) return;

    try {
      const ctx = this.globalErrorsChartRef.nativeElement.getContext('2d');
      if (!ctx) return;

      const errorTypes = Object.keys(this.globalMetrics.errorsByTypeGlobal);
      const errorCounts = Object.values(this.globalMetrics.errorsByTypeGlobal);

      this.globalErrorsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: errorTypes.map(type => this.getErrorTypeLabel(type)),
          datasets: [{
            data: errorCounts,
            backgroundColor: [
              '#f44336',
              '#ff9800',
              '#ff5722',
              '#e91e63',
              '#9c27b0',
              '#673ab7'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 15,
                color: '#666'
              }
            }
          }
        }
      });

      console.log('📊 Gráfico de errores globales inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico de errores globales:', error);
    }
  }

  // ✅ SELECCIONAR USUARIO PARA VISTA DETALLADA
  onUserSelected(userId: string): void {
    if (!userId) {
      this.hideUserDetail();
      return;
    }

    console.log('👤 Usuario seleccionado para detalle:', userId);
    this.selectedUserId = userId;
    this.isLoadingUserDetail = true;
    this.showUserDetail = true;

    // ✅ DESTRUIR GRÁFICOS GLOBALES AL MOSTRAR DETALLE
    this.destroyGlobalCharts();

    const userDetailSub = this.dashboardService.getUserDetailMetrics(userId).subscribe({
      next: (metrics) => {
        console.log('📊 Métricas del usuario cargadas:', metrics);
        this.selectedUserMetrics = metrics;

        // 🆕 Cargar métricas de reducción de errores
        this.loadUserErrorReductionMetrics(userId, metrics.userInfo.displayName || 'Usuario');

        this.isLoadingUserDetail = false;

        // Inicializar gráfico del usuario
        setTimeout(() => {
          this.initUserDetailChart();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error cargando métricas del usuario:', error);
        this.isLoadingUserDetail = false;
        this.showErrorMessage('Error cargando datos del usuario');
      }
    });

    this.subscriptions.add(userDetailSub);
  }

  // 🆕 CARGAR MÉTRICAS DE REDUCCIÓN DE ERRORES DEL USUARIO
  private loadUserErrorReductionMetrics(userId: string, displayName: string): void {
    console.log(`🔄 Iniciando carga de métricas de reducción para ${displayName} (${userId})`);

    const errorMetricsSub = this.errorReductionService.getUserErrorReductionMetrics(userId, displayName).subscribe({
      next: (metrics) => {
        console.log('✅ Métricas de reducción de errores recibidas:', {
          userId: metrics.userId,
          displayName: metrics.displayName,
          totalErrorsReduced: metrics.totalErrorsReducedAllTime,
          totalExercisesImproved: metrics.totalExercisesImprovedAllTime,
          currentWeekExercises: metrics.weeklyHistory.currentWeek.exercises.length,
          previousWeeks: metrics.weeklyHistory.previousWeeks.length
        });

        this.selectedUserErrorMetrics = metrics;
        this.weeklyHistory = metrics.weeklyHistory;

        console.log('📊 weeklyHistory asignado:', this.weeklyHistory);
      },
      error: (error) => {
        console.error('⚠️ Error cargando métricas de reducción de errores:', error);
        // No mostrar error al usuario, simplemente no mostrar la sección
        this.selectedUserErrorMetrics = null;
        this.weeklyHistory = null;
      }
    });

    this.subscriptions.add(errorMetricsSub);
  }

  // ✅ CORREGIDO: OCULTAR VISTA DETALLADA Y REINICIALIZAR GRÁFICOS GLOBALES
  hideUserDetail(): void {
    console.log('🔙 Ocultando vista detallada y reiniciando vista global...');

    this.showUserDetail = false;
    this.selectedUserId = null;
    this.selectedUserMetrics = null;
    this.selectedUserErrorMetrics = null; // 🆕 Limpiar métricas de error
    this.weeklyHistory = null; // 🆕 Limpiar historial
    this.destroyUserDetailChart();

    // ✅ REINICIALIZAR GRÁFICOS GLOBALES DESPUÉS DE CERRAR DETALLE
    setTimeout(() => {
      if (this.globalMetrics && !this.globalMetrics.isEmpty) {
        console.log('🔄 Reinicializando gráficos globales...');
        this.initializeGlobalCharts();
      }
    }, 200);
  }

  // ✅ GRÁFICO DETALLADO DE USUARIO
  private initUserDetailChart(): void {
    if (!this.userDetailChartRef?.nativeElement || !this.selectedUserMetrics) return;
  
    try {
      if (this.userDetailChart) {
        this.userDetailChart.destroy();
        this.userDetailChart = null;
      }
  
      const ctx = this.userDetailChartRef.nativeElement.getContext('2d');
      if (!ctx) return;
  
      this.userDetailChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.selectedUserMetrics.weeklyProgress.map(day => day.day),
          datasets: [
            {
              label: 'Entrenamientos',
              data: this.selectedUserMetrics.weeklyProgress.map(day => day.workouts),
              borderColor: '#2196f3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            },
            {
              label: 'Errores',
              data: this.selectedUserMetrics.weeklyProgress.map(day => day.errors),
              borderColor: '#f44336',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0, 0, 0, 0.1)' },
              ticks: { color: '#666' }
            },
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: { color: '#666' }
            }
          }
        }
      });
  
      console.log('📊 Gráfico detallado del usuario inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico del usuario:', error);
    }
  }

  // ✅ DESTRUIR GRÁFICOS
  private destroyAllCharts(): void {
    this.destroyGlobalCharts();
    this.destroyUserDetailChart();
  }

  private destroyGlobalCharts(): void {
    try {
      if (this.globalActivityChart) {
        this.globalActivityChart.destroy();
        this.globalActivityChart = null;
      }
      if (this.globalErrorsChart) {
        this.globalErrorsChart.destroy();
        this.globalErrorsChart = null;
      }
      console.log('🧹 Gráficos globales destruidos');
    } catch (error) {
      console.error('❌ Error limpiando gráficos globales:', error);
    }
  }

  private destroyUserDetailChart(): void {
    try {
      if (this.userDetailChart) {
        this.userDetailChart.destroy();
        this.userDetailChart = null;
      }
      console.log('🧹 Gráfico de usuario destruido');
    } catch (error) {
      console.error('❌ Error limpiando gráfico del usuario:', error);
    }
  }

  // ✅ REFRESH DASHBOARD GLOBAL
  async refreshDashboard(): Promise<void> {
    console.log('🔄 Refrescando dashboard global...');
    
    try {
      this.isLoading = true;
      
      // Los listeners ya están activos, solo necesitamos actualizar UI
      this.lastUpdated = new Date();
      
      setTimeout(() => {
        this.isLoading = false;
        this.showSuccessMessage('Dashboard actualizado');
      }, 500);
      
    } catch (error) {
      console.error('❌ Error refrescando dashboard global:', error);
      this.isLoading = false;
      this.showErrorMessage('Error refrescando datos globales');
    }
  }

  // ✅ MÉTODOS DE NAVEGACIÓN
  navigateToUserManagement(): void {
    console.log('👥 Navegando a gestión de usuarios...');
    this.router.navigate(['/users/user-list']);
  }

  navigateToRoutines(): void {
    console.log('📋 Navegando a rutinas...');
    this.router.navigate(['/routines']);
  }

  navigateToAlerts(): void {
    console.log('🚨 Navegando a alertas críticas...');
    this.router.navigate(['/alerts/dashboard']);
  }

  navigateToAnalytics(): void {
    console.log('📊 Navegando a analytics...');
    this.router.navigate(['/analytics/overview']);
  }

  // ✅ LOGOUT
  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      console.log('✅ Logout exitoso desde dashboard');
    } catch (error) {
      console.error('❌ Error en logout:', error);
      this.showErrorMessage('Error al cerrar sesión');
    }
  }

  // ✅ MÉTODOS AUXILIARES
  Math = Math; // Exponer Math para usar en template

  formatNumber(value: number | undefined): string {
    if (!value || value === 0) return '0';
    return value.toLocaleString('es-ES');
  }

  formatHours(hours: number): string {
    if (hours === 0) return '0h';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else {
      const wholeHours = Math.floor(hours);
      const remainingMinutes = Math.round((hours - wholeHours) * 60);
      return remainingMinutes > 0 ? `${wholeHours}h ${remainingMinutes}m` : `${wholeHours}h`;
    }
  }

  formatPercentage(value: number): string {
  console.log('🔍 Formateando precisión:', value, '→', Math.round(value || 0));
  return `${Math.round(value || 0)}%`;
}

  getErrorTypeLabel(errorType: string): string {
    const errorLabels: { [key: string]: string } = {
      'KNEE_VALGUS': 'Valgo de rodilla',
      'FORWARD_HEAD': 'Cabeza adelantada',
      'ROUNDED_SHOULDERS': 'Hombros redondeados',
      'EXCESSIVE_KNEE_FLEXION': 'Flexión excesiva',
      'INSUFFICIENT_DEPTH': 'Profundidad insuficiente',
      'FORWARD_LEAN': 'Inclinación adelante',
      'incorrect_form': 'Postura Incorrecta',
      'knee_alignment': 'Alineación Rodillas',
      'back_posture': 'Postura Espalda',
      'elbow_angle': 'Ángulo Codos',
      'shoulder_position': 'Posición Hombros',
      'hip_alignment': 'Alineación Cadera'
    };
    return errorLabels[errorType] || errorType;
  }

  getUserStatusColor(user: UserStats): string {
    if (!user.lastActiveAt) return 'warn';
    
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'primary'; // Hoy
    if (daysDiff <= 3) return 'accent';   // Últimos 3 días
    return 'warn'; // Más de 3 días
  }

  // ✅ MENSAJES
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}