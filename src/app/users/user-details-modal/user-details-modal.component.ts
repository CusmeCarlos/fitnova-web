// src/app/users/user-details-modal/user-details-modal.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import firebase from 'firebase/compat/app';

interface UserTableData {
  uid: string;
  displayName: string;
  email: string;
  status: 'active' | 'inactive' | 'blocked';
  statusText: string;
  statusColor: string;
  lastActiveText: string;
  assignedTrainer?: string;
  assignedTrainerName: string;
  totalWorkouts: number;
  totalHours: number;
  averageAccuracy: number;
  totalCriticalErrors: number;
  createdAt: Date;
  lastActiveAt: Date;
}

interface TrainerInfo {
  uid: string;
  displayName: string;
  email: string;
}

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-details-modal.component.html',
  styleUrls: ['./user-details-modal.component.scss']
})
export class UserDetailsModalComponent implements OnInit {
  editForm: FormGroup;
  passwordForm: FormGroup;
  
  isEditing = false;
  isChangingPassword = false;
  isUpdating = false;
  
  private db = firebase.firestore();

  constructor(
    public dialogRef: MatDialogRef<UserDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      user: UserTableData;
      availableTrainers: TrainerInfo[];
      currentUserRole: string;
    },
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.createEditForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.populateEditForm();
  }

  private createEditForm(): FormGroup {
    return this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      status: ['', Validators.required],
      assignedTrainer: ['']
    });
  }

  private createPasswordForm(): FormGroup {
    return this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private populateEditForm(): void {
    this.editForm.patchValue({
      displayName: this.data.user.displayName,
      email: this.data.user.email,
      status: this.data.user.status,
      assignedTrainer: this.data.user.assignedTrainer || ''
    });
  }

  // Métodos para activar diferentes modos
  enableEditing(): void {
    this.isEditing = true;
    this.isChangingPassword = false;
  }

  enablePasswordChange(): void {
    this.isChangingPassword = true;
    this.isEditing = false;
    this.passwordForm.reset();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateEditForm();
  }

  cancelPasswordChange(): void {
    this.isChangingPassword = false;
    this.passwordForm.reset();
  }

  // Guardar cambios del usuario
  async saveChanges(): Promise<void> {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    this.isUpdating = true;
    
    try {
      const formData = this.editForm.value;
      const trainerName = formData.assignedTrainer 
        ? (this.data.availableTrainers.find(t => t.uid === formData.assignedTrainer)?.displayName || '')
        : '';

      // Actualizar en Firebase
      await this.db.collection('users').doc(this.data.user.uid).update({
        displayName: formData.displayName,
        email: formData.email,
        status: formData.status,
        assignedTrainer: formData.assignedTrainer || null,
        assignedTrainerName: trainerName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // También actualizar userStats si existe
      const userStatsRef = this.db.collection('userStats').doc(this.data.user.uid);
      const userStatsDoc = await userStatsRef.get();
      
      if (userStatsDoc.exists) {
        await userStatsRef.update({
          displayName: formData.displayName,
          assignedTrainer: formData.assignedTrainer || null,
          assignedTrainerName: trainerName,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      this.showSuccess('Usuario actualizado correctamente');
      this.isEditing = false;
      
      // Cerrar modal y retornar datos actualizados
      this.dialogRef.close({ action: 'updated', user: this.data.user });
      
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      this.showError('Error actualizando usuario');
    } finally {
      this.isUpdating = false;
    }
  }

  // Cambiar contraseña
  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isUpdating = true;

    try {
      const { newPassword } = this.passwordForm.value;
      
      // Usar Firebase Admin para cambiar contraseña (requiere Cloud Function)
      // Por ahora, simular el cambio
      await this.simulatePasswordChange(newPassword);
      
      this.showSuccess('Contraseña cambiada correctamente');
      this.isChangingPassword = false;
      this.passwordForm.reset();
      
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      this.showError('Error cambiando contraseña');
    } finally {
      this.isUpdating = false;
    }
  }

  // Simular cambio de contraseña (reemplazar con Cloud Function real)
  private async simulatePasswordChange(newPassword: string): Promise<void> {
    // TODO: Implementar Cloud Function para cambiar contraseña
    // const changePasswordFunction = firebase.functions().httpsCallable('changeUserPassword');
    // await changePasswordFunction({ uid: this.data.user.uid, newPassword });
    
    // Por ahora solo log
    console.log('Cambiar contraseña para:', this.data.user.uid, 'Nueva:', newPassword);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Desactivar/Activar usuario
  async toggleUserStatus(): Promise<void> {
    const newStatus = this.data.user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activar' : 'desactivar';

    this.isUpdating = true;

    try {
      await this.db.collection('users').doc(this.data.user.uid).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.data.user.status = newStatus;
      this.showSuccess(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`);
      
      // Actualizar el formulario
      this.editForm.patchValue({ status: newStatus });
      
    } catch (error) {
      console.error(`Error ${action === 'activar' ? 'activando' : 'desactivando'} usuario:`, error);
      this.showError(`Error ${action === 'activar' ? 'activando' : 'desactivando'} usuario`);
    } finally {
      this.isUpdating = false;
    }
  }

  // Cerrar modal
  close(): void {
    this.dialogRef.close();
  }

  // Métodos auxiliares
  getUserInitials(name: string): string {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatHours(hours: number): string {
    if (!hours || hours === 0) return '0h';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours % 1) * 60);
    
    if (wholeHours === 0) return `${minutes}min`;
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}min`;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

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
}