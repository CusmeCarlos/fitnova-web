// src/app/app.routes.ts
// 🛣️ RUTAS PRINCIPALES - SOLO MÓDULOS EXISTENTES

import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { TrainerGuard } from './guards/trainer.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // ✅ RUTA RAÍZ - REDIRECCIÓN INTELIGENTE
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  // ✅ AUTENTICACIÓN (sin guard - acceso público)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    title: 'Autenticación - FitNova'
  },

  // ✅ DASHBOARD PRINCIPAL (trainer + admin)
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [TrainerGuard],
    title: 'Dashboard - FitNova'
  },

  // ✅ GESTIÓN DE USUARIOS MÓVIL (trainer + admin)
  {
    path: 'users',
    loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
    canActivate: [TrainerGuard],
    title: 'Usuarios - FitNova'
  },

  // ✅ ALERTAS CRÍTICAS (trainer + admin)
  {
    path: 'alerts',
    loadChildren: () => import('./alerts/alerts.module').then(m => m.AlertsModule),
    canActivate: [TrainerGuard],
    title: 'Alertas - FitNova'
  },

  // ✅ RUTINAS IA (trainer + admin)
  {
    path: 'routines',
    loadChildren: () => import('./routines/routines.module').then(m => m.RoutinesModule),
    canActivate: [TrainerGuard],
    title: 'Rutinas IA - FitNova'
  },

  // ✅ ANALYTICS Y REPORTES (trainer + admin)
  {
    path: 'analytics',
    loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsModule),
    canActivate: [TrainerGuard],
    title: 'Analytics - FitNova'
  },

  // ✅ PÁGINAS DE ERROR Y SISTEMA
  {
    path: 'shared',
    children: [
      {
        path: 'forbidden',
        loadComponent: () => import('./shared/forbidden/forbidden.component').then(c => c.ForbiddenComponent),
        title: 'Acceso Denegado - FitNova'
      },
      {
        path: 'not-found',
        loadComponent: () => import('./shared/not-found/not-found.component').then(c => c.NotFoundComponent),
        title: 'Página No Encontrada - FitNova'  
      },
      {
        path: 'server-error',
        loadComponent: () => import('./shared/server-error/server-error.component').then(c => c.ServerErrorComponent),
        title: 'Error del Servidor - FitNova'
      }
    ]
  },

  // ✅ WILDCARD - 404
  {
    path: '**',
    redirectTo: '/shared/not-found'
  }
];

