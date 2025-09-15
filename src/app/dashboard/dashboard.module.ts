// src/app/dashboard/dashboard.module.ts
// 📊 MÓDULO DASHBOARD TEMPORAL - PARA QUE COMPILE

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// ✅ COMPONENTE TEMPORAL SIMPLE
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  template: `
    <div style="padding: 2rem; text-align: center;">
      <h1>🎉 ¡Login Exitoso!</h1>
      <h2>Dashboard FitNova</h2>
      <p>Autenticación funcionando correctamente</p>
      <p>Próximo paso: Implementar métricas del móvil</p>
    </div>
  `
})
export class DashboardOverviewComponent { }

// ✅ RUTAS TEMPORALES
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
    RouterModule.forChild(routes)
  ]
})
export class DashboardModule { }