// src/app/users/user-list/user-list.component.ts
// 👥 GESTIÓN COMPLETA DE USUARIOS MÓVIL - CON DATOS REALES FIREBASE

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

interface UserTableData extends UserStats {
  statusText: string;
  statusColor: string;
  lastActiveText: string;
  assignedTrainerName: string;
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

  // ✅ DATOS DE LA TABLA
  displayedColumns: string[] = [
    'displayName', 
    'email', 
    'statusText', 
    'totalWorkouts', 
    'averageAccuracy', 
    'totalCriticalErrors', 
    'assignedTrainerName',
    'lastActiveText',
    'actions'
  ];
  
  dataSource = new MatTableDataSource<UserTableData>();
  
  // ✅ ESTADOS DEL COMPONENTE
  isLoading = true;
  currentUser: User | null = null;
  allUsers: UserStats[] = [];
  availableTrainers: TrainerInfo[] = [];
  showCreateForm = false;
  
  // ✅ FILTROS
  filterForm: FormGroup;
  createUserForm: FormGroup;
  
  // ✅ MÉTRICAS DE RESUMEN
  totalUsers = 0;
  activeUsersToday = 0;
  usersWithoutTrainer = 0;
  totalWorkoutsAllUsers = 0;
  
  // ✅ SUBSCRIPCIONES
  private subscriptions = new Subscription();
  private db = firebase.firestore();

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.filterForm = this.createFilterForm();
    this.createUserForm = this.createUserCreationForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupFilters();
    
    // Debug para verificar currentUser
    this.auth.user$.subscribe(user => {
      this.currentUser = user;
      console.log('👤 CurrentUser en ngOnInit:', user);
      console.log('👤 Es admin?:', user?.role === 'admin');
      console.log('👤 Es trainer?:', user?.role === 'trainer');
    });
  }

  ngAfterViewInit(): void {
    this.setupTablePagination();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  goBack(): void {
    console.log('🔙 Navegando de vuelta al dashboard');
    this.router.navigate(['/dashboard/overview']);
  }

  // ✅ INICIALIZACIÓN
  private initializeComponent(): void {
    const authSub = this.auth.user$.subscribe(user => {
      this.currentUser = user;
      if (user && ['trainer', 'admin'].includes(user.role)) {
        this.loadUsersData();
        this.loadAvailableTrainers();
      }
    });
    this.subscriptions.add(authSub);
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      searchText: [''],
      statusFilter: ['all'],
      trainerFilter: ['all'],
      activityFilter: ['all'],
      dateRange: [null]
    });
  }

  private createUserCreationForm(): FormGroup {
    return this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      assignedTrainer: [''],
      role: ['user'] // Siempre será 'user' para usuarios móvil
    });
  }

  private setupFilters(): void {
    // Búsqueda en tiempo real
    const searchControl = this.filterForm.get('searchText');
    if (searchControl) {
      const searchSub = searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((searchValue) => {
        console.log('🔍 Buscando:', searchValue);
        this.applySearch(searchValue);
      });
      this.subscriptions.add(searchSub);
    }

    // Otros filtros (entrenador, actividad)
    const trainerControl = this.filterForm.get('trainerFilter');
    const activityControl = this.filterForm.get('activityFilter');
    
    if (trainerControl) {
      const trainerSub = trainerControl.valueChanges.subscribe(() => {
        this.applyFilters();
      });
      this.subscriptions.add(trainerSub);
    }

    if (activityControl) {
      const activitySub = activityControl.valueChanges.subscribe(() => {
        this.applyFilters();
      });
      this.subscriptions.add(activitySub);
    }
  }

  private applySearch(searchTerm: string): void {
    let filteredUsers = [...this.allUsers];

    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(user =>
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
      console.log(`🔍 Filtrados ${filteredUsers.length} de ${this.allUsers.length} usuarios`);
    }

    this.processFilteredData(filteredUsers);
  }

  private setupTablePagination(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // ✅ Filtro personalizado que busca en múltiples campos
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

// 🚨 ARREGLO loadUsersData() - SIN toDate
private async loadUsersData(): Promise<void> {
  try {
    this.isLoading = true;
    
    const usersSnapshot = await this.db.collection('users')
      .where('role', '==', 'user')
      .get();

    const usersPromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();
      const statsDoc = await this.db.collection('userStats').doc(userDoc.id).get();
      const statsData = statsDoc.exists ? statsDoc.data() : {};

      // 🚨 ARREGLO: Manejo correcto de fechas Firebase
      let lastActiveAt = userData['lastActiveAt'];
      
      if (!lastActiveAt && statsData?.['lastActiveAt']) {
        lastActiveAt = statsData['lastActiveAt'];
      }
      
      if (!lastActiveAt && userData['createdAt']) {
        lastActiveAt = userData['createdAt'];
      }

      // Convertir Timestamp de Firebase a Date
      let finalDate: Date;
      if (lastActiveAt && lastActiveAt.toDate) {
        finalDate = lastActiveAt.toDate();
      } else if (lastActiveAt instanceof Date) {
        finalDate = lastActiveAt;
      } else {
        finalDate = new Date(0);
      }

      const userStats: UserStats = {
        uid: userDoc.id,
        displayName: userData['displayName'] || 'Usuario sin nombre',
        email: userData['email'],
        assignedTrainer: userData['assignedTrainer'],
        lastActiveAt: finalDate,
        
        lastCriticalError: statsData?.['lastCriticalError'] || null,
        totalCriticalErrors: statsData?.['totalCriticalErrors'] || 0,
        lastErrorType: statsData?.['lastErrorType'] || '',
        lastExercise: statsData?.['lastExercise'] || '',
        lastSessionId: statsData?.['lastSessionId'] || '',
        accuracy: statsData?.['averageAccuracy'] || 0,
        totalWorkouts: statsData?.['totalWorkouts'] || 0,
        totalHours: statsData?.['totalHours'] || 0,
        averageAccuracy: statsData?.['averageAccuracy'] || 0,
        weeklyStreak: statsData?.['weeklyStreak'] || 0,
        improvementRate: statsData?.['improvementRate'] || 0,
        lastSessionDurationSeconds: statsData?.['lastSessionDurationSeconds'] || 0,
        totalSeconds: statsData?.['totalSeconds'] || 0
      };

      return userStats;
    });

    this.allUsers = await Promise.all(usersPromises);
    this.processUsersData();
    this.calculateMetrics();
    
  } catch (error) {
    console.error('❌ Error cargando usuarios:', error);
    this.showErrorMessage('Error cargando lista de usuarios');
  } finally {
    this.isLoading = false;
  }
}

  private async loadAvailableTrainers(): Promise<void> {
    try {
      const trainersSnapshot = await this.db.collection('users')
        .where('role', 'in', ['trainer', 'admin'])
        .get();

      this.availableTrainers = trainersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data['displayName'] || 'Entrenador sin nombre',
          email: data['email']
        };
      });
    } catch (error) {
      console.error('❌ Error cargando entrenadores:', error);
    }
  }

  private processUsersData(): void {
    const tableData: UserTableData[] = this.allUsers.map(user => {
      const { statusText, statusColor } = this.getUserStatus(user);
      const trainerName = this.getTrainerName(user.assignedTrainer);
      
      return {
        ...user,
        statusText,
        statusColor,
        lastActiveText: this.getLastActiveText(user.lastActiveAt), // Ya maneja undefined
        assignedTrainerName: trainerName
      };
    });

    this.dataSource.data = tableData;
  }

  private calculateMetrics(): void {
    this.totalUsers = this.allUsers.length;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 🚨 ARREGLO: Verificar lastActiveAt sin toDate
    this.activeUsersToday = this.allUsers.filter(user => {
      if (!user.lastActiveAt) return false;
      
      // Ya es Date, no necesita conversión
      return user.lastActiveAt >= todayStart;
    }).length;
    
    this.usersWithoutTrainer = this.allUsers.filter(user => 
      !user.assignedTrainer || user.assignedTrainer === ''
    ).length;
    
    this.totalWorkoutsAllUsers = this.allUsers.reduce((sum, user) => 
      sum + (user.totalWorkouts || 0), 0
    );
  }

  private processFilteredData(users: UserStats[]): void {
    const tableData: UserTableData[] = users.map(user => {
      const { statusText, statusColor } = this.getUserStatus(user);
      const trainerName = this.getTrainerName(user.assignedTrainer);
      
      return {
        ...user,
        statusText,
        statusColor,
        lastActiveText: this.getLastActiveText(user.lastActiveAt), // Ya maneja undefined
        assignedTrainerName: trainerName
      };
    });

    this.dataSource.data = tableData;
  }

  // ✅ ACCIONES DE FILTROS
  applyFilters(): void {
    let filteredUsers = [...this.allUsers];
    
    const trainerFilter = this.filterForm.get('trainerFilter')?.value;
    const activityFilter = this.filterForm.get('activityFilter')?.value;
    
    // Filtro por entrenador
    if (trainerFilter && trainerFilter !== 'all') {
      if (trainerFilter === 'unassigned') {
        filteredUsers = filteredUsers.filter(user => !user.assignedTrainer);
      } else {
        filteredUsers = filteredUsers.filter(user => user.assignedTrainer === trainerFilter);
      }
    }
    
    // Filtro por actividad
    if (activityFilter && activityFilter !== 'all') {
      const now = new Date();
      
      switch (activityFilter) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filteredUsers = filteredUsers.filter(user => 
            user.lastActiveAt && user.lastActiveAt >= todayStart
          );
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredUsers = filteredUsers.filter(user => 
            user.lastActiveAt && user.lastActiveAt >= weekAgo
          );
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredUsers = filteredUsers.filter(user => 
            user.lastActiveAt && user.lastActiveAt >= monthAgo
          );
          break;
        case 'inactive':
          const weekAgoForInactive = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredUsers = filteredUsers.filter(user => 
            !user.lastActiveAt || user.lastActiveAt < weekAgoForInactive
          );
          break;
      }
    }
    
    this.processFilteredData(filteredUsers);
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchText: '',
      statusFilter: 'all',
      trainerFilter: 'all',
      activityFilter: 'all',
      dateRange: null
    });
    this.processUsersData();
  }

  refreshData(): void {
    this.loadUsersData();
  }

  exportData(): void {
    console.log('📊 Exportar datos de usuarios');
    this.showSuccessMessage('Función de exportación en desarrollo');
  }

  // ✅ ACCIONES DE USUARIO INDIVIDUALES
  async assignTrainer(userId: string, trainerId: string): Promise<void> {
    try {
      const trainerName = this.availableTrainers.find(t => t.uid === trainerId)?.displayName || '';
      
      await this.db.collection('users').doc(userId).update({
        assignedTrainer: trainerId || null,
        assignedTrainerName: trainerName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // También actualizar userStats
      await this.db.collection('userStats').doc(userId).update({
        assignedTrainer: trainerId || null,
        assignedTrainerName: trainerName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.showSuccessMessage('Entrenador asignado correctamente');
      this.loadUsersData(); // Recargar datos
    } catch (error) {
      console.error('❌ Error asignando entrenador:', error);
      this.showErrorMessage('Error asignando entrenador');
    }
  }

  viewUserDetail(userId: string): void {
    console.log('👁️ Ver detalles del usuario:', userId);
    this.showSuccessMessage('Navegación a detalles en desarrollo');
  }

  editUser(userId: string): void {
    console.log('✏️ Editar usuario:', userId);
    this.showSuccessMessage('Función de edición en desarrollo');
  }

  viewUserStats(userId: string): void {
    console.log('📊 Ver estadísticas del usuario:', userId);
    this.showSuccessMessage('Modal de estadísticas en desarrollo');
  }

  async deleteUser(userId: string): Promise<void> {
    if (confirm('¿Estás seguro de desactivar este usuario?')) {
      try {
        await this.db.collection('users').doc(userId).update({
          isActive: false,
          deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        this.showSuccessMessage('Usuario desactivado correctamente');
        this.loadUsersData();
      } catch (error) {
        console.error('❌ Error desactivando usuario:', error);
        this.showErrorMessage('Error desactivando usuario');
      }
    }
  }

  async resetUserPassword(userId: string): Promise<void> {
    if (confirm('¿Enviar email de reseteo de contraseña a este usuario?')) {
      console.log('Resetear contraseña del usuario:', userId);
      this.showSuccessMessage('Función de reseteo en desarrollo');
    }
  }

  async createUser(): Promise<void> {
    if (this.createUserForm.invalid) {
      console.error('❌ Formulario inválido');
      this.markFormGroupTouched(this.createUserForm);
      return;
    }

    const formData = this.createUserForm.value;
    console.log('👤 Iniciando creación de usuario via Cloud Function:', formData.email);
    
    this.isLoading = true;

    try {
      // 🚨 CAMBIO PRINCIPAL: Usar AuthService.createUserForWeb (Cloud Functions)
      // En lugar de Firebase Auth directo
      await this.auth.createUserForWeb({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        role: 'user',
        assignedTrainer: formData.assignedTrainer
      });

      // 🚨 PASO 2: Limpiar formulario y mostrar éxito
      this.createUserForm.reset();
      this.showCreateForm = false;
      
      console.log('🎉 Usuario creado exitosamente via Cloud Function');

      // 🚨 PASO 3: Recargar datos para mostrar el nuevo usuario
      await this.loadUsersData();
      
    } catch (error: any) {
      console.error('❌ Error al crear usuario:', error);
      
      // El AuthService ya maneja y muestra los errores específicos
      // No necesitamos manejar errores aquí porque ya están manejados en createUserForWeb
      
    } finally {
      this.isLoading = false;
    }
  }

  // ✅ MÉTODOS DE CONTROL DEL FORMULARIO
  toggleCreateUserForm(): void {
    this.showCreateForm = !this.showCreateForm;
    console.log('👤 Toggle crear usuario:', this.showCreateForm);
  }

  openCreateUserDialog(): void {
    // Expandir/contraer la sección de crear usuario
    const createSection = document.querySelector('.create-user-section') as HTMLElement;
    if (createSection) {
      createSection.style.display = createSection.style.display === 'none' ? 'block' : 'none';
    }
  }

  onSearchChange(event: any): void {
    const searchValue = event.target.value;
    console.log('🔍 Búsqueda input:', searchValue);
    this.applySearch(searchValue);
  }

  onTrainerFilterChange(): void {
    console.log('👨‍💼 Filtro entrenador cambiado');
    this.applyFilters();
  }

  onActivityFilterChange(): void {
    console.log('📅 Filtro actividad cambiado');
    this.applyFilters();
  }

  // 3. ARREGLAR getUserStatus() - Estado del usuario mejorado
private getUserStatus(user: UserStats): { statusText: string; statusColor: string } {
  if (!user.lastActiveAt || user.lastActiveAt.getTime() === new Date(0).getTime()) {
    return { statusText: 'Nunca conectado', statusColor: 'warn' };
  }

  const now = new Date();
  const diffMs = now.getTime() - user.lastActiveAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  // 🚨 ARREGLO: Considerar usuarios recién creados como activos
  if (diffDays === 0) {
    if (diffHours < 1) {
      return { statusText: 'Recién creado', statusColor: 'primary' };
    } else {
      return { statusText: 'Activo hoy', statusColor: 'primary' };
    }
  }
  
  if (diffDays === 1) return { statusText: 'Activo ayer', statusColor: 'accent' };
  if (diffDays <= 7) return { statusText: `Hace ${diffDays} días`, statusColor: 'accent' };
  if (diffDays <= 30) return { statusText: `Hace ${diffDays} días`, statusColor: 'warn' };
  
  return { statusText: 'Inactivo', statusColor: 'warn' };
}

 // 4. ARREGLAR getLastActiveText() - Mostrar fecha correcta
private getLastActiveText(lastActive: Date | undefined): string {
  if (!lastActive || lastActive.getTime() === new Date(0).getTime()) {
    return 'Nunca';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastActive.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // 🚨 ARREGLO: Manejo mejorado de fechas recientes
  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 1) return 'Hace menos de 1 hora';
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays <= 7) return `Hace ${diffDays} días`;
  
  // Para fechas más antiguas, mostrar fecha formateada
  return lastActive.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}


  private getTrainerName(trainerId: string | undefined): string {
    if (!trainerId) return 'Sin asignar';
    const trainer = this.availableTrainers.find(t => t.uid === trainerId);
    return trainer?.displayName || 'Entrenador desconocido';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          this.markFormGroupTouched(control);
        }
      }
    });
  }



  // ✅ MENSAJES
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
}