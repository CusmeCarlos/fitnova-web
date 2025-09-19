// src/app/alerts/alerts-routing.module.ts
// 🚨 ROUTING PARA MÓDULO DE ALERTAS CRÍTICAS

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/alerts/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./alert-dashboard/alert-dashboard.component')
      .then(c => c.AlertDashboardComponent),
    title: 'Centro de Alertas - FitNova'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AlertsRoutingModule { }