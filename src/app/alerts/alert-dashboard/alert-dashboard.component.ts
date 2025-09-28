// src/app/alerts/alert-dashboard/alert-dashboard.component.ts
// 🚨 ALERT DASHBOARD ULTRA PREMIUM - FUNCIONALIDAD COMPLETA

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// ✅ SERVICIOS
import { AlertService, AlertDetail, AlertMetrics, AlertFilter } from '../../core/alert.service';
import { AuthService } from '../../core/auth.service';

// ✅ MATERIAL DESIGN
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Registrar Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatDividerModule,
    MatBadgeModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './alert-dashboard.component.html',
  styleUrls: ['./alert-dashboard.component.scss']
})
export class AlertDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // ✅ VIEW CHILDREN PARA GRÁFICOS Y TABLA
  @ViewChild('severityChart', { static: false }) severityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timelineChart', { static: false }) timelineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('errorTypesChart', { static: false }) errorTypesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ✅ DATOS DEL COMPONENTE
  alertMetrics: AlertMetrics | null = null;
  recentAlerts: AlertDetail[] = [];
  filteredAlerts: AlertDetail[] = [];
  currentFilter: AlertFilter = { severity: 'all', status: 'all' };
  isLoading = true;

  // ✅ FORMULARIOS Y FILTROS
  filterForm!: FormGroup;
  errorTypes: string[] = [];
  
  severityOptions = [
    { value: 'all', label: 'Todas las severidades', icon: 'tune' },
    { value: 'critical', label: 'Críticas', icon: 'error', color: '#ef4444' },
    { value: 'high', label: 'Altas', icon: 'warning', color: '#f59e0b' },
    { value: 'medium', label: 'Medias', icon: 'info', color: '#3b82f6' },
    { value: 'low', label: 'Bajas', icon: 'check_circle', color: '#10b981' }
  ];

  statusOptions = [
    { value: 'all', label: 'Todos los estados', icon: 'list' },
    { value: 'unread', label: 'Sin leer', icon: 'mark_email_unread', color: '#ef4444' },
    { value: 'read', label: 'Leídas', icon: 'mark_email_read', color: '#f59e0b' },
    { value: 'resolved', label: 'Resueltas', icon: 'check_circle', color: '#10b981' }
  ];

  // ✅ TABLA DE ALERTAS (REMOVIDA - AHORA USAMOS LISTA)
  // displayedColumns: string[] = ['severity', 'user', 'errorType', 'time', 'status', 'actions'];
  // dataSource = new MatTableDataSource<AlertDetail>();

  // ✅ GRÁFICOS
  private severityChart?: Chart;
  private timelineChart?: Chart;
  private errorTypesChart?: Chart;
  private subscriptions = new Subscription();

  constructor(
    private alertService: AlertService,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    console.log('🚨 Iniciando Alert Dashboard Premium...');
    this.setupSubscriptions();
  }

  ngAfterViewInit(): void {
    this.setupPaginator();
    // Inicializar gráficos después de que las vistas estén listas
    setTimeout(() => {
      this.initializeCharts();
    }, 1000);
  }

  ngOnDestroy(): void {
    console.log('🚨 Destruyendo Alert Dashboard...');
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  // ================================================================================
  // 🔧 CONFIGURACIÓN INICIAL
  // ================================================================================

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      severity: ['all'],
      status: ['all'],
      errorType: [''],
      dateStart: [''],
      dateEnd: [''],
      searchTerm: ['']
    });

    // Escuchar cambios en filtros con debounce
    this.filterForm.valueChanges.subscribe(values => {
      this.applyFilters(values);
    });
  }

  private setupSubscriptions(): void {
    console.log('🚨 Configurando suscripciones...');

    // Métricas de alertas
    this.subscriptions.add(
      this.alertService.alertMetrics$.subscribe(metrics => {
        console.log('📊 Métricas recibidas:', metrics);
        this.alertMetrics = metrics;
        this.isLoading = false;
        if (metrics) {
          setTimeout(() => this.updateCharts(), 100);
        }
      })
    );

    // Alertas filtradas
    this.subscriptions.add(
      this.alertService.filteredAlerts$.subscribe(alerts => {
        console.log('🔍 Alertas filtradas recibidas:', alerts.length);
        this.filteredAlerts = alerts;
        this.recentAlerts = alerts.slice(0, 10);
        this.extractErrorTypes(alerts);
        
        // Actualizar gráficos
        setTimeout(() => this.updateErrorTypesChart(), 100);
      })
    );

    // Filtro actual
    this.subscriptions.add(
      this.alertService.currentFilter$.subscribe(filter => {
        this.currentFilter = filter;
        this.updateFilterForm(filter);
      })
    );
  }

  private setupPaginator(): void {
    if (this.paginator) {
      // Configuración del paginador si es necesaria
      console.log('📄 Paginador configurado');
    }
  }

  // ================================================================================
  // 🔍 MANEJO DE FILTROS
  // ================================================================================

  private applyFilters(formValues: any): void {
    const filter: AlertFilter = {
      severity: formValues.severity,
      status: formValues.status,
      errorType: formValues.errorType || undefined
    };

    // Rango de fechas
    if (formValues.dateStart && formValues.dateEnd) {
      filter.dateRange = {
        start: new Date(formValues.dateStart),
        end: new Date(formValues.dateEnd)
      };
    }

    console.log('🔍 Aplicando filtros:', filter);
    this.alertService.applyFilter(filter);
  }

  private updateFilterForm(filter: AlertFilter): void {
    this.filterForm.patchValue({
      severity: filter.severity || 'all',
      status: filter.status || 'all',
      errorType: filter.errorType || '',
      dateStart: filter.dateRange?.start ? 
        this.formatDateForInput(filter.dateRange.start) : '',
      dateEnd: filter.dateRange?.end ? 
        this.formatDateForInput(filter.dateRange.end) : ''
    }, { emitEvent: false });
  }

  clearAllFilters(): void {
    console.log('🧹 Limpiando todos los filtros...');
    this.filterForm.reset({
      severity: 'all',
      status: 'all',
      errorType: '',
      dateStart: '',
      dateEnd: '',
      searchTerm: ''
    });
    this.alertService.clearFilters();
  }

  private extractErrorTypes(alerts: AlertDetail[]): void {
    const uniqueTypes = [...new Set(alerts.map(alert => alert.errorType))];
    this.errorTypes = uniqueTypes;
  }

  // ================================================================================
  // 🎬 ACCIONES DE ALERTAS
  // ================================================================================

  async markAsRead(alert: AlertDetail): Promise<void> {
    if (alert.status === 'read' || alert.status === 'resolved') {
      this.snackBar.open('La alerta ya fue procesada', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('📖 Marcando alerta como leída:', alert.id);
    const success = await this.alertService.markAsRead(alert.id);
    if (success) {
      this.snackBar.open('Alerta marcada como leída', 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  async resolveAlert(alert: AlertDetail): Promise<void> {
    if (alert.status === 'resolved') {
      this.snackBar.open('La alerta ya está resuelta', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('✅ Resolviendo alerta:', alert.id);
    const success = await this.alertService.resolveAlert(alert.id, 'Resuelta desde dashboard');
    if (success) {
      this.snackBar.open('Alerta resuelta exitosamente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  viewAlertDetail(alert: AlertDetail): void {
    console.log('👁️ Ver detalle de alerta:', alert.id);
    // TODO: Implementar modal de detalles de alerta
    this.snackBar.open('Modal de detalles próximamente', 'Cerrar', { duration: 3000 });
  }

  // ================================================================================
  // 🖼️ MANEJO DE CAPTURAS AUTOMÁTICAS
  // ================================================================================

  viewCaptureFullscreen(captureURL: string): void {
    // Buscar la alerta correspondiente para obtener datos adicionales
    const alert = this.filteredAlerts.find(a => a.captureURL === captureURL);
    
    console.log('🖼️ Abriendo captura en pantalla completa:', { captureURL, alert: alert?.id });
    
    // Crear modal fullscreen para ver la imagen con datos completos
    const dialogData = {
      imageUrl: captureURL,
      title: 'Captura de Error Crítico',
      subtitle: 'Imagen capturada automáticamente durante entrenamiento',
      errorType: alert?.errorType,
      exercise: alert?.exercise,
      timestamp: alert?.timestamp,
      confidence: alert?.confidence
    };

    // Importar dinámicamente el modal
    import('../../shared/components/image-fullscreen-modal/image-fullscreen-modal.component')
      .then(({ ImageFullscreenModalComponent }) => {
        const dialogRef = this.dialog.open(ImageFullscreenModalComponent, {
          data: dialogData,
          maxWidth: '95vw',
          maxHeight: '95vh',
          width: '95vw',
          height: '90vh',
          panelClass: 'image-modal-panel',
          disableClose: false,
          hasBackdrop: true,
          backdropClass: 'image-modal-backdrop'
        });

        dialogRef.afterClosed().subscribe(() => {
          console.log('🖼️ Modal de imagen cerrado');
        });
      })
      .catch(error => {
        console.error('❌ Error cargando modal de imagen:', error);
        // Fallback: abrir en nueva ventana
        window.open(captureURL, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        this.snackBar.open('Imagen abierta en nueva ventana', 'Cerrar', { duration: 2000 });
      });
  }

  onImageError(event: any): void {
    console.warn('⚠️ Error cargando imagen:', event.target.src);
    event.target.src = 'assets/images/image-not-found.png'; // Imagen placeholder
    event.target.alt = 'Imagen no disponible';
  }

  // ================================================================================
  // 📊 GRÁFICOS CON CHART.JS
  // ================================================================================

  private initializeCharts(): void {
    if (!this.alertMetrics) {
      console.warn('⚠️ No hay métricas para inicializar gráficos');
      return;
    }

    try {
      console.log('📊 Inicializando gráficos premium...');
      this.initSeverityChart();
      this.initTimelineChart();
      this.initErrorTypesChart();
    } catch (error) {
      console.error('❌ Error inicializando gráficos:', error);
    }
  }

  private initSeverityChart(): void {
    if (!this.severityChartRef?.nativeElement || !this.alertMetrics) {
      console.warn('⚠️ No se puede inicializar gráfico de severidad');
      return;
    }

    const ctx = this.severityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart('severity');

    const data = {
      labels: ['Críticas', 'Altas', 'Medias', 'Bajas'],
      datasets: [{
        data: [
          this.alertMetrics.criticalAlerts,
          this.alertMetrics.highAlerts,
          this.alertMetrics.mediumAlerts,
          this.alertMetrics.lowAlerts
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderColor: [
          '#ef4444',
          '#f59e0b',
          '#3b82f6',
          '#10b981'
        ],
        borderWidth: 2
      }]
    };

    this.severityChart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#f8fafc',
              font: {
                size: 12,
                weight: 'bold'
              },
              padding: 15
            }
          }
        }
      }
    });
  }

  private initTimelineChart(): void {
    if (!this.timelineChartRef?.nativeElement || !this.alertMetrics) {
      console.warn('⚠️ No se puede inicializar gráfico de timeline');
      return;
    }

    const ctx = this.timelineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart('timeline');

    // Datos de ejemplo para timeline (últimos 7 días)
    const labels = [];
    const alertsData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }));
      // Simular datos (en implementación real vendrían del servicio)
      alertsData.push(Math.floor(Math.random() * 10) + 1);
    }

    const data = {
      labels,
      datasets: [{
        label: 'Alertas por día',
        data: alertsData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };

    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#f8fafc',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: '#94a3b8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#94a3b8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          }
        }
      }
    });
  }

  private initErrorTypesChart(): void {
    if (!this.errorTypesChartRef?.nativeElement) {
      console.warn('⚠️ No se puede inicializar gráfico de tipos de error');
      return;
    }

    const ctx = this.errorTypesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart('errorTypes');

    // Contar tipos de errores
    const errorCounts = this.countErrorTypes();
    const labels = Object.keys(errorCounts).map(type => this.getErrorTypeLabel(type));
    const data = Object.values(errorCounts);

    const chartData = {
      labels,
      datasets: [{
        label: 'Frecuencia',
        data,
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          '#ef4444',
          '#f59e0b',
          '#3b82f6',
          '#10b981',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 2
      }]
    };

    this.errorTypesChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#94a3b8',
              stepSize: 1
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          x: {
            ticks: {
              color: '#94a3b8',
              maxRotation: 45
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          }
        }
      }
    });
  }

  private countErrorTypes(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    
    this.filteredAlerts.forEach(alert => {
      counts[alert.errorType] = (counts[alert.errorType] || 0) + 1;
    });

    return counts;
  }

  private updateCharts(): void {
    if (this.alertMetrics) {
      this.initSeverityChart();
      this.initTimelineChart();
    }
  }

  private updateErrorTypesChart(): void {
    this.initErrorTypesChart();
  }

  private destroyCharts(): void {
    this.destroyChart('severity');
    this.destroyChart('timeline');
    this.destroyChart('errorTypes');
  }

  private destroyChart(chartType: 'severity' | 'timeline' | 'errorTypes'): void {
    try {
      switch (chartType) {
        case 'severity':
          if (this.severityChart) {
            this.severityChart.destroy();
            this.severityChart = undefined;
          }
          break;
        case 'timeline':
          if (this.timelineChart) {
            this.timelineChart.destroy();
            this.timelineChart = undefined;
          }
          break;
        case 'errorTypes':
          if (this.errorTypesChart) {
            this.errorTypesChart.destroy();
            this.errorTypesChart = undefined;
          }
          break;
      }
    } catch (error) {
      console.warn(`⚠️ Error destruyendo gráfico ${chartType}:`, error);
    }
  }

  // ================================================================================
  // 🛠️ MÉTODOS UTILITARIOS
  // ================================================================================

  getSeverityColor(severity: string): string {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  }

  getSeverityIcon(severity: string): string {
    const icons = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'check_circle'
    };
    return icons[severity as keyof typeof icons] || 'help';
  }

  getStatusIcon(status: string): string {
    const icons = {
      unread: 'mark_email_unread',
      read: 'mark_email_read',
      resolved: 'check_circle'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  getStatusColor(status: string): string {
    const colors = {
      unread: '#ef4444',
      read: '#f59e0b',
      resolved: '#10b981'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  getStatusLabel(status: string): string {
    const labels = {
      unread: 'Sin leer',
      read: 'Leída',
      resolved: 'Resuelta'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getErrorTypeLabel(errorType: string): string {
    const labels: Record<string, string> = {
      'knee_valgus': 'Valgo de rodilla',
      'knee_cave': 'Colapso de rodilla', 
      'forward_head': 'Cabeza adelantada',
      'rounded_shoulders': 'Hombros redondeados',
      'anterior_pelvic_tilt': 'Inclinación pélvica anterior',
      'posterior_pelvic_tilt': 'Inclinación pélvica posterior',
      'excessive_lumbar_extension': 'Hiperextensión lumbar',
      'excessive_lumbar_flexion': 'Flexión lumbar excesiva',
      'knee_alignment': 'Alineación de rodilla',
      'hip_drop': 'Caída de cadera',
      'ankle_collapse': 'Colapso de tobillo'
    };

    return labels[errorType] || errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatTime(date: Date): string {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES');
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ================================================================================
  // 🧭 NAVEGACIÓN Y ACCIONES
  // ================================================================================

  goBack(): void {
    console.log('🔙 Volviendo al dashboard...');
    this.router.navigate(['/dashboard/overview']);
  }

  exportAlerts(): void {
    console.log('📤 Exportando alertas...');
    // TODO: Implementar exportación real
    this.snackBar.open('Función de exportación próximamente', 'Cerrar', { duration: 3000 });
  }
}