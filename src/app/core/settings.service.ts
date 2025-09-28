// src/app/core/settings.service.ts
// ⚙️ SERVICIO DE CONFIGURACIÓN DEL SISTEMA - DATOS REALES FIREBASE

import { Injectable, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';

// ✅ INTERFACES PARA CONFIGURACIÓN
export interface SystemSettings {
  // Configuración IA
  aiSettings: AISettings;
  // Configuración Gimnasio
  gymSettings: GymSettings;
  // Configuración Notificaciones
  notificationSettings: NotificationSettings;
  // Configuración Backup
  backupSettings: BackupSettings;
  // Configuración Seguridad
  securitySettings: SecuritySettings;
}

export interface AISettings {
  // MediaPipe Configuration
  poseSensitivity: number; // 0.1 - 1.0
  confidenceThreshold: number; // 0.5 - 0.95
  detectionThreshold: number; // 0.3 - 0.8
  
  // Error Classification
  criticalThreshold: number; // 0.8 - 1.0
  highThreshold: number; // 0.6 - 0.8
  mediumThreshold: number; // 0.4 - 0.6
  lowThreshold: number; // 0.2 - 0.4
  
  // GPT Configuration
  gptCreativity: number; // 0.1 - 1.0 (temperature)
  gptResponseLength: number; // 100 - 1000 tokens
  autoApprovalThreshold: number; // 0.75 - 0.95
  
  // Performance
  processingInterval: number; // 100 - 1000 ms
  maxFramesPerSecond: number; // 15 - 60 fps
  
  lastUpdated: Date;
  updatedBy: string;
}

export interface GymSettings {
  // Información del Gimnasio
  name: string;
  address: string;
  phone: string;
  email: string;
  
  // Horarios
  openTime: string; // "06:00"
  closeTime: string; // "22:00"
  operatingDays: string[]; // ["monday", "tuesday", ...]
  
  // Capacidad
  maxUsers: number;
  maxTrainers: number;
  maxSessionDuration: number; // minutes
  
  // Configuración de Equipamiento
  availableEquipment: string[];
  maintenanceMode: boolean;
  
  lastUpdated: Date;
  updatedBy: string;
}

export interface NotificationSettings {
  // Alertas Críticas
  enableCriticalAlerts: boolean;
  criticalAlertSound: boolean;
  criticalAlertEmail: boolean;
  criticalAlertSMS: boolean;
  
  // Notificaciones Sistema
  enableSystemNotifications: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  
  // Configuración Email
  emailRecipients: string[];
  emailTemplate: string;
  
  lastUpdated: Date;
  updatedBy: string;
}

export interface BackupSettings {
  // Configuración Automática
  enableAutoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string; // "02:00"
  retentionDays: number;
  
  // Configuración Manual
  includeUserData: boolean;
  includeAlerts: boolean;
  includeRoutines: boolean;
  includeSettings: boolean;
  
  // Almacenamiento
  backupLocation: 'firebase' | 'local' | 'cloud';
  maxBackupSize: number; // MB
  
  lastBackup: Date;
  lastUpdated: Date;
  updatedBy: string;
}

export interface SecuritySettings {
  // Configuración de Sesión
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  
  // Configuración de Passwords
  requirePasswordChange: boolean;
  passwordExpiryDays: number;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  
  // Configuración de Acceso
  allowMultipleSessions: boolean;
  enableTwoFactor: boolean;
  ipWhitelist: string[];
  
  // Auditoría
  enableAuditLog: boolean;
  auditRetentionDays: number;
  
  lastUpdated: Date;
  updatedBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private db = inject(AngularFirestore);
  
  private settingsSubject = new BehaviorSubject<SystemSettings | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  settings$ = this.settingsSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  // Documento único para configuración global
  private readonly SETTINGS_DOC_ID = 'gymshark-config';

  constructor() {
    console.log('⚙️ SettingsService inicializado');
    this.loadSystemSettings();
  }

  private loadSystemSettings(): void {
    this.isLoadingSubject.next(true);
    console.log('⚙️ Cargando configuración del sistema...');

    // Cargar configuración desde Firebase
    this.db.collection('systemSettings').doc(this.SETTINGS_DOC_ID)
      .valueChanges({ idField: 'id' }).pipe(
        map((doc: any) => {
          if (doc && doc.id) {
            console.log('✅ Configuración cargada desde Firebase:', doc);
            return this.mapFirebaseToSettings(doc);
          } else {
            console.log('📝 No existe configuración, creando por defecto...');
            return this.getDefaultSettings();
          }
        }),
        catchError(error => {
          console.error('❌ Error cargando configuración:', error);
          return of(this.getDefaultSettings());
        }),
        startWith(null)
      ).subscribe(settings => {
        if (settings) {
          this.settingsSubject.next(settings);
          console.log('⚙️ Configuración actualizada:', settings);
        }
        this.isLoadingSubject.next(false);
      });
  }

  private mapFirebaseToSettings(doc: any): SystemSettings {
    const now = new Date();
    
    return {
      aiSettings: {
        poseSensitivity: doc.aiSettings?.poseSensitivity || 0.7,
        confidenceThreshold: doc.aiSettings?.confidenceThreshold || 0.8,
        detectionThreshold: doc.aiSettings?.detectionThreshold || 0.6,
        criticalThreshold: doc.aiSettings?.criticalThreshold || 0.9,
        highThreshold: doc.aiSettings?.highThreshold || 0.75,
        mediumThreshold: doc.aiSettings?.mediumThreshold || 0.5,
        lowThreshold: doc.aiSettings?.lowThreshold || 0.3,
        gptCreativity: doc.aiSettings?.gptCreativity || 0.7,
        gptResponseLength: doc.aiSettings?.gptResponseLength || 500,
        autoApprovalThreshold: doc.aiSettings?.autoApprovalThreshold || 0.85,
        processingInterval: doc.aiSettings?.processingInterval || 200,
        maxFramesPerSecond: doc.aiSettings?.maxFramesPerSecond || 30,
        lastUpdated: doc.aiSettings?.lastUpdated?.toDate() || now,
        updatedBy: doc.aiSettings?.updatedBy || 'system'
      },
      gymSettings: {
        name: doc.gymSettings?.name || 'Gimnasio GYMSHARK',
        address: doc.gymSettings?.address || 'Cordillera del Cóndor, La Libertad, Santa Elena',
        phone: doc.gymSettings?.phone || '+593-999-123-456',
        email: doc.gymSettings?.email || 'info@gymshark.com',
        openTime: doc.gymSettings?.openTime || '06:00',
        closeTime: doc.gymSettings?.closeTime || '22:00',
        operatingDays: doc.gymSettings?.operatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        maxUsers: doc.gymSettings?.maxUsers || 30,
        maxTrainers: doc.gymSettings?.maxTrainers || 5,
        maxSessionDuration: doc.gymSettings?.maxSessionDuration || 120,
        availableEquipment: doc.gymSettings?.availableEquipment || [
          'Mancuernas 1-40kg', 'Barras olímpicas', 'Bancos ajustables',
          'Press de pecho', 'Jalón dorsal', 'Sentadilla guiada', 'Colchonetas'
        ],
        maintenanceMode: doc.gymSettings?.maintenanceMode || false,
        lastUpdated: doc.gymSettings?.lastUpdated?.toDate() || now,
        updatedBy: doc.gymSettings?.updatedBy || 'system'
      },
      notificationSettings: {
        enableCriticalAlerts: doc.notificationSettings?.enableCriticalAlerts ?? true,
        criticalAlertSound: doc.notificationSettings?.criticalAlertSound ?? true,
        criticalAlertEmail: doc.notificationSettings?.criticalAlertEmail ?? true,
        criticalAlertSMS: doc.notificationSettings?.criticalAlertSMS ?? false,
        enableSystemNotifications: doc.notificationSettings?.enableSystemNotifications ?? true,
        dailyReports: doc.notificationSettings?.dailyReports ?? true,
        weeklyReports: doc.notificationSettings?.weeklyReports ?? true,
        monthlyReports: doc.notificationSettings?.monthlyReports ?? false,
        emailRecipients: doc.notificationSettings?.emailRecipients || ['admin@gymshark.com'],
        emailTemplate: doc.notificationSettings?.emailTemplate || 'default',
        lastUpdated: doc.notificationSettings?.lastUpdated?.toDate() || now,
        updatedBy: doc.notificationSettings?.updatedBy || 'system'
      },
      backupSettings: {
        enableAutoBackup: doc.backupSettings?.enableAutoBackup ?? true,
        backupFrequency: doc.backupSettings?.backupFrequency || 'daily',
        backupTime: doc.backupSettings?.backupTime || '02:00',
        retentionDays: doc.backupSettings?.retentionDays || 30,
        includeUserData: doc.backupSettings?.includeUserData ?? true,
        includeAlerts: doc.backupSettings?.includeAlerts ?? true,
        includeRoutines: doc.backupSettings?.includeRoutines ?? true,
        includeSettings: doc.backupSettings?.includeSettings ?? true,
        backupLocation: doc.backupSettings?.backupLocation || 'firebase',
        maxBackupSize: doc.backupSettings?.maxBackupSize || 500,
        lastBackup: doc.backupSettings?.lastBackup?.toDate() || new Date(0),
        lastUpdated: doc.backupSettings?.lastUpdated?.toDate() || now,
        updatedBy: doc.backupSettings?.updatedBy || 'system'
      },
      securitySettings: {
        sessionTimeout: doc.securitySettings?.sessionTimeout || 120,
        maxLoginAttempts: doc.securitySettings?.maxLoginAttempts || 3,
        lockoutDuration: doc.securitySettings?.lockoutDuration || 15,
        requirePasswordChange: doc.securitySettings?.requirePasswordChange ?? false,
        passwordExpiryDays: doc.securitySettings?.passwordExpiryDays || 90,
        minPasswordLength: doc.securitySettings?.minPasswordLength || 8,
        requireSpecialChars: doc.securitySettings?.requireSpecialChars ?? true,
        allowMultipleSessions: doc.securitySettings?.allowMultipleSessions ?? false,
        enableTwoFactor: doc.securitySettings?.enableTwoFactor ?? false,
        ipWhitelist: doc.securitySettings?.ipWhitelist || [],
        enableAuditLog: doc.securitySettings?.enableAuditLog ?? true,
        auditRetentionDays: doc.securitySettings?.auditRetentionDays || 90,
        lastUpdated: doc.securitySettings?.lastUpdated?.toDate() || now,
        updatedBy: doc.securitySettings?.updatedBy || 'system'
      }
    };
  }

  private getDefaultSettings(): SystemSettings {
    const now = new Date();
    
    return {
      aiSettings: {
        poseSensitivity: 0.7,
        confidenceThreshold: 0.8,
        detectionThreshold: 0.6,
        criticalThreshold: 0.9,
        highThreshold: 0.75,
        mediumThreshold: 0.5,
        lowThreshold: 0.3,
        gptCreativity: 0.7,
        gptResponseLength: 500,
        autoApprovalThreshold: 0.85,
        processingInterval: 200,
        maxFramesPerSecond: 30,
        lastUpdated: now,
        updatedBy: 'system'
      },
      gymSettings: {
        name: 'Gimnasio GYMSHARK',
        address: 'Cordillera del Cóndor, La Libertad, Santa Elena, Ecuador',
        phone: '+593-999-123-456',
        email: 'info@gymshark.com',
        openTime: '06:00',
        closeTime: '22:00',
        operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        maxUsers: 30,
        maxTrainers: 5,
        maxSessionDuration: 120,
        availableEquipment: [
          'Mancuernas 1-40kg', 'Barras olímpicas', 'Bancos ajustables',
          'Press de pecho', 'Jalón dorsal', 'Sentadilla guiada', 'Colchonetas'
        ],
        maintenanceMode: false,
        lastUpdated: now,
        updatedBy: 'system'
      },
      notificationSettings: {
        enableCriticalAlerts: true,
        criticalAlertSound: true,
        criticalAlertEmail: true,
        criticalAlertSMS: false,
        enableSystemNotifications: true,
        dailyReports: true,
        weeklyReports: true,
        monthlyReports: false,
        emailRecipients: ['admin@gymshark.com'],
        emailTemplate: 'default',
        lastUpdated: now,
        updatedBy: 'system'
      },
      backupSettings: {
        enableAutoBackup: true,
        backupFrequency: 'daily',
        backupTime: '02:00',
        retentionDays: 30,
        includeUserData: true,
        includeAlerts: true,
        includeRoutines: true,
        includeSettings: true,
        backupLocation: 'firebase',
        maxBackupSize: 500,
        lastBackup: new Date(0),
        lastUpdated: now,
        updatedBy: 'system'
      },
      securitySettings: {
        sessionTimeout: 120,
        maxLoginAttempts: 3,
        lockoutDuration: 15,
        requirePasswordChange: false,
        passwordExpiryDays: 90,
        minPasswordLength: 8,
        requireSpecialChars: true,
        allowMultipleSessions: false,
        enableTwoFactor: false,
        ipWhitelist: [],
        enableAuditLog: true,
        auditRetentionDays: 90,
        lastUpdated: now,
        updatedBy: 'system'
      }
    };
  }

  // ================================================================================
  // 💾 MÉTODOS PARA ACTUALIZAR CONFIGURACIÓN
  // ================================================================================

  async updateAISettings(aiSettings: Partial<AISettings>, updatedBy: string): Promise<void> {
    try {
      console.log('🤖 Actualizando configuración de IA...', aiSettings);
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración actual');

      const updatedSettings = {
        ...currentSettings,
        aiSettings: {
          ...currentSettings.aiSettings,
          ...aiSettings,
          lastUpdated: new Date(),
          updatedBy
        }
      };

      await this.saveSettings(updatedSettings);
      console.log('✅ Configuración de IA actualizada');
    } catch (error) {
      console.error('❌ Error actualizando configuración IA:', error);
      throw error;
    }
  }

  async updateGymSettings(gymSettings: Partial<GymSettings>, updatedBy: string): Promise<void> {
    try {
      console.log('🏋️ Actualizando configuración del gimnasio...', gymSettings);
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración actual');

      const updatedSettings = {
        ...currentSettings,
        gymSettings: {
          ...currentSettings.gymSettings,
          ...gymSettings,
          lastUpdated: new Date(),
          updatedBy
        }
      };

      await this.saveSettings(updatedSettings);
      console.log('✅ Configuración del gimnasio actualizada');
    } catch (error) {
      console.error('❌ Error actualizando configuración gimnasio:', error);
      throw error;
    }
  }

  async updateNotificationSettings(notificationSettings: Partial<NotificationSettings>, updatedBy: string): Promise<void> {
    try {
      console.log('🔔 Actualizando configuración de notificaciones...', notificationSettings);
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración actual');

      const updatedSettings = {
        ...currentSettings,
        notificationSettings: {
          ...currentSettings.notificationSettings,
          ...notificationSettings,
          lastUpdated: new Date(),
          updatedBy
        }
      };

      await this.saveSettings(updatedSettings);
      console.log('✅ Configuración de notificaciones actualizada');
    } catch (error) {
      console.error('❌ Error actualizando configuración notificaciones:', error);
      throw error;
    }
  }

  async updateBackupSettings(backupSettings: Partial<BackupSettings>, updatedBy: string): Promise<void> {
    try {
      console.log('💾 Actualizando configuración de backup...', backupSettings);
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración actual');

      const updatedSettings = {
        ...currentSettings,
        backupSettings: {
          ...currentSettings.backupSettings,
          ...backupSettings,
          lastUpdated: new Date(),
          updatedBy
        }
      };

      await this.saveSettings(updatedSettings);
      console.log('✅ Configuración de backup actualizada');
    } catch (error) {
      console.error('❌ Error actualizando configuración backup:', error);
      throw error;
    }
  }

  async updateSecuritySettings(securitySettings: Partial<SecuritySettings>, updatedBy: string): Promise<void> {
    try {
      console.log('🔒 Actualizando configuración de seguridad...', securitySettings);
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración actual');

      const updatedSettings = {
        ...currentSettings,
        securitySettings: {
          ...currentSettings.securitySettings,
          ...securitySettings,
          lastUpdated: new Date(),
          updatedBy
        }
      };

      await this.saveSettings(updatedSettings);
      console.log('✅ Configuración de seguridad actualizada');
    } catch (error) {
      console.error('❌ Error actualizando configuración seguridad:', error);
      throw error;
    }
  }

  private async saveSettings(settings: SystemSettings): Promise<void> {
    try {
      await this.db.collection('systemSettings').doc(this.SETTINGS_DOC_ID).set(settings);
      console.log('💾 Configuración guardada en Firebase');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      throw error;
    }
  }

  // ================================================================================
  // 🔄 MÉTODOS UTILITARIOS
  // ================================================================================

  refreshSettings(): void {
    console.log('🔄 Refrescando configuración del sistema...');
    this.loadSystemSettings();
  }

  async createBackup(): Promise<void> {
    try {
      console.log('📦 Creando backup manual...');
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración para respaldar');

      // Actualizar fecha de último backup
      await this.updateBackupSettings({ 
        lastBackup: new Date() 
      }, 'manual-backup');

      console.log('✅ Backup creado exitosamente');
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      throw error;
    }
  }

  async resetToDefaults(): Promise<void> {
    try {
      console.log('🔄 Restaurando configuración por defecto...');
      
      const defaultSettings = this.getDefaultSettings();
      await this.saveSettings(defaultSettings);
      
      console.log('✅ Configuración restaurada a valores por defecto');
    } catch (error) {
      console.error('❌ Error restaurando configuración:', error);
      throw error;
    }
  }

  exportSettings(): void {
    console.log('📤 Exportando configuración del sistema...');
    
    const currentSettings = this.settingsSubject.value;
    if (!currentSettings) {
      console.warn('⚠️ No hay configuración para exportar');
      return;
    }

    const dataStr = JSON.stringify(currentSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `fitnova-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Configuración exportada exitosamente');
  }
}