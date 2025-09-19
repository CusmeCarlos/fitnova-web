// src/app/alerts/alerts.module.ts
// 🚨 MÓDULO DE ALERTAS CRÍTICAS COMPLETO

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// ✅ MATERIAL DESIGN MODULES - MISMO PATRÓN QUE TUS OTROS MÓDULOS
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

// ✅ COMPONENTES STANDALONE
import { AlertDashboardComponent } from './alert-dashboard/alert-dashboard.component';

// ✅ RUTAS DEL MÓDULO ALERTS
const routes: Routes = [
  {
    path: '',
    redirectTo: '/alerts/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: AlertDashboardComponent,
    title: 'Centro de Alertas Críticas - FitNova'
  },
  // TODO: Futuras rutas para componentes adicionales
  // {
  //   path: 'list',
  //   component: AlertListComponent,
  //   title: 'Lista de Alertas - FitNova'
  // },
  // {
  //   path: 'detail/:id',
  //   component: AlertDetailComponent,
  //   title: 'Detalle de Alerta - FitNova'
  // }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    
    // ✅ MATERIAL MODULES
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatDividerModule,
    MatBadgeModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatDialogModule
  ]
})
export class AlertsModule { }