// src/app/shared/settings/settings.component.ts
// ⚙️ CONFIGURACIÓN DEL SISTEMA ULTRA PREMIUM - NIVEL FINZENAPP

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// ✅ SERVICIOS
import { SettingsService, SystemSettings, AISettings, GymSettings, NotificationSettings, BackupSettings, SecuritySettings } from '../../core/settings.service';
import { AuthService } from '../../core/auth.service';

// ✅ MATERIAL DESIGN
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: 'settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  // ✅ ESTADO DEL COMPONENTE
  isLoading = true;
  systemSettings: SystemSettings | null = null;
  currentUser: any = null;
  selectedTabIndex = 0;

  // ✅ FORMULARIOS REACTIVOS
  aiForm!: FormGroup;
  gymForm!: FormGroup;
  notificationForm!: FormGroup;
  backupForm!: FormGroup;
  securityForm!: FormGroup;

  // ✅ SUBSCRIPCIONES
  private subscriptions = new Subscription();

  // ✅ OPCIONES PARA SELECTS
  backupFrequencyOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' }
  ];

  backupLocationOptions = [
    { value: 'firebase', label: 'Firebase Cloud' },
    { value: 'local', label: 'Almacenamiento Local' },
    { value: 'cloud', label: 'Google Cloud' }
  ];

  operatingDaysOptions = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  constructor(
    private settingsService: SettingsService,
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    console.log('⚙️ SettingsComponent inicializado');
    this.initializeForms();
  }

  ngOnInit(): void {
    console.log('🔄 Inicializando configuración...');
    this.loadCurrentUser();
    this.loadSystemSettings();
  }

  ngOnDestroy(): void {
    console.log('🔥 Limpiando SettingsComponent...');
    this.subscriptions.unsubscribe();
  }

  // ================================================================================
  // 🔧 INICIALIZACIÓN
  // ================================================================================

  private initializeForms(): void {
    // Formulario de Configuración IA
    this.aiForm = this.fb.group({
      poseSensitivity: [0.7, [Validators.min(0.1), Validators.max(1.0)]],
      confidenceThreshold: [0.8, [Validators.min(0.5), Validators.max(0.95)]],
      detectionThreshold: [0.6, [Validators.min(0.3), Validators.max(0.8)]],
      criticalThreshold: [0.9, [Validators.min(0.8), Validators.max(1.0)]],
      highThreshold: [0.75, [Validators.min(0.6), Validators.max(0.8)]],
      mediumThreshold: [0.5, [Validators.min(0.4), Validators.max(0.6)]],
      lowThreshold: [0.3, [Validators.min(0.2), Validators.max(0.4)]],
      gptCreativity: [0.7, [Validators.min(0.1), Validators.max(1.0)]],
      gptResponseLength: [500, [Validators.min(100), Validators.max(1000)]],
      autoApprovalThreshold: [0.85, [Validators.min(0.75), Validators.max(0.95)]],
      processingInterval: [200, [Validators.min(100), Validators.max(1000)]],
      maxFramesPerSecond: [30, [Validators.min(15), Validators.max(60)]]
    });

    // Formulario de Configuración Gimnasio
    this.gymForm = this.fb.group({
      name: ['Gimnasio GYMSHARK', [Validators.required, Validators.minLength(3)]],
      address: ['Cordillera del Cóndor, La Libertad, Santa Elena', [Validators.required]],
      phone: ['+593-999-123-456', [Validators.required]],
      email: ['info@gymshark.com', [Validators.required, Validators.email]],
      openTime: ['06:00', [Validators.required]],
      closeTime: ['22:00', [Validators.required]],
      operatingDays: [['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']],
      maxUsers: [30, [Validators.min(1), Validators.max(100)]],
      maxTrainers: [5, [Validators.min(1), Validators.max(20)]],
      maxSessionDuration: [120, [Validators.min(30), Validators.max(300)]],
      maintenanceMode: [false]
    });

    // Formulario de Notificaciones
    this.notificationForm = this.fb.group({
      enableCriticalAlerts: [true],
      criticalAlertSound: [true],
      criticalAlertEmail: [true],
      criticalAlertSMS: [false],
      enableSystemNotifications: [true],
      dailyReports: [true],
      weeklyReports: [true],
      monthlyReports: [false],
      emailRecipients: [['admin@gymshark.com']],
      emailTemplate: ['default']
    });

    // Formulario de Backup
    this.backupForm = this.fb.group({
      enableAutoBackup: [true],
      backupFrequency: ['daily', [Validators.required]],
      backupTime: ['02:00', [Validators.required]],
      retentionDays: [30, [Validators.min(7), Validators.max(365)]],
      includeUserData: [true],
      includeAlerts: [true],
      includeRoutines: [true],
      includeSettings: [true],
      backupLocation: ['firebase', [Validators.required]],
      maxBackupSize: [500, [Validators.min(100), Validators.max(2000)]]
    });

    // Formulario de Seguridad
    this.securityForm = this.fb.group({
      sessionTimeout: [120, [Validators.min(15), Validators.max(480)]],
      maxLoginAttempts: [3, [Validators.min(2), Validators.max(10)]],
      lockoutDuration: [15, [Validators.min(5), Validators.max(60)]],
      requirePasswordChange: [false],
      passwordExpiryDays: [90, [Validators.min(30), Validators.max(365)]],
      minPasswordLength: [8, [Validators.min(6), Validators.max(32)]],
      requireSpecialChars: [true],
      allowMultipleSessions: [false],
      enableTwoFactor: [false],
      enableAuditLog: [true],
      auditRetentionDays: [90, [Validators.min(30), Validators.max(365)]]
    });
  }

  private loadCurrentUser(): void {
    const userSub = this.auth.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('👤 Usuario actual cargado:', user?.email);
      },
      error: (error) => {
        console.error('❌ Error cargando usuario:', error);
      }
    });

    this.subscriptions.add(userSub);
  }

  private loadSystemSettings(): void {
    this.isLoading = true;

    // Suscribirse a configuración del sistema
    const settingsSub = this.settingsService.settings$.subscribe({
      next: (settings) => {
        if (settings) {
          console.log('✅ Configuración del sistema cargada:', settings);
          this.systemSettings = settings;
          this.populateForms(settings);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Error cargando configuración:', error);
        this.isLoading = false;
        this.showErrorMessage('Error cargando configuración del sistema');
      }
    });

    // Suscribirse al estado de carga
    const loadingSub = this.settingsService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });

    this.subscriptions.add(settingsSub);
    this.subscriptions.add(loadingSub);
  }

  private populateForms(settings: SystemSettings): void {
    console.log('📝 Poblando formularios con configuración existente...');

    // Poblar formulario IA
    this.aiForm.patchValue({
      poseSensitivity: settings.aiSettings.poseSensitivity,
      confidenceThreshold: settings.aiSettings.confidenceThreshold,
      detectionThreshold: settings.aiSettings.detectionThreshold,
      criticalThreshold: settings.aiSettings.criticalThreshold,
      highThreshold: settings.aiSettings.highThreshold,
      mediumThreshold: settings.aiSettings.mediumThreshold,
      lowThreshold: settings.aiSettings.lowThreshold,
      gptCreativity: settings.aiSettings.gptCreativity,
      gptResponseLength: settings.aiSettings.gptResponseLength,
      autoApprovalThreshold: settings.aiSettings.autoApprovalThreshold,
      processingInterval: settings.aiSettings.processingInterval,
      maxFramesPerSecond: settings.aiSettings.maxFramesPerSecond
    });

    // Poblar formulario gimnasio
    this.gymForm.patchValue({
      name: settings.gymSettings.name,
      address: settings.gymSettings.address,
      phone: settings.gymSettings.phone,
      email: settings.gymSettings.email,
      openTime: settings.gymSettings.openTime,
      closeTime: settings.gymSettings.closeTime,
      operatingDays: settings.gymSettings.operatingDays,
      maxUsers: settings.gymSettings.maxUsers,
      maxTrainers: settings.gymSettings.maxTrainers,
      maxSessionDuration: settings.gymSettings.maxSessionDuration,
      maintenanceMode: settings.gymSettings.maintenanceMode
    });

    // Poblar formulario notificaciones
    this.notificationForm.patchValue({
      enableCriticalAlerts: settings.notificationSettings.enableCriticalAlerts,
      criticalAlertSound: settings.notificationSettings.criticalAlertSound,
      criticalAlertEmail: settings.notificationSettings.criticalAlertEmail,
      criticalAlertSMS: settings.notificationSettings.criticalAlertSMS,
      enableSystemNotifications: settings.notificationSettings.enableSystemNotifications,
      dailyReports: settings.notificationSettings.dailyReports,
      weeklyReports: settings.notificationSettings.weeklyReports,
      monthlyReports: settings.notificationSettings.monthlyReports,
      emailRecipients: settings.notificationSettings.emailRecipients,
      emailTemplate: settings.notificationSettings.emailTemplate
    });

    // Poblar formulario backup
    this.backupForm.patchValue({
      enableAutoBackup: settings.backupSettings.enableAutoBackup,
      backupFrequency: settings.backupSettings.backupFrequency,
      backupTime: settings.backupSettings.backupTime,
      retentionDays: settings.backupSettings.retentionDays,
      includeUserData: settings.backupSettings.includeUserData,
      includeAlerts: settings.backupSettings.includeAlerts,
      includeRoutines: settings.backupSettings.includeRoutines,
      includeSettings: settings.backupSettings.includeSettings,
      backupLocation: settings.backupSettings.backupLocation,
      maxBackupSize: settings.backupSettings.maxBackupSize
    });

    // Poblar formulario seguridad
    this.securityForm.patchValue({
      sessionTimeout: settings.securitySettings.sessionTimeout,
      maxLoginAttempts: settings.securitySettings.maxLoginAttempts,
      lockoutDuration: settings.securitySettings.lockoutDuration,
      requirePasswordChange: settings.securitySettings.requirePasswordChange,
      passwordExpiryDays: settings.securitySettings.passwordExpiryDays,
      minPasswordLength: settings.securitySettings.minPasswordLength,
      requireSpecialChars: settings.securitySettings.requireSpecialChars,
      allowMultipleSessions: settings.securitySettings.allowMultipleSessions,
      enableTwoFactor: settings.securitySettings.enableTwoFactor,
      enableAuditLog: settings.securitySettings.enableAuditLog,
      auditRetentionDays: settings.securitySettings.auditRetentionDays
    });

    console.log('✅ Formularios poblados exitosamente');
  }

  // ================================================================================
  // 💾 MÉTODOS PARA GUARDAR CONFIGURACIÓN
  // ================================================================================

  async saveAISettings(): Promise<void> {
    if (this.aiForm.invalid || !this.currentUser) {
      this.showErrorMessage('Formulario inválido o usuario no autenticado');
      return;
    }

    try {
      console.log('🤖 Guardando configuración de IA...');
      
      const formValue = this.aiForm.value;
      await this.settingsService.updateAISettings(formValue, this.currentUser.email);
      
      this.showSuccessMessage('Configuración de IA actualizada exitosamente');
      console.log('✅ Configuración IA guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración IA:', error);
      this.showErrorMessage('Error al guardar configuración de IA');
    }
  }

  async saveGymSettings(): Promise<void> {
    if (this.gymForm.invalid || !this.currentUser) {
      this.showErrorMessage('Formulario inválido o usuario no autenticado');
      return;
    }

    try {
      console.log('🏋️ Guardando configuración del gimnasio...');
      
      const formValue = this.gymForm.value;
      await this.settingsService.updateGymSettings(formValue, this.currentUser.email);
      
      this.showSuccessMessage('Configuración del gimnasio actualizada exitosamente');
      console.log('✅ Configuración gimnasio guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración gimnasio:', error);
      this.showErrorMessage('Error al guardar configuración del gimnasio');
    }
  }

  async saveNotificationSettings(): Promise<void> {
    if (this.notificationForm.invalid || !this.currentUser) {
      this.showErrorMessage('Formulario inválido o usuario no autenticado');
      return;
    }

    try {
      console.log('🔔 Guardando configuración de notificaciones...');
      
      const formValue = this.notificationForm.value;
      await this.settingsService.updateNotificationSettings(formValue, this.currentUser.email);
      
      this.showSuccessMessage('Configuración de notificaciones actualizada exitosamente');
      console.log('✅ Configuración notificaciones guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración notificaciones:', error);
      this.showErrorMessage('Error al guardar configuración de notificaciones');
    }
  }

  async saveBackupSettings(): Promise<void> {
    if (this.backupForm.invalid || !this.currentUser) {
      this.showErrorMessage('Formulario inválido o usuario no autenticado');
      return;
    }

    try {
      console.log('💾 Guardando configuración de backup...');
      
      const formValue = this.backupForm.value;
      await this.settingsService.updateBackupSettings(formValue, this.currentUser.email);
      
      this.showSuccessMessage('Configuración de backup actualizada exitosamente');
      console.log('✅ Configuración backup guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración backup:', error);
      this.showErrorMessage('Error al guardar configuración de backup');
    }
  }

  async saveSecuritySettings(): Promise<void> {
    if (this.securityForm.invalid || !this.currentUser) {
      this.showErrorMessage('Formulario inválido o usuario no autenticado');
      return;
    }

    try {
      console.log('🔒 Guardando configuración de seguridad...');
      
      const formValue = this.securityForm.value;
      await this.settingsService.updateSecuritySettings(formValue, this.currentUser.email);
      
      this.showSuccessMessage('Configuración de seguridad actualizada exitosamente');
      console.log('✅ Configuración seguridad guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración seguridad:', error);
      this.showErrorMessage('Error al guardar configuración de seguridad');
    }
  }

  // ================================================================================
  // 🔧 MÉTODOS UTILITARIOS
  // ================================================================================

  async createManualBackup(): Promise<void> {
    try {
      console.log('📦 Creando backup manual...');
      await this.settingsService.createBackup();
      this.showSuccessMessage('Backup creado exitosamente');
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      this.showErrorMessage('Error al crear backup');
    }
  }

  async resetToDefaults(): Promise<void> {
    const confirmed = confirm('¿Estás seguro de que quieres restaurar toda la configuración a valores por defecto? Esta acción no se puede deshacer.');
    
    if (!confirmed) return;

    try {
      console.log('🔄 Restaurando configuración por defecto...');
      await this.settingsService.resetToDefaults();
      this.showSuccessMessage('Configuración restaurada a valores por defecto');
    } catch (error) {
      console.error('❌ Error restaurando configuración:', error);
      this.showErrorMessage('Error al restaurar configuración');
    }
  }

  exportSettings(): void {
    console.log('📤 Exportando configuración...');
    this.settingsService.exportSettings();
    this.showSuccessMessage('Configuración exportada exitosamente');
  }

  refreshSettings(): void {
    console.log('🔄 Refrescando configuración...');
    this.settingsService.refreshSettings();
    this.showSuccessMessage('Configuración actualizada');
  }

  goBack(): void {
    console.log('🔙 Volviendo al dashboard...');
    this.router.navigate(['/dashboard/overview']);
  }

  // ================================================================================
  // 🛠️ MÉTODOS HELPER
  // ================================================================================

  formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getBackupStatusColor(): String {
    if (!this.systemSettings?.backupSettings.lastBackup) return 'warn';
    
    const daysSinceBackup = Math.floor(
      (Date.now() - this.systemSettings.backupSettings.lastBackup.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceBackup <= 1) return 'primary';
    if (daysSinceBackup <= 7) return 'accent';
    return 'warn';
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}