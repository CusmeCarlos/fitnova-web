// src/app/analytics/analytics-routing.module.ts
// 📊 ROUTING PARA MÓDULO DE ANALYTICS EJECUTIVO - CORREGIDO

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
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
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyticsRoutingModule { }