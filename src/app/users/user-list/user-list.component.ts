// src/app/users/user-list/user-list.component.ts
// 👥 GESTIÓN COMPLETA DE USUARIOS PREMIUM - ESTILO FINZENAPP

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { DashboardService, UserStats } from '../../core/dashboard.service';
import { User } from '../../interfaces/user.interface';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserDetailsModalComponent } from '../user-details-modal/user-details-modal.component';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// ===============================================================================
// 🔧 INTERFACES
// ===============================================================================
interface UserTableData extends UserStats {
  statusText: string;
  statusColor: string;
  lastActiveText: string;
  assignedTrainerName: string;
  isUpdating?: boolean;
  isUpdatingTrainer?: boolean;
  status: 'active' | 'inactive' | 'blocked';
  createdAt: Date;
}

interface TrainerInfo {
  uid: string;
  displayName: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ===============================================================================
  // 📊 PROPIEDADES PRINCIPALES
  // ===============================================================================
  currentUser: User | null = null;
  dataSource = new MatTableDataSource<UserTableData>([]);
  allUsers: UserTableData[] = [];
  availableTrainers: TrainerInfo[] = [];

  // Estados de loading
  isLoading = false;
  isCreatingUser = false;
  
  // Métricas principales
  totalUsers = 0;
  activeUsersToday = 0;
  newUsersThisMonth = 0;
  totalWorkoutsCompleted = 0;

  // Formularios
  createUserForm: FormGroup;
  showCreateUserForm = false;
  hidePassword = true;

  // Filtros y búsqueda
  searchTerm = '';
  statusFilter = '';
  trainerFilter = '';
  dateRangeStart: Date | null = null;
  dateRangeEnd: Date | null = null;
  showAdvancedFilters = false;

  // Configuración de tabla
  displayedColumns: string[] = [];
  
  // Subscripciones
  private subscriptions = new Subscription();
  private db = firebase.firestore();

  constructor(
    private auth: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.createUserForm = this.initCreateUserForm();
    this.setupDisplayedColumns();
  }

  // ===============================================================================
  // 🚀 LIFECYCLE HOOKS
  // ===============================================================================
  async ngOnInit(): Promise<void> {
    try {
      await this.loadCurrentUser();
      // CAMBIO: Cargar entrenadores ANTES que usuarios
      await this.loadAvailableTrainers();
      await this.updateCurrentUserActivity();
      this.loadUsersData(); // Ahora los entrenadores ya están cargados
      this.setupSearchDebounce();
      this.setupOnlineStatusTimer();
    } catch (error) {
      console.error('❌ Error inicializando componente:', error);
      this.showErrorMessage('Error cargando datos');
    }
  }

  // 🔥 TIMER PARA MANTENER ESTADO ONLINE
  private setupOnlineStatusTimer(): void {
    // Actualizar estado cada 30 segundos
    const onlineTimer = setInterval(() => {
      if (this.currentUser?.uid) {
        console.log('🔄 Manteniendo estado online...');
        this.forceCurrentUserOnlineStatus();
      }
    }, 30000); // 30 segundos

    // Limpiar timer al destruir componente
    this.subscriptions.add(() => clearInterval(onlineTimer));
  }

  ngAfterViewInit(): void {
    this.setupTablePagination();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ===============================================================================
  // 🏗️ INICIALIZACIÓN
  // ===============================================================================
  private initCreateUserForm(): FormGroup {
    return this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      assignedTrainer: ['']
    });
  }

  private setupDisplayedColumns(): void {
    this.displayedColumns = ['userInfo', 'status', 'lastActive', 'stats'];
    
    // Solo admin puede ver y asignar entrenadores
    if (this.currentUser?.role === 'admin') {
      this.displayedColumns.push('assignedTrainer');
    }
    
    this.displayedColumns.push('actions');
  }

  // ===============================================================================
  // 🔄 CARGA DE DATOS
  // ===============================================================================
  private async updateCurrentUserActivity(): Promise<void> {
    try {
      if (!this.currentUser?.uid) return;

      const now = new Date(); // Usar fecha local para actualización inmediata
      const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
      
      console.log(`🕒 FORZANDO actualización de actividad para: ${this.currentUser.displayName} (${this.currentUser.uid})`);

      // Actualizar en la colección users con fecha local primero
      await this.db.collection('users').doc(this.currentUser.uid).update({
        lastActiveAt: serverTimestamp,
        updatedAt: serverTimestamp
      });

      // También actualizar en userStats si existe
      const userStatsRef = this.db.collection('userStats').doc(this.currentUser.uid);
      const userStatsDoc = await userStatsRef.get();
      
      if (userStatsDoc.exists) {
        await userStatsRef.update({
          lastActiveAt: serverTimestamp,
          updatedAt: serverTimestamp
        });
      } else {
        // Crear documento básico en userStats si no existe
        await userStatsRef.set({
          uid: this.currentUser.uid,
          lastActiveAt: serverTimestamp,
          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
          totalWorkouts: 0,
          totalCriticalErrors: 0,
          totalHours: 0,
          averageAccuracy: 0
        });
      }

      // 🔥 FORZAR ACTUALIZACIÓN LOCAL INMEDIATA
      this.forceCurrentUserOnlineStatus();

      console.log(`✅ Actividad actualizada para: ${this.currentUser.displayName}`);
    } catch (error) {
      console.error('❌ Error actualizando última actividad:', error);
    }
  }

  // 🔥 MÉTODO PARA FORZAR ESTADO ONLINE DEL USUARIO ACTUAL
  private forceCurrentUserOnlineStatus(): void {
    if (!this.currentUser?.uid || this.allUsers.length === 0) return;

    // Encontrar al usuario actual en la lista y forzar su estado
    const currentUserIndex = this.allUsers.findIndex(u => u.uid === this.currentUser!.uid);
    
    if (currentUserIndex >= 0) {
      this.allUsers[currentUserIndex].lastActiveAt = new Date(); // Fecha actual
      this.allUsers[currentUserIndex].statusText = 'EN LÍNEA';
      this.allUsers[currentUserIndex].statusColor = 'primary';
      this.allUsers[currentUserIndex].lastActiveText = 'Ahora mismo';
      
      // Actualizar la tabla inmediatamente
      this.processFilteredData([...this.allUsers]);
      
      console.log(`🔥 FORZADO estado EN LÍNEA para: ${this.currentUser.displayName}`);
    }
  }

  private async loadCurrentUser(): Promise<void> {
    try {
      const user = await this.auth.getCurrentUser();
      this.currentUser = user;
      this.setupDisplayedColumns(); // Reconfigurar columnas según rol
      console.log('👤 Usuario actual cargado:', user?.displayName, user?.uid);
    } catch (error) {
      console.error('❌ Error cargando usuario actual:', error);
    }
  }

  private async loadAvailableTrainers(): Promise<void> {
    if (this.currentUser?.role !== 'admin') return;

    try {
      const trainersSnapshot = await this.db
        .collection('users')
        .where('role', '==', 'trainer')
        .where('isActive', '==', true)
        .get();

      this.availableTrainers = trainersSnapshot.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data()['displayName'] || 'Sin nombre',
        email: doc.data()['email'] || 'Sin email'
      }));

      console.log('👨‍💼 Entrenadores cargados:', this.availableTrainers.length);
    } catch (error) {
      console.error('❌ Error cargando entrenadores:', error);
    }
  }

  private async loadUsersData(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('👥 Iniciando carga de usuarios con listener tiempo real...');
      
      // 🔥 CORREGIDO: Remover filtro isActive que causa problemas
      // Solo filtrar por role = user
      const usersSub = this.db
        .collection('users')
        .where('role', '==', 'user')
        .onSnapshot(async (usersSnapshot) => {
          console.log(`👥 Detectados ${usersSnapshot.docs.length} usuarios`);
          const allUsersData: UserTableData[] = [];

          for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            
            // 🔥 FILTRO MANUAL: Solo incluir usuarios activos o sin campo isActive
            const isActive = userData['isActive'];
            if (isActive === false) {
              console.log(`🚫 Usuario inactivo excluido: ${userData['displayName']}`);
              continue; // Saltar usuarios marcados como inactivos
            }
            
            console.log(`✅ Procesando usuario: ${userData['displayName']} (${userData['email']})`);
            
            // Obtener estadísticas del usuario
            const statsDoc = await this.db.collection('userStats').doc(userDoc.id).get();
            const statsData = statsDoc.exists ? statsDoc.data() : {};

            // Manejo correcto de fechas Firebase
            let lastActiveAt = userData['lastActiveAt'];
            
            if (!lastActiveAt && statsData?.['lastActiveAt']) {
              lastActiveAt = statsData['lastActiveAt'];
            }
            
            if (!lastActiveAt && userData['createdAt']) {
              lastActiveAt = userData['createdAt'];
            }

            // Convertir Timestamp de Firebase a Date
            let finalDate: Date;
            if (lastActiveAt && typeof lastActiveAt.toDate === 'function') {
              finalDate = lastActiveAt.toDate();
            } else if (lastActiveAt instanceof Date) {
              finalDate = lastActiveAt;
            } else {
              finalDate = new Date(0);
            }

           // En lugar de buscar en availableTrainers, consultar Firebase:
              let assignedTrainerName = '';
              if (userData['assignedTrainer']) {
                try {
                  const trainerDoc = await this.db.collection('users').doc(userData['assignedTrainer']).get();
                  if (trainerDoc.exists) {
                    assignedTrainerName = trainerDoc.data()?.['displayName'] || 'Entrenador sin nombre';
                  } else {
                    assignedTrainerName = 'Entrenador no encontrado';
                  }
                } catch (error) {
                  console.error('Error obteniendo entrenador:', error);
                  assignedTrainerName = 'Error cargando entrenador';
                }
              } else {
                assignedTrainerName = 'Sin asignar';
              }

            const user: UserTableData = {
              // Propiedades de UserStats
              uid: userDoc.id,
              displayName: userData['displayName'] || 'Sin nombre',
              email: userData['email'] || 'Sin email',
              lastCriticalError: statsData?.['lastCriticalError'] || null,
              totalCriticalErrors: statsData?.['totalCriticalErrors'] || 0,
              lastErrorType: statsData?.['lastErrorType'] || '',
              lastExercise: statsData?.['lastExercise'] || '',
              lastSessionId: statsData?.['lastSessionId'] || '',
              accuracy: statsData?.['accuracy'] || 0,
              weeklyGoalProgress: statsData?.['weeklyGoalProgress'] || 0,
              totalWorkouts: statsData?.['totalWorkouts'] || 0,
              totalHours: statsData?.['totalHours'] || 0,
              averageAccuracy: statsData?.['averageAccuracy'] || statsData?.['accuracy'] || 0,
              weeklyStreak: statsData?.['weeklyStreak'] || 0,
              improvementRate: statsData?.['improvementRate'] || 0,
              lastSessionDurationSeconds: statsData?.['lastSessionDurationSeconds'] || 0,
              totalSeconds: statsData?.['totalSeconds'] || 0,
              lastActiveAt: finalDate,
              assignedTrainer: userData['assignedTrainer'] || undefined,
              
              // Propiedades adicionales de UserTableData
              status: userData['status'] || 'active',
              assignedTrainerName,
              createdAt: userData['createdAt']?.toDate ? userData['createdAt'].toDate() : new Date(),
              statusText: '',
              statusColor: '',
              lastActiveText: '',
              isUpdating: false,
              isUpdatingTrainer: false
            };

            // Agregar textos de estado
            const statusInfo = this.getUserStatus(user);
            user.statusText = statusInfo.statusText;
            user.statusColor = statusInfo.statusColor;
            user.lastActiveText = this.getLastActiveText(user.lastActiveAt);

            // Debug específico para campos de estado
            console.log(`📊 Usuario: ${user.displayName}`);
            console.log(`  - Estado: ${user.statusText} (${user.statusColor})`);
            console.log(`  - Última actividad: ${user.lastActiveText}`);
            console.log(`  - lastActiveAt: ${user.lastActiveAt}`);
            console.log(`  - status: ${user.status}`);

            allUsersData.push(user);
            console.log(`✅ Usuario agregado: ${user.displayName} - Total workouts: ${user.totalWorkouts}`);
          }

          this.allUsers = allUsersData;
          
          // 🔥 FORZAR ESTADO ONLINE DEL USUARIO ACTUAL DESPUÉS DE CARGAR
          this.forceCurrentUserOnlineStatus();
          
          this.processFilteredData(this.allUsers);
          
          // Actualizar métricas
          this.loadMetrics();
          
          console.log('👥 Usuarios cargados en tiempo real:', this.allUsers.length);
          console.log('📊 Usuarios en dataSource:', this.dataSource.data.length);
          this.isLoading = false;
        }, (error) => {
          console.error('❌ Error en listener de usuarios:', error);
          this.showErrorMessage('Error cargando usuarios');
          this.isLoading = false;
        });

      // Agregar la suscripción para limpiarla en ngOnDestroy
      this.subscriptions.add(() => usersSub());
      
    } catch (error) {
      console.error('❌ Error configurando listener de usuarios:', error);
      this.showErrorMessage('Error cargando usuarios');
      this.isLoading = false;
    }
  }

  private loadMetrics(): void {
    try {
      this.totalUsers = this.allUsers.length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      this.activeUsersToday = this.allUsers.filter(user => 
        user.lastActiveAt && user.lastActiveAt >= today
      ).length;

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      this.newUsersThisMonth = this.allUsers.filter(user =>
        user.createdAt && user.createdAt >= startOfMonth
      ).length;

      this.totalWorkoutsCompleted = this.allUsers.reduce(
        (total, user) => total + (user.totalWorkouts || 0), 0
      );

      console.log('📊 Métricas calculadas:', {
        total: this.totalUsers,
        activeToday: this.activeUsersToday,
        newMonth: this.newUsersThisMonth,
        workouts: this.totalWorkoutsCompleted
      });
    } catch (error) {
      console.error('❌ Error calculando métricas:', error);
    }
  }

  // ===============================================================================
  // 🔍 BÚSQUEDA Y FILTROS
  // ===============================================================================
  private setupSearchDebounce(): void {
    // Se maneja directamente en el template con ngModel y método applySearch
  }

  applySearch(): void {
    let filteredUsers = [...this.allUsers];

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(user =>
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.assignedTrainerName?.toLowerCase().includes(term)
      );
    }

    this.applyAdditionalFilters(filteredUsers);
  }

  private applyAdditionalFilters(users: UserTableData[]): void {
    let filteredUsers = [...users];

    // Filtro por estado
    if (this.statusFilter) {
      filteredUsers = filteredUsers.filter(user => user.status === this.statusFilter);
    }

    // Filtro por entrenador
    if (this.trainerFilter) {
      if (this.trainerFilter === 'unassigned') {
        filteredUsers = filteredUsers.filter(user => !user.assignedTrainer);
      } else {
        filteredUsers = filteredUsers.filter(user => user.assignedTrainer === this.trainerFilter);
      }
    }

    // Filtro por fechas
    if (this.dateRangeStart) {
      filteredUsers = filteredUsers.filter(user =>
        user.createdAt && user.createdAt >= this.dateRangeStart!
      );
    }

    if (this.dateRangeEnd) {
      const endDate = new Date(this.dateRangeEnd);
      endDate.setHours(23, 59, 59, 999);
      filteredUsers = filteredUsers.filter(user =>
        user.createdAt && user.createdAt <= endDate
      );
    }

    this.processFilteredData(filteredUsers);
  }

  applyFilters(): void {
    this.applySearch(); // Aplica búsqueda y filtros juntos
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearch();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.trainerFilter = '';
    this.dateRangeStart = null;
    this.dateRangeEnd = null;
    this.processFilteredData(this.allUsers);
  }

  resetDateFilters(): void {
    this.dateRangeStart = null;
    this.dateRangeEnd = null;
    this.applyFilters();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.statusFilter || this.trainerFilter || 
              this.dateRangeStart || this.dateRangeEnd);
  }

  private processFilteredData(filteredUsers: UserTableData[]): void {
    this.dataSource.data = filteredUsers;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  // ===============================================================================
  // 🎛️ CONFIGURACIÓN DE TABLA
  // ===============================================================================
  private setupTablePagination(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    this.dataSource.filterPredicate = (data: UserTableData, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.displayName?.toLowerCase().includes(searchStr) ||
        data.email?.toLowerCase().includes(searchStr) ||
        data.assignedTrainerName?.toLowerCase().includes(searchStr) ||
        data.statusText?.toLowerCase().includes(searchStr)
      );
    };
  }

  // ===============================================================================
  // 👤 ACCIONES DE USUARIO
  // ===============================================================================
  async createUser(): Promise<void> {
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched(this.createUserForm);
      return;
    }

    const formData = this.createUserForm.value;
    this.isCreatingUser = true;

    try {
      await this.auth.createUserForWeb({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: 'user',
        assignedTrainer: formData.assignedTrainer || null
      });

      this.createUserForm.reset();
      this.showCreateUserForm = false;
      this.showSuccessMessage('Usuario creado exitosamente');
      
      // Recargar datos
      await this.loadUsersData();
      await this.loadMetrics();
      
    } catch (error: any) {
      console.error('❌ Error creando usuario:', error);
      this.showErrorMessage(error.message || 'Error creando usuario');
    } finally {
      this.isCreatingUser = false;
    }
  }

  toggleCreateUserForm(): void {
    this.showCreateUserForm = !this.showCreateUserForm;
    if (!this.showCreateUserForm) {
      this.createUserForm.reset();
    }
  }

  cancelCreateUser(): void {
    this.showCreateUserForm = false;
    this.createUserForm.reset();
  }

  async updateAssignedTrainer(user: UserTableData, newTrainerId: string): Promise<void> {
    if (user.isUpdatingTrainer) return;

    user.isUpdatingTrainer = true;
    
    try {
      const trainerName = newTrainerId 
        ? (this.availableTrainers.find(t => t.uid === newTrainerId)?.displayName || '')
        : '';

      await this.db.collection('users').doc(user.uid).update({
        assignedTrainer: newTrainerId || null,
        assignedTrainerName: trainerName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar también userStats si existe
      const statsDoc = await this.db.collection('userStats').doc(user.uid).get();
      if (statsDoc.exists) {
        await this.db.collection('userStats').doc(user.uid).update({
          assignedTrainer: newTrainerId || null,
          assignedTrainerName: trainerName,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Actualizar localmente
      user.assignedTrainer = newTrainerId || undefined;
      user.assignedTrainerName = trainerName;

      this.showSuccessMessage('Entrenador asignado correctamente');
    } catch (error) {
      console.error('❌ Error asignando entrenador:', error);
      this.showErrorMessage('Error asignando entrenador');
    } finally {
      user.isUpdatingTrainer = false;
    }
  }

  async toggleUserStatus(user: UserTableData): Promise<void> {
    if (user.isUpdating) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';

    if (!confirm(`¿Estás seguro de ${actionText} este usuario?`)) {
      return;
    }

    user.isUpdating = true;

    try {
      await this.db.collection('users').doc(user.uid).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Actualizar localmente
      user.status = newStatus;
      const statusInfo = this.getUserStatus(user);
      user.statusText = statusInfo.statusText;
      user.statusColor = statusInfo.statusColor;

      this.showSuccessMessage(`Usuario ${actionText === 'activar' ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error(`❌ Error ${actionText === 'activar' ? 'activando' : 'desactivando'} usuario:`, error);
      this.showErrorMessage(`Error ${actionText === 'activar' ? 'activando' : 'desactivando'} usuario`);
    } finally {
      user.isUpdating = false;
    }
  }

  viewUserDetails(user: UserTableData): void {
    const dialogRef = this.dialog.open(UserDetailsModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'user-details-modal-panel',
      disableClose: false,
      data: {
        user: user,
        availableTrainers: this.availableTrainers,
        currentUserRole: this.currentUser?.role
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'updated') {
        console.log('👤 Usuario actualizado desde modal');
        // Los datos se actualizarán automáticamente por el listener
        this.showSuccessMessage('Usuario actualizado correctamente');
      }
    });
  }

  editUser(user: UserTableData): void {
    console.log('✏️ Editar usuario:', user.uid);
    this.showSuccessMessage('Modal de edición en desarrollo');
  }

  async resetUserPassword(user: UserTableData): Promise<void> {
    if (!confirm('¿Enviar email de reseteo de contraseña a este usuario?')) {
      return;
    }

    try {
      // Usar Firebase Auth para enviar email de reset
      await firebase.auth().sendPasswordResetEmail(user.email!);
      this.showSuccessMessage('Email de reseteo enviado correctamente');
    } catch (error: any) {
      console.error('❌ Error enviando reset de contraseña:', error);
      this.showErrorMessage('Error enviando email de reseteo');
    }
  }

  async deleteUser(user: UserTableData): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    user.isUpdating = true;

    try {
      // Marcar como eliminado en lugar de eliminar físicamente
      await this.db.collection('users').doc(user.uid).update({
        isActive: false,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Remover de la lista local
      this.allUsers = this.allUsers.filter(u => u.uid !== user.uid);
      this.applySearch();
      await this.loadMetrics();

      this.showSuccessMessage('Usuario eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      this.showErrorMessage('Error eliminando usuario');
    } finally {
      user.isUpdating = false;
    }
  }

  // ===============================================================================
  // 📊 ACCIONES GENERALES
  // ===============================================================================
  async refreshData(): Promise<void> {
    // El listener ya maneja las actualizaciones automáticamente
    // Solo necesitamos mostrar el mensaje
    this.showSuccessMessage('Datos actualizándose automáticamente');
  }

  exportData(): void {
    try {
      const csvContent = this.generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `usuarios-fitnova-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      this.showSuccessMessage('Datos exportados correctamente');
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      this.showErrorMessage('Error exportando datos');
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ===============================================================================
  // 🛠️ MÉTODOS AUXILIARES
  // ===============================================================================
  private getUserStatus(user: UserTableData): { statusText: string; statusColor: string } {
    // 🔥 PRIORIDAD MÁXIMA: Si es el usuario actual, SIEMPRE EN LÍNEA
    if (this.currentUser && user.uid === this.currentUser.uid) {
      console.log(`🔥 Usuario actual detectado: ${user.displayName} - FORZANDO EN LÍNEA`);
      return { statusText: 'EN LÍNEA', statusColor: 'primary' };
    }

    // Si el usuario está explícitamente bloqueado
    if (user.status === 'blocked') {
      return { statusText: 'BLOQUEADO', statusColor: 'warn' };
    }

    // Si el usuario está marcado como inactivo
    if (user.status === 'inactive') {
      return { statusText: 'INACTIVO', statusColor: 'warn' };
    }

    // Si no hay fecha de última actividad, es un usuario nuevo
    if (!user.lastActiveAt || user.lastActiveAt.getTime() === new Date(0).getTime()) {
      return { statusText: 'NUNCA CONECTADO', statusColor: 'accent' };
    }

    const now = new Date();
    const diffMs = now.getTime() - user.lastActiveAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Estados en tiempo real basados en última actividad para otros usuarios
    if (diffMinutes < 5) return { statusText: 'EN LÍNEA', statusColor: 'primary' };
    if (diffMinutes < 30) return { statusText: 'HACE ' + diffMinutes + ' MIN', statusColor: 'primary' };
    if (diffHours < 1) return { statusText: 'HACE MENOS DE 1H', statusColor: 'primary' };
    if (diffHours < 24) return { statusText: 'HACE ' + diffHours + 'H', statusColor: 'accent' };
    if (diffDays === 1) return { statusText: 'HACE 1 DÍA', statusColor: 'accent' };
    if (diffDays <= 7) return { statusText: 'HACE ' + diffDays + ' DÍAS', statusColor: 'accent' };
    if (diffDays <= 30) return { statusText: 'HACE ' + diffDays + ' DÍAS', statusColor: 'warn' };
    
    return { statusText: 'INACTIVO', statusColor: 'warn' };
  }

  private getLastActiveText(lastActive: Date | undefined): string {
    if (!lastActive || lastActive.getTime() === new Date(0).getTime()) {
      return 'Nunca';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Texto más detallado para última actividad
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 30) return `Hace ${diffDays} días`;
    
    // Para fechas muy antiguas, mostrar fecha exacta
    return this.formatDate(lastActive);
  }

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
      year: 'numeric'
    });
  }

  formatMinutes(totalHours: number): string {
    if (!totalHours || totalHours === 0) return '0h';
    
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((totalHours % 1) * 60);
    
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  }

  private generateCSVContent(): string {
    const headers = [
      'Nombre',
      'Email',
      'Estado',
      'Última Actividad',
      'Entrenamientos',
      'Minutos Totales',
      'Precisión Promedio',
      'Entrenador Asignado',
      'Fecha Creación'
    ];

    const rows = this.allUsers.map(user => [
      `"${user.displayName}"`,
      `"${user.email}"`,
      `"${user.statusText}"`,
      `"${user.lastActiveText}"`,
      user.totalWorkouts || 0,
      user.totalHours || 0,
      user.averageAccuracy ? `${user.averageAccuracy}%` : 'N/A',
      `"${user.assignedTrainerName || 'Sin asignar'}"`,
      `"${this.formatDate(user.createdAt)}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // ===============================================================================
  // 📨 MENSAJES Y NOTIFICACIONES
  // ===============================================================================
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showWarningMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
  }
}