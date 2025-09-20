// src/app/routines/routine-validation/routine-validation.component.ts
// 🤖 ROUTINE VALIDATION COMPONENT - DASHBOARD PARA TRAINERS

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { Subscription } from 'rxjs';

import { RoutineValidationService, AIGeneratedRoutine, RoutineValidationFilter, ValidationMetrics, RoutineValidationAction } from '../../core/routine-validation.service';
import { AuthService } from '../../core/auth.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-routine-validation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatListModule
  ],
  templateUrl: './routine-validation.component.html',
  styleUrls: ['./routine-validation.component.scss']
})
export class RoutineValidationComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ✅ DATOS PRINCIPALES
  dataSource = new MatTableDataSource<AIGeneratedRoutine>();
  displayedColumns: string[] = [
    'userInfo',
    'routineName', 
    'difficulty',
    'duration',
    'exercises',
    'aiConfidence',
    'adaptationLevel',
    'generatedAt',
    'actions'
  ];

  // ✅ ESTADO DEL COMPONENTE
  loading = false;
  metrics: ValidationMetrics | null = null;
  currentUser: any = null;
  selectedRoutine: AIGeneratedRoutine | null = null;
  showFilters = false;

  // ✅ FORMULARIOS
  filterForm: FormGroup;

  // ✅ SUSCRIPCIONES
  private routinesSubscription?: Subscription;
  private metricsSubscription?: Subscription;
  private authSubscription?: Subscription;
  private loadingSubscription?: Subscription;

  constructor(
    private routineValidationService: RoutineValidationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    console.log('🤖 RoutineValidationComponent iniciado');
    this.initializeSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.routinesSubscription?.unsubscribe();
    this.metricsSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
  }

  // ✅ INICIALIZAR SUSCRIPCIONES
  private initializeSubscriptions(): void {
    // Suscripción a rutinas
    this.routinesSubscription = this.routineValidationService.routines$.subscribe(
      routines => {
        console.log('📋 Rutinas recibidas:', routines.length);
        this.dataSource.data = routines;
        
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      }
    );

    // Suscripción a métricas
    this.metricsSubscription = this.routineValidationService.metrics$.subscribe(
      metrics => {
        console.log('📊 Métricas recibidas:', metrics);
        this.metrics = metrics;
      }
    );

    // Suscripción a loading
    this.loadingSubscription = this.routineValidationService.loading$.subscribe(
      loading => {
        this.loading = loading;
      }
    );

    // Suscripción a usuario actual
    this.authSubscription = this.authService.user$.subscribe(
      user => {
        this.currentUser = user;
      }
    );
  }

  // ✅ CARGAR DATOS INICIALES
  private async loadInitialData(): Promise<void> {
    try {
      await this.routineValidationService.refreshData();
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  // ✅ CREAR FORMULARIO DE FILTROS
  private createFilterForm(): FormGroup {
    return this.fb.group({
      status: ['pending_approval'],
      difficulty: ['all'],
      adaptationLevel: ['all'],
      searchTerm: [''],
      dateStart: [null],
      dateEnd: [null]
    });
  }

  // ✅ APLICAR FILTROS
  async applyFilters(): Promise<void> {
    const formValue = this.filterForm.value;
    
    const filter: RoutineValidationFilter = {
      status: formValue.status !== 'all' ? formValue.status : undefined,
      difficulty: formValue.difficulty !== 'all' ? formValue.difficulty : undefined,
      adaptationLevel: formValue.adaptationLevel !== 'all' ? formValue.adaptationLevel : undefined,
      searchTerm: formValue.searchTerm || undefined,
      dateRange: (formValue.dateStart && formValue.dateEnd) ? {
        start: formValue.dateStart,
        end: formValue.dateEnd
      } : undefined
    };

    console.log('🔍 Aplicando filtros:', filter);
    await this.routineValidationService.loadPendingRoutines(filter);
  }

  // ✅ LIMPIAR FILTROS
  async clearFilters(): Promise<void> {
    this.filterForm.reset({
      status: 'pending_approval',
      difficulty: 'all',
      adaptationLevel: 'all',
      searchTerm: '',
      dateStart: null,
      dateEnd: null
    });
    
    await this.routineValidationService.loadPendingRoutines();
  }

  // ✅ APROBAR RUTINA
  async approveRoutine(routine: AIGeneratedRoutine): Promise<void> {
    if (!this.currentUser?.uid) {
      console.error('No hay usuario autenticado');
      return;
    }

    const notes = prompt('Notas del entrenador (opcional):');
    
    const action: RoutineValidationAction = {
      routineId: routine.id,
      action: 'approve',
      trainerNotes: notes || '',
      trainerId: this.currentUser.uid,
      trainerName: this.currentUser.displayName || this.currentUser.email || 'Entrenador'
    };

    const success = await this.routineValidationService.approveRoutine(action);
    if (success) {
      console.log('✅ Rutina aprobada exitosamente');
    }
  }

  // ✅ RECHAZAR RUTINA
  async rejectRoutine(routine: AIGeneratedRoutine): Promise<void> {
    if (!this.currentUser?.uid) {
      console.error('No hay usuario autenticado');
      return;
    }

    const reason = prompt('Razón del rechazo (requerido):');
    if (!reason || reason.trim() === '') {
      alert('Debe especificar una razón para el rechazo');
      return;
    }

    const notes = prompt('Notas adicionales (opcional):');
    
    const action: RoutineValidationAction = {
      routineId: routine.id,
      action: 'reject',
      rejectionReason: reason,
      trainerNotes: notes || '',
      trainerId: this.currentUser.uid,
      trainerName: this.currentUser.displayName || this.currentUser.email || 'Entrenador'
    };

    const success = await this.routineValidationService.rejectRoutine(action);
    if (success) {
      console.log('❌ Rutina rechazada exitosamente');
    }
  }

  // ✅ VER DETALLES DE RUTINA
  viewRoutineDetails(routine: AIGeneratedRoutine): void {
    this.selectedRoutine = routine;
    console.log('👁️ Viendo detalles de rutina:', routine);
    
    // Aquí podrías abrir un modal con más detalles
    // this.dialog.open(RoutineDetailsComponent, { data: routine });
  }

  // ✅ REFRESCAR DATOS
  async refreshData(): Promise<void> {
    await this.routineValidationService.refreshData();
  }

  // ✅ FILTROS RÁPIDOS
  async showPendingOnly(): Promise<void> {
    this.filterForm.patchValue({ status: 'pending_approval' });
    await this.applyFilters();
  }

  async showApprovedOnly(): Promise<void> {
    this.filterForm.patchValue({ status: 'approved' });
    await this.applyFilters();
  }

  async showRejectedOnly(): Promise<void> {
    this.filterForm.patchValue({ status: 'rejected' });
    await this.applyFilters();
  }

  async showAllRoutines(): Promise<void> {
    this.filterForm.patchValue({ status: 'all' });
    await this.applyFilters();
  }

  // ✅ UTILIDADES DE FORMATO
  formatDate(timestamp: any): string {
    if (!timestamp) return 'No disponible';
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending_approval': return 'warn';
      case 'approved': return 'primary';
      case 'rejected': return 'accent';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending_approval': return 'schedule';
      case 'approved': return 'check_circle';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'primary';
      case 'intermediate': return 'accent';
      case 'advanced': return 'warn';
      default: return '';
    }
  }

  getAdaptationColor(level: string): string {
    switch (level) {
      case 'low': return 'primary';
      case 'medium': return 'accent';
      case 'high': return 'warn';
      default: return '';
    }
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'primary';
    if (confidence >= 60) return 'accent';
    return 'warn';
  }

  // ✅ GETTERS PARA MÉTRICAS
  get totalPendingRoutines(): number {
    return this.metrics?.totalPending || 0;
  }

  get totalApprovedRoutines(): number {
    return this.metrics?.totalApproved || 0;
  }

  get totalRejectedRoutines(): number {
    return this.metrics?.totalRejected || 0;
  }

  get averageApprovalTime(): string {
    const time = this.metrics?.averageApprovalTime || 0;
    if (time < 60) {
      return `${time} min`;
    }
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    return `${hours}h ${minutes}min`;
  }

  get routinesToday(): number {
    return this.metrics?.routinesToday || 0;
  }

  get routinesThisWeek(): number {
    return this.metrics?.routinesThisWeek || 0;
  }

  get averageAIConfidence(): number {
    return this.metrics?.averageAIConfidence || 0;
  }

  // ✅ MÉTODOS DE NAVEGACIÓN Y ACCIONES
  trackByRoutineId(index: number, item: AIGeneratedRoutine): string {
    return item.id;
  }

  isCurrentUserTrainer(): boolean {
    return this.currentUser?.role === 'trainer' || this.currentUser?.role === 'admin';
  }

  canApproveReject(routine: AIGeneratedRoutine): boolean {
    return routine.status === 'pending_approval' && this.isCurrentUserTrainer();
  }

  // ✅ EXPORTAR DATOS (OPCIONAL)
  exportToCSV(): void {
    const data = this.dataSource.data;
    const csvContent = this.convertToCSV(data);
    this.downloadCSV(csvContent, 'rutinas-validacion.csv');
  }

  private convertToCSV(data: AIGeneratedRoutine[]): string {
    const headers = [
      'ID',
      'Usuario',
      'Email',
      'Rutina',
      'Dificultad', 
      'Duración',
      'Ejercicios',
      'Confianza IA',
      'Adaptación',
      'Estado',
      'Generada',
      'Notas Entrenador'
    ];

    const rows = data.map(routine => [
      routine.id,
      routine.userDisplayName || '',
      routine.userEmail || '',
      routine.routine.name || '',
      routine.routine.difficulty || '',
      routine.routine.duration || 0,
      routine.routine.exercises?.length || 0,
      routine.aiConfidence || 0,
      routine.adaptationLevel || '',
      routine.status || '',
      this.formatDate(routine.generatedAt),
      routine.trainerNotes || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}