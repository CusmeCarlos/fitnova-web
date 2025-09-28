// src/app/analytics/overview/overview.component.ts
// 📊 ANALYTICS DASHBOARD ULTRA PREMIUM - FUNCIONALIDAD COMPLETA

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

// ✅ SERVICIOS
import { AnalyticsService, AnalyticsMetrics, AnalyticsFilter } from '../../core/analytics.service';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// Registrar Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-overview',
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
    MatSnackBarModule
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // ✅ VIEW CHILDREN PARA GRÁFICOS
  @ViewChild('usageChart', { static: false }) usageChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('effectivenessChart', { static: false }) effectivenessChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('engagementChart', { static: false }) engagementChartRef!: ElementRef<HTMLCanvasElement>;

  // ✅ ESTADO DEL COMPONENTE
  isLoading = true;
  analyticsMetrics: AnalyticsMetrics | null = null;
  filterForm!: FormGroup;
  
  // ✅ GRÁFICOS CHART.JS
  private usageChart?: Chart;
  private effectivenessChart?: Chart;
  private engagementChart?: Chart;

  // ✅ SUBSCRIPCIONES
  private subscriptions = new Subscription();

  constructor(
    private analyticsService: AnalyticsService,
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    console.log('📊 AnalyticsOverviewComponent inicializado');
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    console.log('🔄 Inicializando Analytics Dashboard...');
    this.loadAnalyticsData();
    this.setupFilterListeners();
  }

  ngAfterViewInit(): void {
    // Los gráficos se inicializan cuando llegan los datos
    console.log('👁️ Vista inicializada, esperando datos para gráficos...');
  }

  ngOnDestroy(): void {
    console.log('🔥 Limpiando Analytics Dashboard...');
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  // ================================================================================
  // 🔧 INICIALIZACIÓN
  // ================================================================================

  private initializeFilterForm(): void {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.filterForm = this.fb.group({
      startDate: [weekAgo],
      endDate: [today],
      userType: ['all'],
      trainerAssigned: ['all']
    });
  }

  private setupFilterListeners(): void {
    // Escuchar cambios en el formulario de filtros con debounce
    const filterSub = this.filterForm.valueChanges.subscribe(values => {
      console.log('🔍 Filtros cambiados:', values);
      this.applyFilters();
    });

    this.subscriptions.add(filterSub);
  }

  // ================================================================================
  // 📊 CARGA DE DATOS
  // ================================================================================

  private loadAnalyticsData(): void {
    console.log('📊 Cargando datos de analytics...');
    this.isLoading = true;

    // Suscribirse a métricas de analytics
    const analyticsSub = this.analyticsService.analytics$.subscribe({
      next: (metrics) => {
        if (metrics) {
          console.log('✅ Métricas de analytics cargadas:', metrics);
          this.analyticsMetrics = metrics;
          this.isLoading = false;
          
          // Inicializar gráficos después de cargar datos
          setTimeout(() => {
            this.initializeCharts();
          }, 100);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando métricas de analytics:', error);
        this.isLoading = false;
        this.showErrorMessage('Error cargando datos de analytics');
      }
    });

    // Suscribirse al estado de carga
    const loadingSub = this.analyticsService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.subscriptions.add(analyticsSub);
    this.subscriptions.add(loadingSub);
  }

  private applyFilters(): void {
    const filterValues = this.filterForm.value;
    
    const filter: AnalyticsFilter = {
      startDate: filterValues.startDate,
      endDate: filterValues.endDate,
      userType: filterValues.userType !== 'all' ? filterValues.userType : undefined,
      trainerAssigned: filterValues.trainerAssigned !== 'all' ? filterValues.trainerAssigned : undefined
    };

    console.log('🔍 Aplicando filtros:', filter);
    
    // Aplicar filtros y recargar datos
    const filterSub = this.analyticsService.getAnalyticsWithFilter(filter).subscribe({
      next: (metrics) => {
        if (metrics) {
          this.analyticsMetrics = metrics;
          this.updateCharts();
        }
      },
      error: (error) => {
        console.error('❌ Error aplicando filtros:', error);
        this.showErrorMessage('Error aplicando filtros');
      }
    });

    this.subscriptions.add(filterSub);
  }

  // ================================================================================
  // 📈 GRÁFICOS CHART.JS
  // ================================================================================

  private initializeCharts(): void {
    if (!this.analyticsMetrics) {
      console.warn('⚠️ No hay métricas para inicializar gráficos');
      return;
    }

    console.log('📈 Inicializando gráficos de analytics...');
    
    try {
      this.destroyCharts();
      this.initUsageChart();
      this.initEffectivenessChart();
      this.initEngagementChart();
      console.log('✅ Gráficos de analytics inicializados');
    } catch (error) {
      console.error('❌ Error inicializando gráficos:', error);
    }
  }

  private initUsageChart(): void {
    if (!this.usageChartRef?.nativeElement || !this.analyticsMetrics) {
      console.warn('⚠️ No se puede inicializar gráfico de uso');
      return;
    }

    const ctx = this.usageChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = {
      labels: this.analyticsMetrics.dailyActivity.map(day => day.date),
      datasets: [
        {
          label: 'Usuarios Activos',
          data: this.analyticsMetrics.dailyActivity.map(day => day.users),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Sesiones',
          data: this.analyticsMetrics.dailyActivity.map(day => day.sessions),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };

    this.usageChart = new Chart(ctx, {
      type: 'line',
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
          },
          title: {
            display: true,
            text: 'Tendencia de Uso Diario',
            color: '#f8fafc',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#94a3b8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          y: {
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

  private initEffectivenessChart(): void {
    if (!this.effectivenessChartRef?.nativeElement || !this.analyticsMetrics) {
      console.warn('⚠️ No se puede inicializar gráfico de efectividad');
      return;
    }

    const ctx = this.effectivenessChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = {
      labels: this.analyticsMetrics.errorTypeDistribution.map(error => error.type),
      datasets: [{
        data: this.analyticsMetrics.errorTypeDistribution.map(error => error.count),
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

    this.effectivenessChart = new Chart(ctx, {
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
                size: 11,
                weight: 'bold'
              },
              padding: 12
            }
          },
          title: {
            display: true,
            text: 'Distribución de Errores Detectados',
            color: '#f8fafc',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    });
  }

  private initEngagementChart(): void {
    if (!this.engagementChartRef?.nativeElement || !this.analyticsMetrics) {
      console.warn('⚠️ No se puede inicializar gráfico de engagement');
      return;
    }

    const ctx = this.engagementChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = {
      labels: this.analyticsMetrics.engagementTrend.map(trend => trend.period),
      datasets: [
        {
          label: 'Engagement (%)',
          data: this.analyticsMetrics.engagementTrend.map(trend => trend.engagement),
          backgroundColor: 'rgba(139, 92, 246, 0.6)',
          borderColor: '#8b5cf6',
          borderWidth: 1
        },
        {
          label: 'Retención (%)',
          data: this.analyticsMetrics.engagementTrend.map(trend => trend.retention),
          backgroundColor: 'rgba(236, 72, 153, 0.6)',
          borderColor: '#ec4899',
          borderWidth: 1
        }
      ]
    };

    this.engagementChart = new Chart(ctx, {
      type: 'bar',
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
          },
          title: {
            display: true,
            text: 'Tendencia de Engagement y Retención',
            color: '#f8fafc',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#94a3b8'
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#94a3b8',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.1)'
            }
          }
        }
      }
    });
  }

  private updateCharts(): void {
    if (this.analyticsMetrics) {
      this.initUsageChart();
      this.initEffectivenessChart();
      this.initEngagementChart();
    }
  }

  private destroyCharts(): void {
    this.destroyChart('usage');
    this.destroyChart('effectiveness');
    this.destroyChart('engagement');
  }

  private destroyChart(chartType: 'usage' | 'effectiveness' | 'engagement'): void {
    try {
      switch (chartType) {
        case 'usage':
          if (this.usageChart) {
            this.usageChart.destroy();
            this.usageChart = undefined;
          }
          break;
        case 'effectiveness':
          if (this.effectivenessChart) {
            this.effectivenessChart.destroy();
            this.effectivenessChart = undefined;
          }
          break;
        case 'engagement':
          if (this.engagementChart) {
            this.engagementChart.destroy();
            this.engagementChart = undefined;
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

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }

  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return 'trending_up';
    if (current < previous) return 'trending_down';
    return 'trending_flat';
  }

  getTrendClass(current: number, previous: number): string {
    if (current > previous) return 'positive';
    if (current < previous) return 'negative';
    return 'neutral';
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // ================================================================================
  // 🧭 NAVEGACIÓN Y ACCIONES
  // ================================================================================

  goBack(): void {
    console.log('🔙 Volviendo al dashboard...');
    this.router.navigate(['/dashboard/overview']);
  }

  refreshAnalytics(): void {
    console.log('🔄 Refrescando analytics...');
    this.analyticsService.refreshAnalytics();
  }

  exportAnalytics(): void {
    console.log('📤 Exportando analytics...');
    this.analyticsService.exportAnalyticsData();
    this.snackBar.open('Función de exportación próximamente', 'Cerrar', { duration: 3000 });
  }

  clearFilters(): void {
    console.log('🧹 Limpiando filtros...');
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.filterForm.patchValue({
      startDate: weekAgo,
      endDate: today,
      userType: 'all',
      trainerAssigned: 'all'
    });
  }

  // ================================================================================
  // 📊 GETTERS PARA TEMPLATE
  // ================================================================================

  get totalUsers(): number {
    return this.analyticsMetrics?.totalUsers || 0;
  }

  get activeUsersToday(): number {
    return this.analyticsMetrics?.activeUsersToday || 0;
  }

  get averageSessionDuration(): number {
    return this.analyticsMetrics?.averageSessionDuration || 0;
  }

  get accuracyRate(): number {
    return this.analyticsMetrics?.accuracyRate || 0;
  }

  get totalDetections(): number {
    return this.analyticsMetrics?.totalDetections || 0;
  }

  get correctionsApplied(): number {
    return this.analyticsMetrics?.correctionsApplied || 0;
  }

  get routinesCompleted(): number {
    return this.analyticsMetrics?.routinesCompleted || 0;
  }

  get userRetentionRate(): number {
    return this.analyticsMetrics?.userRetentionRate || 0;
  }
}