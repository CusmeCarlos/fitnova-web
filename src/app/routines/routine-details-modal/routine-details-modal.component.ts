// src/app/routines/routine-details-modal/routine-details-modal.component.ts
// 🤖 MODAL DETALLES RUTINA PREMIUM - NIVEL FINZENAPP EXACTO

import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AIGeneratedRoutine, RoutineValidationAction, RoutineValidationService } from '../../core/routine-validation.service';
import { AuthService } from '../../core/auth.service';

export interface RoutineDetailsModalData {
  routine: AIGeneratedRoutine;
  mode: 'view' | 'edit';
}

@Component({
  selector: 'app-routine-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatExpansionModule,
    MatRadioModule,
    MatCheckboxModule
  ],
  templateUrl: './routine-details-modal.component.html',
  styleUrls: ['./routine-details-modal.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    trigger('slideIn', [
      state('void', style({ transform: 'translateX(-100%)' })),
      state('*', style({ transform: 'translateX(0)' })),
      transition('void => *', animate('400ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class RoutineDetailsModalComponent implements OnInit, OnDestroy {
  // ✅ ESTADO DEL COMPONENTE
  loading = false;
  saving = false;
  selectedTab = 0;
  currentUser: any = null;
  
  // ✅ FORMULARIOS
  routineForm: FormGroup;
  exercisesForm: FormGroup;
  validationForm: FormGroup;
  
  // ✅ DATOS CALCULADOS
  originalRoutine: AIGeneratedRoutine;
  hasChanges = false;
  
  // ✅ SUSCRIPCIONES
  private authSubscription?: Subscription;
  private formSubscription?: Subscription;

  constructor(
    public dialogRef: MatDialogRef<RoutineDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoutineDetailsModalData,
    private fb: FormBuilder,
    private routineService: RoutineValidationService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.originalRoutine = { ...data.routine };
    this.routineForm = this.createRoutineForm();
    this.exercisesForm = this.createExercisesForm();
    this.validationForm = this.createValidationForm();
  }

  ngOnInit(): void {
    console.log('🤖 Modal detalles rutina iniciado:', this.data);
    this.initializeSubscriptions();
    this.loadRoutineData();
    this.setupFormWatchers();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.formSubscription?.unsubscribe();
  }

  // ===============================================================================
  // 🔄 INICIALIZACIÓN
  // ===============================================================================

  private initializeSubscriptions(): void {
    this.authSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadRoutineData(): void {
    const routine = this.data.routine;
    
    // Cargar datos básicos de la rutina
    this.routineForm.patchValue({
      name: routine.routine?.name || '',
      description: routine.routine?.description || '',
      difficulty: routine.routine?.difficulty || 'intermediate',
      duration: routine.routine?.duration || 45,
      estimatedCalories: routine.routine?.estimatedCalories || 0,
      focusAreas: routine.routine?.focusAreas || []
    });

    // Cargar ejercicios
    this.loadExercises(routine.routine?.exercises || []);
  }

  private loadExercises(exercises: any[]): void {
    const exercisesArray = this.exercisesForm.get('exercises') as FormArray;
    exercisesArray.clear();

    exercises.forEach(exercise => {
      exercisesArray.push(this.createExerciseGroup(exercise));
    });

    if (exercises.length === 0) {
      this.addExercise(); // Agregar uno vacío si no hay ejercicios
    }
  }

  private setupFormWatchers(): void {
    this.formSubscription = this.routineForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });

    this.exercisesForm.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  // ===============================================================================
  // 📝 CREACIÓN DE FORMULARIOS
  // ===============================================================================

  private createRoutineForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''], // Hacer opcional
      difficulty: ['intermediate', Validators.required],
      duration: [45, [Validators.required, Validators.min(15), Validators.max(120)]],
      estimatedCalories: [0, [Validators.min(0)]],
      focusAreas: [[]]
    });
  }

  private createExercisesForm(): FormGroup {
    return this.fb.group({
      exercises: this.fb.array([])
    });
  }

  private createExerciseGroup(exercise: any = {}): FormGroup {
    return this.fb.group({
      name: [exercise.name || '', [Validators.required]],
      type: [exercise.type || 'strength'],
      muscleGroup: [exercise.muscleGroup || ''],
      sets: [exercise.sets || 3, [Validators.min(1), Validators.max(10)]],
      reps: [exercise.reps || 12, [Validators.min(1), Validators.max(50)]],
      duration: [exercise.duration || 0, [Validators.min(0)]],
      restTime: [exercise.restTime || 60, [Validators.min(15), Validators.max(300)]],
      instructions: [exercise.instructions || ''],
      equipment: [exercise.equipment || 'ninguno'],
      difficulty: [exercise.difficulty || 'intermediate'],
      calories: [exercise.calories || 0, [Validators.min(0)]],
      notes: [exercise.notes || '']
    });
  }

  private createValidationForm(): FormGroup {
    return this.fb.group({
      action: ['approve', Validators.required],
      trainerNotes: [''],
      rejectionReason: [''],
      modifications: [''],
      sendNotification: [true]
    });
  }

  // ===============================================================================
  // 🏋️ GESTIÓN DE EJERCICIOS
  // ===============================================================================

  get exercisesArray(): FormArray {
    return this.exercisesForm.get('exercises') as FormArray;
  }

  addExercise(): void {
    this.exercisesArray.push(this.createExerciseGroup());
    this.checkForChanges();
  }

  removeExercise(index: number): void {
    if (this.exercisesArray.length > 1) {
      this.exercisesArray.removeAt(index);
      this.checkForChanges();
    }
  }

  duplicateExercise(index: number): void {
    const exercise = this.exercisesArray.at(index).value;
    this.exercisesArray.insert(index + 1, this.createExerciseGroup({
      ...exercise,
      name: `${exercise.name} (Copia)`
    }));
    this.checkForChanges();
  }

  moveExerciseUp(index: number): void {
    if (index > 0) {
      const exercise = this.exercisesArray.at(index);
      this.exercisesArray.removeAt(index);
      this.exercisesArray.insert(index - 1, exercise);
      this.checkForChanges();
    }
  }

  moveExerciseDown(index: number): void {
    if (index < this.exercisesArray.length - 1) {
      const exercise = this.exercisesArray.at(index);
      this.exercisesArray.removeAt(index);
      this.exercisesArray.insert(index + 1, exercise);
      this.checkForChanges();
    }
  }

  // ===============================================================================
  // 💾 ACCIONES DE GUARDADO
  // ===============================================================================

  private checkForChanges(): void {
    // Simplificar la detección de cambios para que sea más sensible
    const currentRoutineData = this.routineForm.value;
    const currentExercisesData = this.exercisesForm.value.exercises;
    
    const originalRoutineData = {
      name: this.originalRoutine.routine?.name || '',
      description: this.originalRoutine.routine?.description || '',
      difficulty: this.originalRoutine.routine?.difficulty || 'intermediate',
      duration: this.originalRoutine.routine?.duration || 45,
      estimatedCalories: this.originalRoutine.routine?.estimatedCalories || 0,
      focusAreas: this.originalRoutine.routine?.focusAreas || []
    };
    
    const originalExercisesData = this.originalRoutine.routine?.exercises || [];

    // Detectar cambios en información básica
    const routineChanged = JSON.stringify(currentRoutineData) !== JSON.stringify(originalRoutineData);
    
    // Detectar cambios en ejercicios (más flexible)
    const exercisesChanged = currentExercisesData.length !== originalExercisesData.length ||
      currentExercisesData.some((exercise: any, index: number) => {
        const original = originalExercisesData[index];
        if (!original) return true;
        
        return exercise.name !== (original.name || '') ||
               exercise.sets !== (original.sets || 3) ||
               exercise.reps !== (original.reps || 12) ||
               exercise.duration !== (original.duration || 0) ||
               exercise.type !== (original.type || 'strength') ||
               exercise.muscleGroup !== (original.muscleGroup || '');
      });
    
    this.hasChanges = routineChanged || exercisesChanged;
    console.log('🔄 Cambios detectados:', { routineChanged, exercisesChanged, hasChanges: this.hasChanges });
  }

  private getFormData(): any {
    return {
      routine: this.routineForm.value,
      exercises: this.exercisesForm.value.exercises
    };
  }

  private getOriginalData(): any {
    return {
      routine: {
        name: this.originalRoutine.routine?.name || '',
        description: this.originalRoutine.routine?.description || '',
        difficulty: this.originalRoutine.routine?.difficulty || 'intermediate',
        duration: this.originalRoutine.routine?.duration || 45,
        estimatedCalories: this.originalRoutine.routine?.estimatedCalories || 0,
        focusAreas: this.originalRoutine.routine?.focusAreas || []
      },
      exercises: this.originalRoutine.routine?.exercises || []
    };
  }

  private forceRepaint(): void {
    const titles = document.querySelectorAll('mat-card-title.mat-mdc-card-title');
    
    titles.forEach((title: any) => {
      // Forzar repintado cambiando múltiples propiedades
      title.style.color = '#ffffff';
      title.style.setProperty('color', '#ffffff', 'important');
      title.style.opacity = '0.99';
      title.style.textShadow = '0 0 0 #ffffff';
      title.style.fontFamily = 'inherit';
      
      // Forzar re-renderizado
      title.offsetHeight;
      title.style.display = 'none';
      title.offsetHeight;
      title.style.display = '';
      
      // Cambio temporal para forzar repintado
      setTimeout(() => {
        title.style.opacity = '1';
      }, 10);
    });
    
    console.log('🎨 Repintado forzado aplicado a', titles.length, 'títulos');
  }
  

  async saveChanges(): Promise<void> {
    console.log('🔄 Iniciando saveChanges...');
    
    // Validación más flexible - solo verificar campos críticos
    const routineFormHasErrors = this.routineForm.get('name')?.hasError('required') || 
                                this.routineForm.get('name')?.hasError('minlength');
    
    const exercisesFormHasErrors = this.exercisesArray.controls.some(control => 
      control.get('name')?.hasError('required') || 
      control.get('sets')?.hasError('min') ||
      control.get('sets')?.hasError('max')
    );

    if (routineFormHasErrors || exercisesFormHasErrors) {
      this.showError('Por favor corrige los errores críticos: nombre de rutina y nombres de ejercicios son requeridos');
      return;
    }

    this.saving = true;

    try {
      const updatedRoutine: AIGeneratedRoutine = {
        ...this.data.routine,
        routine: {
          ...this.data.routine.routine,
          name: this.routineForm.get('name')?.value || 'Rutina Personalizada',
          description: this.routineForm.get('description')?.value || '',
          difficulty: this.routineForm.get('difficulty')?.value || 'intermediate',
          duration: this.routineForm.get('duration')?.value || 45,
          estimatedCalories: this.routineForm.get('estimatedCalories')?.value || 0,
          focusAreas: this.routineForm.get('focusAreas')?.value || [],
          exercises: this.exercisesForm.value.exercises || []
        }
      };

      console.log('💾 Datos a guardar:', updatedRoutine);
      console.log('🔍 Verificando si existe updateRoutine en servicio:', typeof this.routineService.updateRoutine);
      
      // ✅ VERIFICAR SI EL MÉTODO EXISTE
      if (typeof this.routineService.updateRoutine !== 'function') {
        console.error('❌ El método updateRoutine no existe en el servicio');
        this.showError('Error: método updateRoutine no implementado en el servicio');
        return;
      }
      
      console.log('📤 Llamando a updateRoutine...');
      
      // Usar el servicio para actualizar en Firebase
      const success = await this.routineService.updateRoutine(updatedRoutine);
      
      console.log('📥 Resultado de updateRoutine:', success);
      
      if (success) {
        this.showSuccess('Rutina actualizada exitosamente en Firebase');
        this.originalRoutine = { ...updatedRoutine };
        this.hasChanges = false;
        
        // Actualizar los datos del modal
        this.data.routine = updatedRoutine;
        
        console.log('✅ Proceso de guardado completado exitosamente');
      } else {
        throw new Error('updateRoutine retornó false');
      }

    } catch (error) {
      console.error('❌ Error detallado guardando cambios:', error);
      this.showError(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      this.saving = false;
    }
  }

  // ===============================================================================
  // ✅ ACCIONES DE VALIDACIÓN
  // ===============================================================================

  async approveRoutine(): Promise<void> {
    if (!this.currentUser?.uid) {
      this.showError('No hay usuario autenticado');
      return;
    }

    if (this.hasChanges) {
      const confirmSave = confirm('Hay cambios sin guardar. ¿Deseas guardarlos antes de aprobar?');
      if (confirmSave) {
        await this.saveChanges();
      }
    }

    this.saving = true;

    try {
      const action: RoutineValidationAction = {
        routineId: this.data.routine.id,
        action: 'approve',
        trainerNotes: this.validationForm.get('trainerNotes')?.value || '',
        trainerId: this.currentUser.uid,
        trainerName: this.currentUser.displayName || this.currentUser.email || 'Entrenador'
      };

      const success = await this.routineService.approveRoutine(action);
      
      if (success) {
        this.showSuccess('Rutina aprobada exitosamente');
        // Retornar datos actualizados al cerrar
        this.dialogRef.close({ 
          action: 'approved', 
          routine: this.data.routine,
          changes: this.hasChanges 
        });
      }

    } catch (error) {
      console.error('Error aprobando rutina:', error);
      this.showError('Error al aprobar la rutina');
    } finally {
      this.saving = false;
    }
  }

  // En routine-details-modal.component.ts
// Reemplazar el método rejectRoutine() existente con este:

async rejectRoutine(): Promise<void> {
  if (!this.currentUser?.uid) {
    this.showError('No hay usuario autenticado');
    return;
  }

  // ✅ SOLICITAR RAZÓN DEL RECHAZO AL PRESIONAR EL BOTÓN
  const reason = prompt('Por favor especifica la razón del rechazo:\n\n(Ej: Los ejercicios no son apropiados para el nivel del usuario, faltan ejercicios de calentamiento, etc.)');
  
  if (!reason || reason.trim() === '') {
    this.showError('Debe especificar una razón para el rechazo');
    return;
  }

  // Confirmación adicional
  const confirmReject = confirm(`¿Estás seguro de que quieres rechazar esta rutina?\n\nRazón: ${reason}`);
  if (!confirmReject) return;

  this.saving = true;

  try {
    const action: RoutineValidationAction = {
      routineId: this.data.routine.id,
      action: 'reject',
      rejectionReason: reason.trim(),
      trainerNotes: this.validationForm.get('trainerNotes')?.value || '',
      trainerId: this.currentUser.uid,
      trainerName: this.currentUser.displayName || this.currentUser.email || 'Entrenador'
    };

    console.log('❌ Rechazando rutina:', action);
    
    const success = await this.routineService.rejectRoutine(action);
    
    if (success) {
      this.showSuccess('Rutina rechazada exitosamente');
      
      // Retornar datos actualizados al cerrar
      this.dialogRef.close({ 
        action: 'rejected', 
        routine: this.data.routine,
        changes: this.hasChanges,
        rejectionReason: reason
      });
    }

  } catch (error) {
    console.error('❌ Error rechazando rutina:', error);
    this.showError('Error al rechazar la rutina');
  } finally {
    this.saving = false;
  }
}

  // ===============================================================================
  // 🎨 HELPERS PARA DISPLAY
  // ===============================================================================

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'var(--accent-green)';
      case 'intermediate': return 'var(--accent-yellow)';
      case 'advanced': return 'var(--accent-red)';
      default: return 'var(--accent-blue)';
    }
  }

  getTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'cardio': return 'directions_run';
      case 'strength': return 'fitness_center';
      case 'flexibility': return 'self_improvement';
      case 'balance': return 'accessibility';
      default: return 'fitness_center';
    }
  }

  getMuscleGroupColor(muscleGroup: string): string {
    const colors = [
      'var(--accent-blue)', 'var(--accent-green)', 'var(--accent-purple)',
      'var(--accent-yellow)', 'var(--accent-red)'
    ];
    const hash = muscleGroup.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  getConfidencePercentage(): number {
    const confidence = this.data.routine.aiConfidence || 0;
    
    // Si el valor ya está en porcentaje (mayor a 1), devolverlo como está
    if (confidence > 1) {
      return Math.round(confidence);
    }
    
    // Si está en decimal (0.75), convertir a porcentaje
    return Math.round(confidence * 100);
  }

  getTotalCalories(): number {
    return this.exercisesArray.controls.reduce((total, exercise) => {
      return total + (exercise.get('calories')?.value || 0);
    }, 0);
  }

  getEstimatedDuration(): number {
    return this.exercisesArray.controls.reduce((total, exercise) => {
      const sets = exercise.get('sets')?.value || 0;
      const duration = exercise.get('duration')?.value || 0;
      const restTime = exercise.get('restTime')?.value || 0;
      return total + (sets * (duration + restTime));
    }, 0);
  }

  // ===============================================================================
  // 🔄 ACCIONES DEL MODAL
  // ===============================================================================

  onClose(): void {
    if (this.hasChanges) {
      const confirmClose = confirm('Hay cambios sin guardar. ¿Estás seguro de que quieres cerrar?');
      if (!confirmClose) return;
    }
    
    // Retornar los datos actualizados aunque no se hayan guardado
    this.dialogRef.close({ 
      action: 'closed', 
      routine: this.data.routine,
      changes: this.hasChanges,
      hasUnsavedChanges: this.hasChanges 
    });
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
  }

  // ===============================================================================
  // 🔧 UTILITIES
  // ===============================================================================

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

  // ===============================================================================
  // 📊 GETTERS PARA TEMPLATES
  // ===============================================================================

  get totalExercises(): number {
    return this.exercisesArray.length;
  }

  get routineValid(): boolean {
    // Validación más flexible - solo verificar que tenga nombre de rutina
    const hasRoutineName = this.routineForm.get('name')?.value && 
                          this.routineForm.get('name')?.value.trim().length >= 3;
    
    // Verificar que al menos haya un ejercicio con nombre
    const hasValidExercises = this.exercisesArray.controls.length > 0 &&
                             this.exercisesArray.controls.some(control => 
                               control.get('name')?.value && 
                               control.get('name')?.value.trim().length > 0
                             );
    
    return hasRoutineName && hasValidExercises;
  }

  get canApprove(): boolean {
    return this.data.routine.status === 'pending_approval' && this.routineValid;
  }

  get userName(): string {
    return this.data.routine.userDisplayName || 'Usuario';
  }

  get userEmail(): string {
    return this.data.routine.userEmail || '';
  }

  get generatedDate(): string {
    if (!this.data.routine.generatedAt) return 'Sin fecha';
    
    const date = this.data.routine.generatedAt.toDate ? 
      this.data.routine.generatedAt.toDate() : 
      new Date(this.data.routine.generatedAt);
      
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}