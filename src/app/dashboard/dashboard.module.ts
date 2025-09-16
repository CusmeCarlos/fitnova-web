// src/app/dashboard/dashboard.module.ts
// 📊 MÓDULO DASHBOARD COMPLETO CON COMPONENTE REAL

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ✅ IMPORTAR COMPONENTE REAL
import { DashboardOverviewComponent } from './overview/overview.component';

// ✅ RUTAS DEL DASHBOARD
const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard/overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    component: DashboardOverviewComponent,
    title: 'Dashboard Principal - FitNova'
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // El componente es standalone, se importa automáticamente
  ]
})
export class DashboardModule { }