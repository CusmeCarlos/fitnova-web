// src/app/shared/equipment/equipment.component.ts
// 🏋️ GESTIÓN DE EQUIPAMIENTO ULTRA PREMIUM - NIVEL FINZENAPP

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// ✅ SERVICIOS
import { EquipmentService } from '../../core/equipment.service';
import { AuthService } from '../../core/auth.service';
import { GymEquipment } from '../../interfaces/gym-management.interface';

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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu'; // ← FALTABA ESTO
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-equipment',
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
    MatAutocompleteModule,
    MatMenuModule,
    MatExpansionModule // ← AGREGAR AQUÍ
  ],
  templateUrl: './equipment.component.html',
  styleUrls: ['./equipment.component.scss']
})
export class EquipmentComponent implements OnInit, OnDestroy {

  // ✅ VIEW CHILDREN
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ✅ ESTADO DEL COMPONENTE
  isLoading = true;
  currentUser: any = null;
  selectedView: 'cards' | 'table' = 'cards';
  showAddForm = false;
  editingEquipment: GymEquipment | null = null;
  
  // ✅ DATOS
  equipmentList: GymEquipment[] = [];
  filteredEquipment: GymEquipment[] = [];
  dataSource = new MatTableDataSource<GymEquipment>([]);
  equipmentStats: any = null;

  // ✅ FORMULARIO
  equipmentForm!: FormGroup;
  
  // ✅ FILTROS
  filterCategory = 'all';
  filterStatus = 'all';
  filterZone = 'all';
  searchTerm = '';

  // ✅ OPCIONES
  categoryOptions: any[] = [];
  statusOptions: any[] = [];
  equipmentCatalog: any = {};
  catalogItems: any[] = [];
  showCatalog = false;

  // ✅ COLUMNAS DE TABLA
  displayedColumns: string[] = [
    'name',
    'category',
    'quantity',
    'status',
    'zone',
    'lastMaintenance',
    'actions'
  ];

  // ✅ SUBSCRIPCIONES
  private subscriptions = new Subscription();

  constructor(
    private equipmentService: EquipmentService,
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    console.log('🏋️ EquipmentComponent inicializado');
    this.initializeForm();
  }

  ngOnInit(): void {
    console.log('🔄 Inicializando gestión de equipamiento...');
    this.loadCurrentUser();
    this.loadEquipment();
    this.loadOptions();
  }

  ngOnDestroy(): void {
    console.log('🔥 Limpiando EquipmentComponent...');
    this.subscriptions.unsubscribe();
  }

  // ================================================================================
  // 🔧 INICIALIZACIÓN
  // ================================================================================

  private initializeForm(): void {
    this.equipmentForm = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        category: ['free-weights', Validators.required],
        brand: [''],
        quantity: [1, [Validators.required, Validators.min(1)]],
        status: ['operational', Validators.required],
        zone: [[], Validators.required], // 👈 ahora es array para selección múltiple
        purchaseDate: [null],
        cost: [null, Validators.min(0)],
        notes: [''],
        imageUrl: [''],
        // Specifications
        weightRange: [''], // aquí va "1 a 5 kg", etc
        maxWeight: [null],
        dimensions: [''],
        powerRequired: [false]
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

  private loadEquipment(): void {
    this.isLoading = true;

    const equipmentSub = this.equipmentService.equipment$.subscribe({
      next: (equipment) => {
        console.log(`✅ ${equipment.length} equipos cargados`);
        this.equipmentList = equipment;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando equipamiento:', error);
        this.isLoading = false;
        this.showErrorMessage('Error cargando equipamiento');
      }
    });

    const statsSub = this.equipmentService.getEquipmentStats().subscribe({
      next: (stats) => {
        this.equipmentStats = stats;
        console.log('📊 Estadísticas de equipamiento:', stats);
      }
    });

    this.subscriptions.add(equipmentSub);
    this.subscriptions.add(statsSub);
  }

  private loadOptions(): void {
    this.categoryOptions = this.equipmentService.getCategoryOptions();
    this.statusOptions = this.equipmentService.getStatusOptions();
    this.equipmentCatalog = this.equipmentService.getEquipmentCatalog();
  }

  // ================================================================================
  // 📝 CRUD OPERATIONS
  // ================================================================================

  async onSubmit(): Promise<void> {
    if (this.equipmentForm.invalid) {
      this.showErrorMessage('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const formValue = this.equipmentForm.value;
      
      const equipmentData: any = {
        name: formValue.name,
        category: formValue.category,
        brand: formValue.brand || undefined,
        quantity: formValue.quantity,
        status: formValue.status,
        zone: formValue.zone,
        purchaseDate: formValue.purchaseDate || undefined,
        cost: formValue.cost || undefined,
        notes: formValue.notes || '',
        imageUrl: formValue.imageUrl || '',
        specifications: {
          weightRange: formValue.weightRange || '',
          maxWeight: formValue.maxWeight || null,
          dimensions: formValue.dimensions || '',
          powerRequired: formValue.powerRequired || false
        },
        usageStats: {
          totalUses: 0,
          averageUsesPerDay: 0
        },
        updatedBy: this.currentUser?.email || 'unknown'
      };

      if (this.editingEquipment) {
        // ACTUALIZAR
        await this.equipmentService.updateEquipment(
          this.editingEquipment.id,
          equipmentData
        );
        this.showSuccessMessage('Equipo actualizado correctamente');
      } else {
        // CREAR NUEVO
        await this.equipmentService.addEquipment(equipmentData);
        this.showSuccessMessage('Equipo agregado correctamente');
      }

      this.cancelForm();
    } catch (error) {
      console.error('❌ Error guardando equipo:', error);
      this.showErrorMessage('Error guardando el equipo');
    }
  }

  editEquipment(equipment: GymEquipment): void {
    this.editingEquipment = equipment;
    this.showAddForm = true;
    
    this.equipmentForm.patchValue({
      name: equipment.name,
      category: equipment.category,
      brand: equipment.brand || '',
      quantity: equipment.quantity,
      status: equipment.status,
      zone: equipment.zone,
      purchaseDate: equipment.purchaseDate || null,
      cost: equipment.cost || null,
      notes: equipment.notes || '',
      imageUrl: equipment.imageUrl || '',
      weightRange: equipment.specifications?.weightRange || '',
      maxWeight: equipment.specifications?.maxWeight || null,
      dimensions: equipment.specifications?.dimensions || '',
      powerRequired: equipment.specifications?.powerRequired || false
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteEquipment(equipment: GymEquipment): Promise<void> {
    const confirmed = confirm(
      `¿Estás seguro de eliminar "${equipment.name}"?\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await this.equipmentService.deleteEquipment(equipment.id);
      this.showSuccessMessage('Equipo eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando equipo:', error);
      this.showErrorMessage('Error eliminando el equipo');
    }
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.editingEquipment = null;
    this.equipmentForm.reset({
      category: 'free-weights',
      quantity: 1,
      status: 'operational',
      powerRequired: false
    });
  }

  // ================================================================================
  // 🔍 FILTROS
  // ================================================================================

  applyFilters(): void {
    const filterSub = this.equipmentService.filterEquipment(
      this.filterCategory,
      this.filterStatus,
      this.filterZone,
      this.searchTerm
    ).subscribe({
      next: (filtered) => {
        this.filteredEquipment = filtered;
        this.dataSource.data = filtered;
        
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      }
    });

    this.subscriptions.add(filterSub);
  }

  onCategoryFilterChange(category: string): void {
    this.filterCategory = category;
    this.applyFilters();
  }

  onStatusFilterChange(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterCategory = 'all';
    this.filterStatus = 'all';
    this.filterZone = 'all';
    this.searchTerm = '';
    this.applyFilters();
  }

  // ================================================================================
  // 🛠️ MANTENIMIENTO
  // ================================================================================

  async markForMaintenance(equipment: GymEquipment): Promise<void> {
    const nextDate = prompt('Ingresa la próxima fecha de mantenimiento (YYYY-MM-DD):');
    if (!nextDate) return;

    try {
      const date = new Date(nextDate);
      await this.equipmentService.markForMaintenance(
        equipment.id,
        date,
        this.currentUser?.email || 'unknown'
      );
      this.showSuccessMessage('Equipo marcado para mantenimiento');
    } catch (error) {
      console.error('❌ Error marcando mantenimiento:', error);
      this.showErrorMessage('Error marcando mantenimiento');
    }
  }

  async completeMaintenanceAndMarkOperational(equipment: GymEquipment): Promise<void> {
    const confirmed = confirm(
      `¿Marcar "${equipment.name}" como operacional después del mantenimiento?`
    );

    if (!confirmed) return;

    try {
      await this.equipmentService.completeMaintenanceAndMarkOperational(
        equipment.id,
        this.currentUser?.email || 'unknown'
      );
      this.showSuccessMessage('Mantenimiento completado, equipo operacional');
    } catch (error) {
      console.error('❌ Error completando mantenimiento:', error);
      this.showErrorMessage('Error completando mantenimiento');
    }
  }

  // ================================================================================
  // 📦 CATÁLOGO PREDEFINIDO
  // ================================================================================

  toggleCatalog(): void {
    this.showCatalog = !this.showCatalog;
    if (this.showCatalog) {
      this.loadCatalogItems();
    }
  }

  loadCatalogItems(): void {
    const category = this.equipmentForm.get('category')?.value || 'free-weights';
    this.catalogItems = this.equipmentCatalog[category] || [];
  }

  // ✅ NUEVO MÉTODO: Filtrar items por subcategoría usando palabras clave
  getCatalogItemsBySubcategory(category: string, keywords: string): any[] {
    const items = this.equipmentCatalog[category] || [];
    const keywordArray = keywords.split('|');
    
    return items.filter((item: any) => 
      keywordArray.some(keyword => 
        item.name.includes(keyword)
      )
    );
  }

  selectFromCatalog(item: any, category: string): void {
    this.equipmentForm.patchValue({
      name: item.name,
      category: category,
      brand: item.brand || '',
      quantity: item.quantity || 1,
      status: item.status || 'operational',
      zone: item.zone ? [item.zone] : [], // 👈 array para selección múltiple
      weightRange: item.weightRange || '', // 👈 "1 a 5 kg"
      maxWeight: item.maxWeight || null,
      dimensions: item.dimensions || '',
      powerRequired: item.powerRequired || false
    });
    this.showCatalog = false;
  }
  
  

  onCategoryChange(): void {
    if (this.showCatalog) {
      this.loadCatalogItems();
    }
  }

  // ================================================================================
  // 🎨 UI HELPERS
  // ================================================================================

  toggleView(view: 'cards' | 'table'): void {
    this.selectedView = view;
  }

  getStatusColor(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.color || '#6b7280';
  }

  getCategoryIcon(category: string): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.icon || 'fitness_center';
  }

  needsMaintenance(equipment: GymEquipment): boolean {
    if (!equipment.nextMaintenanceDate) return false;
    return equipment.nextMaintenanceDate < new Date();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ================================================================================
  // 💬 MENSAJES
  // ================================================================================

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-success']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error']
    });
  }
}