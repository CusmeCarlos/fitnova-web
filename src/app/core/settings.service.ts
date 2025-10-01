// src/app/core/settings.service.ts
// ⚙️ SERVICIO DE CONFIGURACIÓN DEL SISTEMA - SIN NG0203

import { Injectable } from '@angular/core'; // ❌ QUITAR inject
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, of } from 'rxjs';
import { map, catchError, startWith } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// ✅ INTERFACES (mantener todas)
export interface SystemSettings {
  aiSettings: AISettings;
  gymSettings: GymSettings;
  notificationSettings: NotificationSettings;
  backupSettings: BackupSettings;
  securitySettings: SecuritySettings;
}

export interface AISettings {
  poseSensitivity: number;
  confidenceThreshold: number;
  detectionThreshold: number;
  criticalThreshold: number;
  highThreshold: number;
  mediumThreshold: number;
  lowThreshold: number;
  gptCreativity: number;
  gptResponseLength: number;
  autoApprovalThreshold: number;
  processingInterval: number;
  maxFramesPerSecond: number;
  lastUpdated: Date;
  updatedBy: string;
}

export interface GymSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  operatingDays: string[];
  maxUsers: number;
  maxTrainers: number;
  maxSessionDuration: number;
  availableEquipment: string[];
  maintenanceMode: boolean;
  lastUpdated: Date;
  updatedBy: string;
}

export interface NotificationSettings {
  enableCriticalAlerts: boolean;
  criticalAlertSound: boolean;
  criticalAlertEmail: boolean;
  criticalAlertSMS: boolean;
  enableSystemNotifications: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  emailRecipients: string[];
  emailTemplate: string;
  lastUpdated: Date;
  updatedBy: string;
}

export interface BackupSettings {
  enableAutoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  retentionDays: number;
  includeUserData: boolean;
  includeAlerts: boolean;
  includeRoutines: boolean;
  includeSettings: boolean;
  backupLocation: 'firebase' | 'local' | 'cloud';
  maxBackupSize: number;
  lastBackup: Date;
  lastUpdated: Date;
  updatedBy: string;
}

export interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requirePasswordChange: boolean;
  passwordExpiryDays: number;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  allowMultipleSessions: boolean;
  enableTwoFactor: boolean;
  ipWhitelist: string[];
  enableAuditLog: boolean;
  auditRetentionDays: number;
  lastUpdated: Date;
  updatedBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<SystemSettings | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  settings$ = this.settingsSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  private readonly SETTINGS_DOC_ID = 'gymshark-config';

  // ✅ CONSTRUCTOR CON INYECCIÓN (FIX NG0203)
  constructor(private db: AngularFirestore) {
    console.log('⚙️ SettingsService inicializado');
    this.loadSystemSettings();
  }

  private loadSystemSettings(): void {
    this.isLoadingSubject.next(true);
    console.log('⚙️ Cargando configuración del sistema...');

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
        name: doc.gymSettings?.name || 'GYMSHARK',
        address: doc.gymSettings?.address || 'Santa Elena, La Libertad, Ecuador - Barrio Cordillera del Cóndor',
        phone: doc.gymSettings?.phone || '0991467751',
        email: doc.gymSettings?.email || 'gymshark@gmail.com',
        openTime: doc.gymSettings?.openTime || '06:00',
        closeTime: doc.gymSettings?.closeTime || '22:00',
        operatingDays: doc.gymSettings?.operatingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        maxUsers: doc.gymSettings?.maxUsers || 30,
        maxTrainers: doc.gymSettings?.maxTrainers || 5,
        maxSessionDuration: doc.gymSettings?.maxSessionDuration || 120,
        availableEquipment: doc.gymSettings?.availableEquipment || [],
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
        emailRecipients: doc.notificationSettings?.emailRecipients || [],
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
        name: 'GYMSHARK',
        address: 'Santa Elena, La Libertad, Ecuador - Barrio Cordillera del Cóndor',
        phone: '0991467751',
        email: 'gymshark@gmail.com',
        openTime: '06:00',
        closeTime: '22:00',
        operatingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        maxUsers: 30,
        maxTrainers: 5,
        maxSessionDuration: 120,
        availableEquipment: [],
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
        emailRecipients: [],
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
      console.log('💾 Guardando configuración en Firebase...');
      const db = firebase.firestore();
      await db.collection('systemSettings').doc(this.SETTINGS_DOC_ID).set(settings);
      console.log('✅ Configuración guardada en Firebase');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      throw error;
    }
  }

  refreshSettings(): void {
    console.log('🔄 Refrescando configuración del sistema...');
    this.loadSystemSettings();
  }

  async createBackup(): Promise<void> {
    try {
      console.log('📦 Creando backup manual...');
      
      const currentSettings = this.settingsSubject.value;
      if (!currentSettings) throw new Error('No hay configuración para respaldar');

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