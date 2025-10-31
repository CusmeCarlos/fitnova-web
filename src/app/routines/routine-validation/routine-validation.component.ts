// src/app/routines/routine-validation/routine-validation.component.ts
// 🤖 ROUTINE VALIDATION COMPONENT - PREMIUM FINZENAPP NIVEL EXACTO

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { RoutineValidationService, AIGeneratedRoutine, RoutineValidationFilter, ValidationMetrics, RoutineValidationAction } from '../../core/routine-validation.service';
import { AuthService } from '../../core/auth.service';
import { RoutineDetailsModalComponent, RoutineDetailsModalData } from '../routine-details-modal/routine-details-modal.component';

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
    MatListModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './routine-validation.component.html',
  styleUrls: ['./routine-validation.component.scss'],
  animations: [
    trigger('slideDown', [
      state('void', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('void <=> *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
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
    'status',
    'actions'
  ];

  // ✅ ESTADO DEL COMPONENTE
  loading = false;
  metrics: ValidationMetrics | null = null;
  currentUser: any = null;
  selectedRoutine: AIGeneratedRoutine | null = null;
  showFilters = false;
  showPreview = false;

  // ✅ FORMULARIOS
  filterForm: FormGroup;

  // ✅ SUSCRIPCIONES
  private routinesSubscription?: Subscription;
  private metricsSubscription?: Subscription;
  private authSubscription?: Subscription;
  private loadingSubscription?: Subscription;
  private searchSubscription?: Subscription;

  constructor(
    private routineValidationService: RoutineValidationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    console.log('🤖 RoutineValidationComponent iniciado - Premium FinZenApp');
    this.initializeSubscriptions();
    this.loadInitialData();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.routinesSubscription?.unsubscribe();
    this.metricsSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  // ===============================================================================
  // 🔄 INICIALIZACIÓN Y SUSCRIPCIONES
  // ===============================================================================

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

  private async loadInitialData(): Promise<void> {
    try {
      await this.routineValidationService.refreshData();
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      status: new FormControl('pending_approval'),
      difficulty: new FormControl('all'),
      adaptationLevel: new FormControl('all'),
      searchTerm: new FormControl(''),
      dateStart: new FormControl(null),
      dateEnd: new FormControl(null)
    });
  }

  private setupSearchSubscription(): void {
    this.searchSubscription = this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // ===============================================================================
  // 🔍 FILTROS Y BÚSQUEDA
  // ===============================================================================

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

  clearSearch(): void {
    this.filterForm.get('searchTerm')?.setValue('');
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  // ===============================================================================
  // 🎯 FILTROS RÁPIDOS
  // ===============================================================================

  async showPendingOnly(): Promise<void> {
    this.filterForm.get('status')?.setValue('pending_approval');
    await this.applyFilters();
  }

  async showApprovedOnly(): Promise<void> {
    this.filterForm.get('status')?.setValue('approved');
    await this.applyFilters();
  }

  async showRejectedOnly(): Promise<void> {
    this.filterForm.get('status')?.setValue('rejected');
    await this.applyFilters();
  }

  async showAllRoutines(): Promise<void> {
    this.filterForm.get('status')?.setValue('all');
    await this.applyFilters();
  }

  // ===============================================================================
  // ⚡ ACCIONES DE RUTINAS - MÉTODOS RÁPIDOS DESDE LA TABLA
  // ===============================================================================

  async approveRoutine(routine: AIGeneratedRoutine): Promise<void> {
    if (!this.currentUser?.uid) {
      this.showError('No hay usuario autenticado');
      return;
    }

    // Confirmación rápida
    const confirmApproval = confirm(`¿Estás seguro de que quieres aprobar la rutina "${this.getRoutineName(routine)}"?`);
    if (!confirmApproval) return;

    try {
      const action: RoutineValidationAction = {
        routineId: routine.id,
        action: 'approve',
        trainerNotes: 'Aprobación rápida desde tabla',
        trainerId: this.currentUser.uid,
        trainerName: this.currentUser.displayName || this.currentUser.email || 'Entrenador'
      };

      const success = await this.routineValidationService.approveRoutine(action);
      if (success) {
        this.showSuccess('✅ Rutina aprobada exitosamente');
        await this.refreshData();
      }
    } catch (error) {
      console.error('Error aprobando rutina:', error);
      this.showError('Error al aprobar la rutina');
    }
  }

  async rejectRoutine(routine: AIGeneratedRoutine): Promise<void> {
    if (!this.currentUser?.uid) {
      this.showError('No hay usuario autenticado');
      return;
    }

    const reason = prompt('Razón del rechazo (requerido):');
    if (!reason || reason.trim() === '') {
      this.showError('Debe especificar una razón para el rechazo');
      return;
    }

    try {
      const action: RoutineValidationAction = {
        routineId: routine.id,
        action: 'reject',
        rejectionReason: reason,
        trainerNotes: 'Rechazo rápido desde tabla',
        trainerId: this.currentUser.uid,
        trainerName: this.currentUser.displayName || this.currentUser.email || 'Entrenador'
      };

      const success = await this.routineValidationService.rejectRoutine(action);
      if (success) {
        this.showSuccess('❌ Rutina rechazada exitosamente');
        await this.refreshData();
      }
    } catch (error) {
      console.error('Error rechazando rutina:', error);
      this.showError('Error al rechazar la rutina');
    }
  }

  async deleteRoutine(routine: AIGeneratedRoutine): Promise<void> {
    if (!this.currentUser?.uid) {
      this.showError('No hay usuario autenticado');
      return;
    }

    // Confirmación de eliminación
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar permanentemente la rutina "${this.getRoutineName(routine)}"?\n\nEsta acción NO se puede deshacer.`);
    if (!confirmDelete) return;

    try {
      const success = await this.routineValidationService.deleteRoutine(routine.id);
      if (success) {
        this.showSuccess(`🗑️ Rutina "${this.getRoutineName(routine)}" eliminada exitosamente`);
        await this.refreshData();
      } else {
        this.showError('No se pudo eliminar la rutina');
      }
    } catch (error) {
      console.error('Error eliminando rutina:', error);
      this.showError('Error al eliminar la rutina');
    }
  }

  // ===============================================================================
  // 👁️ MODAL DE DETALLES PREMIUM
  // ===============================================================================

  viewRoutineDetails(routine: AIGeneratedRoutine): void {
    this.selectedRoutine = routine;
    console.log('👁️ Abriendo modal de detalles para rutina:', routine);
    
    // Abrir modal premium con detalles de la rutina
    const dialogRef = this.dialog.open(RoutineDetailsModalComponent, {
      data: {
        routine: routine,
        mode: 'edit'
      } as RoutineDetailsModalData,
      width: '1200px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: ['routine-details-modal-panel'],
      disableClose: false,
      autoFocus: false,
      restoreFocus: true
    });

    // Manejar resultado del modal
    dialogRef.afterClosed().subscribe(result => {
      console.log('🔄 Modal cerrado con resultado:', result);
      
      if (result) {
        if (result.action === 'approved') {
          this.showSuccess(`✅ Rutina "${this.getRoutineName(routine)}" aprobada exitosamente`);
        } else if (result.action === 'rejected') {
          this.showSuccess(`❌ Rutina "${this.getRoutineName(routine)}" rechazada`);
        }
        
        // Refrescar datos si hubo cambios
        this.refreshData();
      }
      
      this.selectedRoutine = null;
    });
  }

  // ===============================================================================
  // 🔄 ACCIONES GENERALES
  // ===============================================================================

  async refreshData(): Promise<void> {
    try {
      await this.routineValidationService.refreshData();
      this.showSuccess('📊 Datos actualizados');
    } catch (error) {
      console.error('Error refrescando datos:', error);
      this.showError('Error al actualizar los datos');
    }
  }

  async exportRoutines(): Promise<void> {
    try {
      console.log('📄 Exportando rutinas...');
      const routines = this.dataSource.data;
      
      if (routines.length === 0) {
        this.showError('No hay rutinas para exportar');
        return;
      }
      
      const csvData = this.convertToCSV(routines);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `rutinas-validacion-${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      this.showSuccess(`📄 ${routines.length} rutinas exportadas exitosamente`);
    } catch (error) {
      console.error('Error exportando rutinas:', error);
      this.showError('Error al exportar las rutinas');
    }
  }

  // ===============================================================================
  // 🎨 HELPERS PARA DISPLAY - ADAPTADOS A TU ESTRUCTURA
  // ===============================================================================

  getUserInitials(email: string): string {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    return parts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
  }

  // ✅ HELPERS PARA ACCEDER A DATOS ANIDADOS
  getRoutineName(routine: AIGeneratedRoutine): string {
    return routine.routine?.name || 'Rutina Personalizada';
  }

  getRoutineDescription(routine: AIGeneratedRoutine): string {
    return routine.routine?.description || routine.baseProfile?.primaryGoals?.[0] || 'Objetivo general';
  }

  getRoutineDifficulty(routine: AIGeneratedRoutine): string {
    return routine.routine?.difficulty || 'intermediate';
  }

  getRoutineDuration(routine: AIGeneratedRoutine): string {
    const duration = routine.routine?.duration;
    if (duration) {
      return `${duration} min`;
    }
    return '45 min';
  }

  getRoutineExercises(routine: AIGeneratedRoutine): any[] {
    return routine.routine?.exercises || [];
  }

  getUserDisplayName(routine: AIGeneratedRoutine): string {
    // Priorizar diferentes fuentes de nombre del usuario
    if (routine.userDisplayName && routine.userDisplayName !== 'Usuario Desconocido') {
      return routine.userDisplayName;
    }
    
    // Si tenemos email, extraer nombre de la parte antes del @
    if (routine.userEmail) {
      const emailParts = routine.userEmail.split('@')[0];
      // Convertir guiones/puntos en espacios y capitalizar
      const nameFromEmail = emailParts
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      return nameFromEmail;
    }
    
    // Si tiene información en baseProfile
    if (routine.baseProfile?.physicalCapacity?.name) {
      return routine.baseProfile.physicalCapacity.name;
    }
    
    // Último recurso
    return 'Usuario';
  }

  getUserEmail(routine: AIGeneratedRoutine): string {
    return routine.userEmail || '';
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'beginner';
      case 'intermediate': return 'intermediate';
      case 'advanced': return 'advanced';
      default: return 'intermediate';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return 'Intermedio';
    }
  }

  getAdaptationClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'medium';
    }
  }

  getAdaptationLabel(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low': return 'Bajo';
      case 'medium': return 'Medio';
      case 'high': return 'Alto';
      default: return 'Medio';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending_approval': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending_approval': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  }

  getConfidencePercentage(confidence: number): number {
    if (!confidence && confidence !== 0) return 0;
    
    // Si el valor ya está en porcentaje (mayor a 1), devolverlo como está
    if (confidence > 1) {
      return Math.round(confidence);
    }
    
    // Si está en decimal (0.75), convertir a porcentaje
    return Math.round(confidence * 100);
  }

  getConfidenceClass(confidence: number): string {
    const percentage = this.getConfidencePercentage(confidence);
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  }

  getExercisesCount(exercises: any[]): number {
    return exercises?.length || 0;
  }

  getExerciseTypes(exercises: any[]): string {
    if (!exercises || exercises.length === 0) return 'Sin ejercicios';
    
    const types = exercises.map(ex => ex.muscleGroup || ex.type || ex.category).filter(Boolean);
    const uniqueTypes = [...new Set(types)];
    
    if (uniqueTypes.length <= 2) {
      return uniqueTypes.join(', ');
    }
    
    return `${uniqueTypes.slice(0, 2).join(', ')} +${uniqueTypes.length - 2}`;
  }

  getDateText(date: any): string {
    if (!date) return 'Sin fecha';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getTimeText(date: any): string {
    if (!date) return '';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getExerciseIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'cardio': return 'directions_run';
      case 'strength': return 'fitness_center';
      case 'flexibility': return 'self_improvement';
      case 'balance': return 'accessibility';
      default: return 'fitness_center';
    }
  }

  getAverageTimeFormatted(): string {
    const minutes = this.metrics?.averageApprovalTime || 0;
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  canApproveReject(routine: AIGeneratedRoutine): boolean {
    return routine.status === 'pending_approval';
  }

  // ===============================================================================
  // 🔧 UTILITIES
  // ===============================================================================

  private convertToCSV(routines: AIGeneratedRoutine[]): string {
    const headers = [
      'Usuario',
      'Email',
      'Rutina',
      'Descripción',
      'Dificultad',
      'Duración',
      'Ejercicios',
      'Confianza IA',
      'Adaptación',
      'Estado',
      'Fecha Generada',
      'Entrenador',
      'Notas'
    ];

    const rows = routines.map(routine => [
      this.getUserDisplayName(routine),
      this.getUserEmail(routine),
      this.getRoutineName(routine),
      this.getRoutineDescription(routine),
      this.getDifficultyLabel(this.getRoutineDifficulty(routine)),
      this.getRoutineDuration(routine),
      this.getExercisesCount(this.getRoutineExercises(routine)).toString(),
      `${this.getConfidencePercentage(routine.aiConfidence || 0)}%`,
      this.getAdaptationLabel(routine.adaptationLevel || 'medium'),
      this.getStatusLabel(routine.status),
      this.getDateText(routine.generatedAt),
      routine.approvedBy || '',
      routine.trainerNotes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 6000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // ===============================================================================
  // 📊 COMPUTED PROPERTIES (para el template)
  // ===============================================================================

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
    return this.getAverageTimeFormatted();
  }
}