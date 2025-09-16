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
import { DashboardService, UserStats } from '../../core/dashboard.service';
import { User } from '../../interfaces/user.interface';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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
    private snackBar: MatSnackBar
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
    });
  }

  ngAfterViewInit(): void {
    this.setupTablePagination();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  // ✅ CARGA DE DATOS
  private async loadUsersData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Obtener usuarios con rol 'user' (usuarios móvil)
      const usersSnapshot = await this.db.collection('users')
        .where('role', '==', 'user')
        .get();

      const usersPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        
        // Obtener estadísticas del usuario
        const statsDoc = await this.db.collection('userStats').doc(userDoc.id).get();
        const statsData = statsDoc.exists ? statsDoc.data() : {};

        const userStats: UserStats = {
          uid: userDoc.id,
          displayName: userData['displayName'] || 'Usuario sin nombre',
          email: userData['email'],
          assignedTrainer: userData['assignedTrainer'],
          lastActiveAt: userData['lastActiveAt']?.toDate() || new Date(0),
          
          // Datos de userStats
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
        lastActiveText: this.getLastActiveText(user.lastActiveAt),
        assignedTrainerName: trainerName
      };
    });

    this.dataSource.data = tableData;
  }

  private calculateMetrics(): void {
    this.totalUsers = this.allUsers.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.activeUsersToday = this.allUsers.filter(user => 
      user.lastActiveAt && user.lastActiveAt >= today
    ).length;
    
    this.usersWithoutTrainer = this.allUsers.filter(user => 
      !user.assignedTrainer
    ).length;
    
    this.totalWorkoutsAllUsers = this.allUsers.reduce((sum, user) => 
      sum + (user.totalWorkouts || 0), 0
    );
  }

  // ✅ FILTROS
  private applyFilters(): void {
    const filters = this.filterForm.value;
    let filteredData = [...this.allUsers];

    console.log('🔍 Aplicando filtros:', filters);
    console.log('📊 Total usuarios antes del filtro:', filteredData.length);

    // Filtro por texto de búsqueda (YA FUNCIONA)
    if (filters.searchText?.trim()) {
      const searchTerm = filters.searchText.toLowerCase();
      filteredData = filteredData.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      );
    }

    // ✅ FILTRO POR ENTRENADOR ASIGNADO - ARREGLADO
    if (filters.trainerFilter && filters.trainerFilter !== 'all') {
      console.log('👨‍💼 Filtrando por entrenador:', filters.trainerFilter);
      
      if (filters.trainerFilter === 'unassigned') {
        filteredData = filteredData.filter(user => !user.assignedTrainer);
        console.log('🔍 Usuarios sin entrenador:', filteredData.length);
      } else {
        filteredData = filteredData.filter(user => 
          user.assignedTrainer === filters.trainerFilter
        );
        console.log('🔍 Usuarios con entrenador específico:', filteredData.length);
      }
    }

    // Filtro por actividad
    if (filters.activityFilter && filters.activityFilter !== 'all') {
      const now = new Date();
      filteredData = filteredData.filter(user => {
        if (!user.lastActiveAt) return filters.activityFilter === 'inactive';
        
        const daysDiff = Math.floor((now.getTime() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.activityFilter) {
          case 'today': return daysDiff === 0;
          case 'week': return daysDiff <= 7;
          case 'month': return daysDiff <= 30;
          case 'inactive': return daysDiff > 30;
          default: return true;
        }
      });
    }

    console.log('✅ Total usuarios después del filtro:', filteredData.length);
    
    // Procesar datos filtrados
    this.processFilteredData(filteredData);
  }

  private processFilteredData(filteredUsers: UserStats[]): void {
    const tableData: UserTableData[] = filteredUsers.map(user => {
      const { statusText, statusColor } = this.getUserStatus(user);
      const trainerName = this.getTrainerName(user.assignedTrainer);
      
      return {
        ...user,
        statusText,
        statusColor,
        lastActiveText: this.getLastActiveText(user.lastActiveAt),
        assignedTrainerName: trainerName
      };
    });

    this.dataSource.data = tableData;
  }

  // ✅ ACCIONES DE USUARIO
  async assignTrainer(userId: string, trainerId: string): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        assignedTrainer: trainerId || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.showSuccessMessage('Entrenador asignado correctamente');
      this.loadUsersData(); // Recargar datos
    } catch (error) {
      console.error('❌ Error asignando entrenador:', error);
      this.showErrorMessage('Error asignando entrenador');
    }
  }

  async createUser(): Promise<void> {
    if (this.createUserForm.invalid) return;

    try {
      const formData = this.createUserForm.value;
      
      // Crear usuario con Firebase Auth
      const userCredential = await this.auth.createUserForWeb(
        formData.email,
        formData.password,
        {
          displayName: formData.displayName,
          role: 'user',
          assignedTrainer: formData.assignedTrainer || null
        }
      );

      this.showSuccessMessage('Usuario creado exitosamente');
      this.createUserForm.reset();
      this.loadUsersData(); // Recargar lista
      
    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      this.showErrorMessage('Error creando usuario');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Implementar lógica de eliminación con confirmación
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        // Solo marcar como inactivo, no eliminar físicamente
        await this.db.collection('users').doc(userId).update({
          isActive: false,
          deletedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        this.showSuccessMessage('Usuario desactivado correctamente');
        this.loadUsersData();
      } catch (error) {
        console.error('❌ Error desactivando usuario:', error);
        this.showErrorMessage('Error desactivando usuario');
      }
    }
  }

  // ✅ MÉTODOS DE UTILIDAD
  private getUserStatus(user: UserStats): { statusText: string; statusColor: string } {
    if (!user.lastActiveAt) {
      return { statusText: 'Nunca conectado', statusColor: 'warn' };
    }

    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return { statusText: 'Activo hoy', statusColor: 'primary' };
    if (daysDiff === 1) return { statusText: 'Activo ayer', statusColor: 'accent' };
    if (daysDiff <= 7) return { statusText: `Hace ${daysDiff} días`, statusColor: 'accent' };
    if (daysDiff <= 30) return { statusText: `Hace ${daysDiff} días`, statusColor: 'warn' };
    
    return { statusText: 'Inactivo', statusColor: 'warn' };
  }

  private getLastActiveText(lastActive: Date | undefined): string {
    if (!lastActive || lastActive.getTime() === 0) return 'Nunca';
    
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return 'Ayer';
    if (daysDiff <= 7) return `Hace ${daysDiff} días`;
    if (daysDiff <= 30) return `Hace ${daysDiff} días`;
    
    return lastActive.toLocaleDateString();
  }

  private getTrainerName(trainerId: string | undefined): string {
    if (!trainerId) return 'Sin asignar';
    
    const trainer = this.availableTrainers.find(t => t.uid === trainerId);
    return trainer?.displayName || 'Entrenador desconocido';
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchText: '',
      statusFilter: 'all',
      trainerFilter: 'all',
      activityFilter: 'all'
    });
  }

  exportToCSV(): void {
    // Implementar exportación CSV
    console.log('Exportando a CSV...');
    this.showSuccessMessage('Función de exportación en desarrollo');
  }

  refreshData(): void {
    this.loadUsersData();
  }

  // ✅ MÉTODOS FALTANTES PARA EL TEMPLATE
  viewUserDetail(userId: string): void {
    console.log('Ver detalles del usuario:', userId);
    this.showSuccessMessage('Función de detalles en desarrollo');
  }

  editUser(userId: string): void {
    console.log('Editar usuario:', userId);
    this.showSuccessMessage('Función de edición en desarrollo');
  }

  viewUserStats(userId: string): void {
    console.log('Ver estadísticas del usuario:', userId);
    this.showSuccessMessage('Función de estadísticas en desarrollo');
  }

  resetUserPassword(userId: string): void {
    if (confirm('¿Estás seguro de resetear la contraseña de este usuario?')) {
      console.log('Resetear contraseña del usuario:', userId);
      this.showSuccessMessage('Función de reseteo en desarrollo');
    }
  }

  openCreateUserDialog(): void {
    // Expandir/contraer la sección de crear usuario
    const createSection = document.querySelector('.create-user-section') as HTMLElement;
    if (createSection) {
      createSection.style.display = createSection.style.display === 'none' ? 'block' : 'none';
    }
  }

  toggleCreateUserForm(): void {
    this.showCreateForm = !this.showCreateForm;
    console.log('👤 Toggle crear usuario:', this.showCreateForm);
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

  // ✅ DEBUG BUTTON - REMOVER DESPUÉS
  debugCurrentUser(): void {
    console.log('🐛 DEBUG - CurrentUser:', this.currentUser);
    console.log('🐛 DEBUG - Es admin?:', this.currentUser?.role === 'admin');
    console.log('🐛 DEBUG - ShowCreateForm:', this.showCreateForm);
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