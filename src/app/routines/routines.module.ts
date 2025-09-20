// src/app/routines/routines.module.ts
// 🤖 MÓDULO DE RUTINAS IA - INTEGRACIÓN COMPLETA

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// ✅ ANGULAR MATERIAL IMPORTS
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

// ✅ ROUTING
import { RoutinesRoutingModule } from './routines-routing.module';

// ✅ SERVICIOS
import { RoutineValidationService } from '../core/routine-validation.service';

// ✅ COMPONENTES
import { RoutineValidationComponent } from './routine-validation/routine-validation.component';

@NgModule({
  declarations: [
    // ✅ No declarar RoutineValidationComponent aquí porque es standalone
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RoutinesRoutingModule,
    
    // ✅ MATERIAL MODULES
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatListModule,
    
    // ✅ COMPONENTES STANDALONE
    RoutineValidationComponent
  ],
  providers: [
    // ✅ SERVICIOS DEL MÓDULO
    RoutineValidationService
  ]
})
export class RoutinesModule { }