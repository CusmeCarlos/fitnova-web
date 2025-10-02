// src/app/shared/membership/membership.component.ts
// 💳 GESTIÓN DE MEMBRESÍAS - ULTRA PREMIUM FINZENAPP STYLE

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ AGREGAR ActivatedRoute
import { Subscription, combineLatest } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// ✅ SERVICIOS
import { MembershipService } from '../../core/membership.service';
import { AuthService } from '../../core/auth.service';
import { MembershipPlan, UserMembership } from '../../interfaces/gym-management.interface';
import { User } from '../../interfaces/user.interface';

// ✅ MATERIAL DESIGN
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTabsModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatExpansionModule
  ],
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit, OnDestroy {

  // ✅ VIEW CHILDREN
  @ViewChild('planPaginator') planPaginator!: MatPaginator;
  @ViewChild('membershipPaginator') membershipPaginator!: MatPaginator;
  @ViewChild('planSort') planSort!: MatSort;
  @ViewChild('membershipSort') membershipSort!: MatSort;

  // ✅ DATA SOURCES
  plansDataSource = new MatTableDataSource<MembershipPlan>([]);
  membershipsDataSource = new MatTableDataSource<UserMembership>([]);
  users: User[] = []; // Agregar esta línea
  usersMap: Map<string, User> = new Map(); 

  // ✅ COLUMNAS DE TABLAS
  planColumns: string[] = ['name', 'type', 'price', 'durationDays', 'benefits', 'currentActiveMembers', 'status', 'actions'];
  membershipColumns: string[] = ['userId', 'planName', 'status', 'startDate', 'endDate', 'daysRemaining', 'totalVisits', 'actions'];

  // ✅ STATE
  currentUser: User | null = null;
  isLoading = false;
  showPlanForm = false;
  editingPlan: MembershipPlan | null = null;

  // ✅ NUEVO: Para asignación rápida desde user-list
  showQuickAssignPanel = false;
  newUserId: string | null = null;
  newUserName: string | null = null;
  selectedPlanForAssignment: MembershipPlan | null = null;
  assignmentForm!: FormGroup;

  // ✅ FORMS
  planForm!: FormGroup;

  // ✅ ESTADÍSTICAS
  stats = {
    totalActive: 0,
    expiringSoon: 0,
    expired: 0,
    monthlyRevenue: 0,
    renewalRate: '0',
    mostPopularPlan: 'N/A',
    usersWithMembership: 0,
    totalPlans: 0,
    activePlans: 0
  };

  revenueData: any[] = [];

  // ✅ FILTERS
  selectedPlanFilter: string = 'all';
  selectedStatusFilter: string = 'all';

  // ✅ HELPER PARA MATH EN TEMPLATE
  Math = Math;

  private subscriptions = new Subscription();

  constructor(
    private membershipService: MembershipService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute // ✅ AGREGAR ActivatedRoute
  ) {
    this.initForms();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadData();
    this.loadStats();
    this.setupDataSourceConfigurations();
    this.checkForNewUserAssignment(); // ✅ NUEVO: Detectar si viene de user-list
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // ================================================================================
  // 🔧 INICIALIZACIÓN
  // ================================================================================

  private initForms(): void {
    this.planForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      type: ['monthly', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      durationDays: [30, [Validators.required, Validators.min(1)]],
      unlimitedAccess: [true],
      weeklyLimit: [null],
      peakHourAccess: [true],
      routineGeneration: [false],
      postureDetection: [false],
      isActive: [true],
      popularityRank: [0, [Validators.min(0)]],
      maxActiveMembers: [null]
    });

    // ✅ NUEVO: Formulario para asignación rápida
    this.assignmentForm = this.fb.group({
      paymentMethod: ['cash', [Validators.required]],
      notes: ['']
    });
  }

  // ================================================================================
  // 🆕 NUEVO: DETECTAR SI VIENE DESDE USER-LIST CON USUARIO RECIÉN CREADO
  // ================================================================================

  private checkForNewUserAssignment(): void {
    const paramsSub = this.route.queryParams.subscribe(params => {
      if (params['action'] === 'assign' && params['newUserId']) {
        this.newUserId = params['newUserId'];
        this.newUserName = params['userName'] || 'Usuario';
        
        console.log('💳 Nuevo usuario detectado para asignación:', this.newUserId);
        
        // Esperar a que se carguen los planes antes de mostrar el panel
        setTimeout(() => {
          if (this.plansDataSource.data.length > 0) {
            this.showQuickAssignPanel = true;
            this.showSuccess(
              `Selecciona un plan para ${this.newUserName}`
            );
            
            // Scroll al panel de asignación
            setTimeout(() => {
              document.querySelector('.quick-assign-panel')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 300);
          }
        }, 1000);

        // Limpiar query params sin recargar
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });

    this.subscriptions.add(paramsSub);
  }

  // ================================================================================
  // 💳 NUEVO: ASIGNACIÓN RÁPIDA DE MEMBRESÍA
  // ================================================================================

  selectPlanForAssignment(plan: MembershipPlan): void {
    this.selectedPlanForAssignment = plan;
    console.log('✅ Plan seleccionado para asignación:', plan.name);
  }

  async confirmAssignment(): Promise<void> {
    if (!this.newUserId || !this.selectedPlanForAssignment) {
      this.showError('Debe seleccionar un plan');
      return;
    }

    if (this.assignmentForm.invalid) {
      this.showError('Complete los datos de pago');
      return;
    }

    this.isLoading = true;

    try {
      const formData = this.assignmentForm.value;

      await this.membershipService.assignMembership(
        this.newUserId,
        this.selectedPlanForAssignment.id,
        formData.paymentMethod,
        this.currentUser?.email || 'unknown'
      );

      this.showSuccess(
        `Membresía ${this.selectedPlanForAssignment.name} asignada exitosamente a ${this.newUserName}`
      );

      // Limpiar estado
      this.cancelQuickAssign();

      // Recargar datos
      this.loadData();
      this.loadStats();

    } catch (error: any) {
      console.error('❌ Error asignando membresía:', error);
      this.showError(error.message || 'Error asignando membresía');
    } finally {
      this.isLoading = false;
    }
  }

  cancelQuickAssign(): void {
    this.showQuickAssignPanel = false;
    this.newUserId = null;
    this.newUserName = null;
    this.selectedPlanForAssignment = null;
    this.assignmentForm.reset({ paymentMethod: 'cash' });
  }

  private loadCurrentUser(): void {
    const userSub = this.authService.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('❌ Error cargando usuario:', error);
      }
    });
    this.subscriptions.add(userSub);
  }

  private loadData(): void {
    this.isLoading = true;

    // Cargar planes
    const plansSub = this.membershipService.plans$.subscribe({
      next: (plans) => {
        this.plansDataSource.data = plans;
        console.log('✅ Planes cargados:', plans.length);
      },
      error: (error) => {
        console.error('❌ Error cargando planes:', error);
        this.showError('Error cargando planes');
      }
    });

    // Cargar membresías
    const membershipsSub = this.membershipService.memberships$.subscribe({
      next: (memberships) => {
        this.membershipsDataSource.data = memberships;
        console.log('✅ Membresías cargadas:', memberships.length);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando membresías:', error);
        this.showError('Error cargando membresías');
        this.isLoading = false;
      }
    });

    this.subscriptions.add(plansSub);
    this.subscriptions.add(membershipsSub);
  }

  private loadStats(): void {
    const statsSub = this.membershipService.getMembershipStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        console.log('📊 Estadísticas:', stats);
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
      }
    });

    const revenueSub = this.membershipService.getRevenueByMonth(6).subscribe({
      next: (data) => {
        this.revenueData = data;
        console.log('📈 Ingresos mensuales:', data);
      },
      error: (error) => {
        console.error('❌ Error cargando ingresos:', error);
      }
    });

    this.subscriptions.add(statsSub);
    this.subscriptions.add(revenueSub);
  }

  private setupDataSourceConfigurations(): void {
    // Configurar paginadores después de que la vista esté inicializada
    setTimeout(() => {
      if (this.planPaginator) {
        this.plansDataSource.paginator = this.planPaginator;
      }
      if (this.planSort) {
        this.plansDataSource.sort = this.planSort;
      }
      if (this.membershipPaginator) {
        this.membershipsDataSource.paginator = this.membershipPaginator;
      }
      if (this.membershipSort) {
        this.membershipsDataSource.sort = this.membershipSort;
      }
    });
  }

  // ================================================================================
  // 📋 GESTIÓN DE PLANES
  // ================================================================================

  togglePlanForm(): void {
    this.showPlanForm = !this.showPlanForm;
    if (!this.showPlanForm) {
      this.editingPlan = null;
      this.planForm.reset({
        type: 'monthly',
        price: 0,
        durationDays: 30,
        unlimitedAccess: true,
        peakHourAccess: true,
        routineGeneration: false,
        postureDetection: false,
        isActive: true,
        popularityRank: 0
      });
    }
  }

  editPlan(plan: MembershipPlan): void {
    this.editingPlan = plan;
    this.showPlanForm = true;

    this.planForm.patchValue({
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: plan.price,
      durationDays: plan.durationDays,
      unlimitedAccess: plan.benefits.unlimitedAccess,
      weeklyLimit: plan.benefits.weeklyLimit,
      peakHourAccess: plan.benefits.peakHourAccess,
      routineGeneration: plan.benefits.routineGeneration,
      postureDetection: plan.benefits.postureDetection,
      isActive: plan.isActive,
      popularityRank: plan.popularityRank,
      maxActiveMembers: plan.maxActiveMembers
    });

    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('.plan-form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async savePlan(): Promise<void> {
    if (this.planForm.invalid) {
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    const formValue = this.planForm.value;

    try {
      const planData: any = {
        name: formValue.name,
        description: formValue.description,
        type: formValue.type,
        price: formValue.price,
        currency: 'USD',
        durationDays: formValue.durationDays,
        benefits: {
          unlimitedAccess: formValue.unlimitedAccess,
          weeklyLimit: formValue.weeklyLimit,
          peakHourAccess: formValue.peakHourAccess,
          routineGeneration: formValue.routineGeneration,
          postureDetection: formValue.postureDetection
        },
        isActive: formValue.isActive,
        popularityRank: formValue.popularityRank,
        maxActiveMembers: formValue.maxActiveMembers,
        updatedBy: this.currentUser?.email || 'unknown'
      };

      if (this.editingPlan) {
        // Actualizar plan existente
        await this.membershipService.updatePlan(this.editingPlan.id, planData);
        this.showSuccess('Plan actualizado correctamente');
      } else {
        // Crear nuevo plan
        await this.membershipService.addPlan(planData);
        this.showSuccess('Plan creado correctamente');
      }

      this.togglePlanForm();
    } catch (error) {
      console.error('❌ Error guardando plan:', error);
      this.showError('Error guardando plan: ' + error);
    } finally {
      this.isLoading = false;
    }
  }

  async deletePlan(plan: MembershipPlan): Promise<void> {
    if (!confirm(`¿Está seguro de eliminar el plan "${plan.name}"?`)) {
      return;
    }

    this.isLoading = true;
    try {
      await this.membershipService.deletePlan(plan.id);
      this.showSuccess('Plan eliminado correctamente');
    } catch (error: any) {
      console.error('❌ Error eliminando plan:', error);
      this.showError(error.message || 'Error eliminando plan');
    } finally {
      this.isLoading = false;
    }
  }

  async togglePlanStatus(plan: MembershipPlan): Promise<void> {
    try {
      await this.membershipService.updatePlan(plan.id, {
        isActive: !plan.isActive,
        updatedBy: this.currentUser?.email || 'unknown'
      });
      this.showSuccess(`Plan ${!plan.isActive ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('❌ Error cambiando estado del plan:', error);
      this.showError('Error cambiando estado del plan');
    }
  }

  // ================================================================================
  // 👥 GESTIÓN DE MEMBRESÍAS
  // ================================================================================

  async renewMembership(membership: UserMembership): Promise<void> {
    // En un caso real, aquí abriríamos un diálogo para confirmar el pago
    const paymentMethod = 'cash'; // Por defecto, podría ser un diálogo
    
    this.isLoading = true;
    try {
      await this.membershipService.renewMembership(
        membership.id,
        paymentMethod,
        this.currentUser?.email || 'unknown'
      );
      this.showSuccess('Membresía renovada correctamente');
    } catch (error) {
      console.error('❌ Error renovando membresía:', error);
      this.showError('Error renovando membresía');
    } finally {
      this.isLoading = false;
    }
  }

  async cancelMembership(membership: UserMembership): Promise<void> {
    if (!confirm('¿Está seguro de cancelar esta membresía?')) {
      return;
    }

    this.isLoading = true;
    try {
      await this.membershipService.cancelMembership(membership.id);
      this.showSuccess('Membresía cancelada correctamente');
    } catch (error) {
      console.error('❌ Error cancelando membresía:', error);
      this.showError('Error cancelando membresía');
    } finally {
      this.isLoading = false;
    }
  }

  viewMembershipHistory(membership: UserMembership): void {
    // Aquí podrías abrir un diálogo con el historial de pagos
    console.log('Ver historial de:', membership);
    this.showInfo('Historial de pagos (implementar diálogo)');
  }

  // ================================================================================
  // 🔍 FILTROS Y BÚSQUEDA
  // ================================================================================

  applyPlanFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.plansDataSource.filter = filterValue.trim().toLowerCase();
  }

  applyMembershipFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.membershipsDataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByPlan(planId: string): void {
    this.selectedPlanFilter = planId;
    if (planId === 'all') {
      this.membershipsDataSource.filter = '';
    } else {
      this.membershipsDataSource.filterPredicate = (data: UserMembership) => {
        return data.planId === planId;
      };
      this.membershipsDataSource.filter = planId;
    }
  }

  filterByStatus(status: string): void {
    this.selectedStatusFilter = status;
    if (status === 'all') {
      this.membershipsDataSource.filter = '';
    } else {
      this.membershipsDataSource.filterPredicate = (data: UserMembership) => {
        return data.status === status;
      };
      this.membershipsDataSource.filter = status;
    }
  }

  // ================================================================================
  // 🛠️ UTILIDADES
  // ================================================================================

  getPlanName(planId: string): string {
    const plan = this.plansDataSource.data.find(p => p.id === planId);
    return plan ? plan.name : 'Plan no encontrado';
  }

  getDaysRemaining(endDate: Date): number {
    return this.membershipService.getDaysRemaining(endDate);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'accent',
      'expired': 'warn',
      'cancelled': 'accent',
      'pending-payment': 'warn'
    };
    return colors[status] || 'accent';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Activa',
      'expired': 'Vencida',
      'cancelled': 'Cancelada',
      'pending-payment': 'Pago Pendiente'
    };
    return labels[status] || status;
  }
  getUserName(userId: string): string {
    return this.membershipService.getUserName(userId);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'semiannual': 'Semestral',
      'annual': 'Anual',
      'day-pass': 'Pase Diario'
    };
    return labels[type] || type;
  }

  formatPrice(price: number): string {
    return Math.round(price).toString(); // Sin decimales, sin $
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getBarHeight(revenue: number): number {
    if (!this.revenueData || this.revenueData.length === 0) return 0;
    const maxRevenue = Math.max(...this.revenueData.map(d => d.revenue));
    if (maxRevenue === 0) return 0;
    return (revenue / maxRevenue) * 100;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/overview']);
  }

  refreshData(): void {
    this.loadData();
    this.loadStats();
    this.showSuccess('Datos actualizados');
  }

  async checkExpiredMemberships(): Promise<void> {
    this.isLoading = true;
    try {
      await this.membershipService.checkAndUpdateExpiredMemberships();
      this.showSuccess('Verificación completada');
      this.refreshData();
    } catch (error) {
      console.error('❌ Error verificando membresías:', error);
      this.showError('Error verificando membresías vencidas');
    } finally {
      this.isLoading = false;
    }
  }

  exportData(): void {
    // Implementar exportación a CSV/Excel
    this.showInfo('Exportación (implementar)');
  }

  // ================================================================================
  // 🎨 UI HELPERS
  // ================================================================================

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }
}