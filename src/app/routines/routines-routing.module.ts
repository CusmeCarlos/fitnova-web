// src/app/routines/routines-routing.module.ts
// 🛣️ RUTAS PARA MÓDULO DE RUTINAS IA - CORREGIDAS

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoutineValidationComponent } from './routine-validation/routine-validation.component';

const routes: Routes = [
  {
    path: '',
    component: RoutineValidationComponent,
    title: 'Validación de Rutinas IA - FitNova'
  },
  {
    path: 'validation',
    component: RoutineValidationComponent,
    title: 'Validación de Rutinas IA - FitNova'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RoutinesRoutingModule { }