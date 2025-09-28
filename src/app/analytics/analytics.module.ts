// src/app/analytics/analytics.module.ts
// 📊 MÓDULO DE ANALYTICS EJECUTIVO COMPLETO

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// ✅ MATERIAL DESIGN MODULES - MISMO PATRÓN QUE ALERTS
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
import { MatSnackBarModule } from '@angular/material/snack-bar';

// ✅ RUTAS DEL MÓDULO ANALYTICS
const routes: Routes = [
  {
    path: '',
    redirectTo: '/analytics/overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./overview/overview.component')
      .then(c => c.OverviewComponent),
    title: 'Analytics Ejecutivo - FitNova'
  }
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
    MatSnackBarModule
  ]
})
export class AnalyticsModule { }