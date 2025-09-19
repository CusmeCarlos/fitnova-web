// src/app/alerts/alert-dashboard/alert-dashboard.component.ts
// 🚨 ALERT DASHBOARD COMPONENT - CON DATOS REALES DE FIREBASE

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// ✅ SERVICIOS
import { AlertService, AlertDetail, AlertMetrics, AlertFilter } from '../../core/alert.service';
import { AuthService } from '../../core/auth.service';

// ✅ MATERIAL DESIGN - MISMO PATRÓN QUE TUS OTROS COMPONENTES
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
  @ViewChild('severityChart', { static: false }) severityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('timelineChart', { static: false }) timelineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('errorTypesChart', { static: false }) errorTypesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ✅ DATOS DEL COMPONENTE - DESDE FIREBASE
  alertMetrics: AlertMetrics | null = null;
  recentAlerts: AlertDetail[] = [];
  filteredAlerts: AlertDetail[] = [];
  currentFilter: AlertFilter = { severity: 'all', status: 'all' };
  isLoading = true;

  // ✅ FILTROS Y FORMULARIOS
  filterForm!: FormGroup;
  errorTypes: string[] = [];
  severityOptions = [
    { value: 'all', label: 'Todas las severidades', icon: 'tune' },
    { value: 'critical', label: 'Críticas', icon: 'error', color: '#f44336' },
    { value: 'high', label: 'Altas', icon: 'warning', color: '#ff9800' },
    { value: 'medium', label: 'Medias', icon: 'info', color: '#ffc107' },
    { value: 'low', label: 'Bajas', icon: 'check_circle', color: '#4caf50' }
  ];

  statusOptions = [
    { value: 'all', label: 'Todos los estados', icon: 'list' },
    { value: 'unread', label: 'Sin leer', icon: 'mark_email_unread', color: '#f44336' },
    { value: 'read', label: 'Leídas', icon: 'mark_email_read', color: '#ff9800' },
    { value: 'resolved', label: 'Resueltas', icon: 'check_circle', color: '#4caf50' }
  ];

  // ✅ TABLA DE ALERTAS
  displayedColumns: string[] = ['severity', 'user', 'errorType', 'exercise', 'time', 'status', 'actions'];
  dataSource = new MatTableDataSource<AlertDetail>();

  // ✅ CHARTS
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
    this.setupSubscriptions();
  }

  ngAfterViewInit(): void {
    this.setupTable();
    // Esperar un poco para que las vistas se inicialicen
    setTimeout(() => {
      this.initializeCharts();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  // ✅ CONFIGURACIÓN INICIAL

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      severity: ['all'],
      status: ['all'],
      errorType: [''],
      dateStart: [''],
      dateEnd: ['']
    });

    // Escuchar cambios en filtros
    this.filterForm.valueChanges.subscribe(values => {
      this.applyFilters(values);
    });
  }

  private setupSubscriptions(): void {
    // ✅ USAR DATOS REALES DE FIREBASE - Métricas de alertas
    this.subscriptions.add(
      this.alertService.alertMetrics$.subscribe(metrics => {
        this.alertMetrics = metrics;
        this.isLoading = false;
        if (metrics) {
          setTimeout(() => this.updateCharts(), 100);
        }
      })
    );

    // ✅ USAR DATOS REALES DE FIREBASE - Alertas filtradas
    this.subscriptions.add(
      this.alertService.filteredAlerts$.subscribe(alerts => {
        this.filteredAlerts = alerts;
        this.recentAlerts = alerts.slice(0, 10);
        this.dataSource.data = alerts;
        this.extractErrorTypes(alerts);
        
        // Actualizar gráficos cuando cambien los datos
        setTimeout(() => this.updateErrorTypesChart(), 100);
      })
    );

    // ✅ USAR DATOS REALES DE FIREBASE - Filtro actual
    this.subscriptions.add(
      this.alertService.currentFilter$.subscribe(filter => {
        this.currentFilter = filter;
        this.updateFilterForm(filter);
      })
    );
  }

  private setupTable(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ✅ MANEJO DE FILTROS

  private applyFilters(formValues: any): void {
    const filter: AlertFilter = {
      severity: formValues.severity,
      status: formValues.status,
      errorType: formValues.errorType || undefined
    };

    if (formValues.dateStart && formValues.dateEnd) {
      filter.dateRange = {
        start: new Date(formValues.dateStart),
        end: new Date(formValues.dateEnd)
      };
    }

    this.alertService.applyFilter(filter);
  }

  private updateFilterForm(filter: AlertFilter): void {
    this.filterForm.patchValue({
      severity: filter.severity || 'all',
      status: filter.status || 'all',
      errorType: filter.errorType || '',
      dateStart: filter.dateRange?.start ? this.formatDateForInput(filter.dateRange.start) : '',
      dateEnd: filter.dateRange?.end ? this.formatDateForInput(filter.dateRange.end) : ''
    }, { emitEvent: false });
  }

  clearAllFilters(): void {
    this.filterForm.reset({
      severity: 'all',
      status: 'all',
      errorType: '',
      dateStart: '',
      dateEnd: ''
    });
    this.alertService.clearFilters();
  }

  private extractErrorTypes(alerts: AlertDetail[]): void {
    const uniqueTypes = [...new Set(alerts.map(alert => alert.errorType))];
    this.errorTypes = uniqueTypes;
  }

  // ✅ ACCIONES DE ALERTAS - USAR SERVICIO REAL

  async markAsRead(alert: AlertDetail): Promise<void> {
    if (alert.status === 'read' || alert.status === 'resolved') {
      this.snackBar.open('La alerta ya fue procesada', 'Cerrar', { duration: 3000 });
      return;
    }

    const success = await this.alertService.markAsRead(alert.id);
    if (success) {
      console.log('✅ Alerta marcada como leída:', alert.id);
    }
  }

  async resolveAlert(alert: AlertDetail): Promise<void> {
    if (alert.status === 'resolved') {
      this.snackBar.open('La alerta ya está resuelta', 'Cerrar', { duration: 3000 });
      return;
    }

    const success = await this.alertService.resolveAlert(alert.id, 'Resuelta desde dashboard');
    if (success) {
      console.log('✅ Alerta resuelta:', alert.id);
    }
  }

  viewAlertDetail(alert: AlertDetail): void {
    console.log('📋 Ver detalle de alerta:', alert.id);
    this.snackBar.open('Vista detallada próximamente', 'Cerrar', { duration: 3000 });
  }

  // ✅ GRÁFICOS CON DATOS REALES

  private initializeCharts(): void {
    if (!this.alertMetrics) return;

    try {
      console.log('📊 Inicializando gráficos con datos reales:', this.alertMetrics);
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
    if (!ctx) {
      console.warn('⚠️ No se pudo obtener contexto 2D');
      return;
    }

    console.log('📊 Creando gráfico de severidad con datos reales...');

    this.severityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Críticas', 'Altas', 'Medias', 'Bajas'],
        datasets: [{
          data: [
            this.alertMetrics.criticalAlerts,
            this.alertMetrics.highAlerts,
            this.alertMetrics.mediumAlerts,
            this.alertMetrics.lowAlerts
          ],
          backgroundColor: ['#f44336', '#ff9800', '#ffc107', '#4caf50'],
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

    console.log('✅ Gráfico de severidad creado con datos reales');
  }

  private initTimelineChart(): void {
    if (!this.timelineChartRef?.nativeElement) {
      console.warn('⚠️ No se puede inicializar gráfico de timeline');
      return;
    }

    const ctx = this.timelineChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Calcular datos reales para timeline (últimos 7 días)
    const timelineData = this.calculateTimelineData();

    console.log('📊 Creando gráfico de timeline con datos reales...');

    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timelineData.labels,
        datasets: [{
          label: 'Alertas por día',
          data: timelineData.data,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
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
            grid: {
              color: '#f0f0f0'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    console.log('✅ Gráfico de timeline creado con datos reales');
  }

  private initErrorTypesChart(): void {
    this.updateErrorTypesChart();
  }

  private updateErrorTypesChart(): void {
    if (!this.errorTypesChartRef?.nativeElement || this.filteredAlerts.length === 0) {
      console.warn('⚠️ No se puede inicializar gráfico de tipos de error');
      return;
    }

    const ctx = this.errorTypesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.errorTypesChart) {
      this.errorTypesChart.destroy();
    }

    // Contar errores por tipo usando datos reales
    const errorCounts = this.filteredAlerts.reduce((acc, alert) => {
      const label = this.getErrorTypeLabel(alert.errorType);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(errorCounts);
    const data = Object.values(errorCounts);

    console.log('📊 Creando gráfico de tipos de error con datos reales:', errorCounts);

    this.errorTypesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(label => label.replace(' ', '\n')),
        datasets: [{
          label: 'Cantidad de errores',
          data: data,
          backgroundColor: [
            '#f44336',  // Rojo para crítico
            '#ff9800',  // Naranja para alto
            '#ffc107',  // Amarillo para medio
            '#4caf50',  // Verde para bajo
            '#9c27b0',  // Morado para adicionales
            '#607d8b'   // Gris para adicionales
          ],
          borderColor: [
            '#d32f2f',
            '#f57c00',
            '#ffa000',
            '#388e3c',
            '#7b1fa2',
            '#455a64'
          ],
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#666',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: function(context) {
                return context[0].label.replace('\n', ' ');
              },
              label: function(context) {
                return `${context.formattedValue} errores detectados`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f0f0f0',
              lineWidth: 1
            },
            ticks: {
              color: '#666',
              font: {
                size: 12
              },
              stepSize: 1
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#666',
              font: {
                size: 11
              },
              maxRotation: 0
            }
          }
        },
        elements: {
          bar: {
            borderRadius: 8
          }
        }
      }
    });

    console.log('✅ Gráfico de tipos de error creado con datos reales');
  }

  private calculateTimelineData(): { labels: string[], data: number[] } {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const labels = last7Days.map(date => 
      date.toLocaleDateString('es-ES', { weekday: 'short' })
    );

    const data = last7Days.map(date => {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      return this.filteredAlerts.filter(alert => 
        alert.processedAt >= dayStart && alert.processedAt <= dayEnd
      ).length;
    });

    return { labels, data };
  }

  private updateCharts(): void {
    if (this.severityChart && this.alertMetrics) {
      this.severityChart.data.datasets[0].data = [
        this.alertMetrics.criticalAlerts,
        this.alertMetrics.highAlerts,
        this.alertMetrics.mediumAlerts,
        this.alertMetrics.lowAlerts
      ];
      this.severityChart.update();
    }

    // Actualizar timeline con datos reales
    if (this.timelineChart) {
      const timelineData = this.calculateTimelineData();
      this.timelineChart.data.datasets[0].data = timelineData.data;
      this.timelineChart.update();
    }

    // Actualizar gráfico de tipos de error
    this.updateErrorTypesChart();
  }

  private destroyCharts(): void {
    if (this.severityChart) {
      this.severityChart.destroy();
    }
    if (this.timelineChart) {
      this.timelineChart.destroy();
    }
    if (this.errorTypesChart) {
      this.errorTypesChart.destroy();
    }
  }

  // ✅ FILTROS RÁPIDOS DE FECHA
  setQuickDateFilter(period: 'today' | 'week' | 'month'): void {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return;
    }

    // Actualizar el formulario
    this.filterForm.patchValue({
      dateStart: startDate,
      dateEnd: endDate
    });

    this.snackBar.open(`Filtro aplicado: ${this.getQuickFilterLabel(period)}`, 'Cerrar', { duration: 2000 });
  }

  private getQuickFilterLabel(period: string): string {
    const labels = {
      today: 'Solo hoy',
      week: 'Esta semana',
      month: 'Este mes'
    };
    return labels[period as keyof typeof labels] || period;
  }

  // ✅ MÉTODOS AUXILIARES

  getSeverityColor(severity: string): string {
    const colors = {
      critical: '#f44336',
      high: '#ff9800',
      medium: '#ffc107',
      low: '#4caf50'
    };
    return colors[severity as keyof typeof colors] || '#666';
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
      unread: '#f44336',
      read: '#ff9800',
      resolved: '#4caf50'
    };
    return colors[status as keyof typeof colors] || '#666';
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
      'excessive_lumbar_flexion': 'Flexión lumbar excesiva'
    };

    return labels[errorType] || errorType;
  }

  formatTime(date: Date): string {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ✅ NAVEGACIÓN

  goBack(): void {
    this.router.navigate(['/dashboard/overview']);
  }

  viewAllAlerts(): void {
    this.snackBar.open('Lista completa próximamente', 'Cerrar', { duration: 3000 });
  }

  // ✅ EXPORTACIÓN DE DATOS

  exportAlerts(): void {
    this.snackBar.open('Función de exportación próximamente', 'Cerrar', { duration: 3000 });
  }

  // ✅ MÉTODOS DE CONFIGURACIÓN

  openSettings(): void {
    this.snackBar.open('Configuración próximamente', 'Cerrar', { duration: 3000 });
  }
}