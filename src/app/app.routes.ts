// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { TrainerGuard } from './guards/trainer.guard';
import { MainLayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    title: 'Autenticación - FitNova'
  },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [TrainerGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        title: 'Dashboard - FitNova'
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
        title: 'Usuarios - FitNova'
      },
      {
        path: 'alerts',
        loadChildren: () => import('./alerts/alerts.module').then(m => m.AlertsModule),
        title: 'Alertas - FitNova'
      },
      {
        path: 'routines',
        loadChildren: () => import('./routines/routines.module').then(m => m.RoutinesModule),
        title: 'Rutinas IA - FitNova'
      },
      {
        path: 'analytics',
        loadChildren: () => import('./analytics/analytics.module').then(m => m.AnalyticsModule),
        title: 'Analytics - FitNova'
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/settings/settings.component').then(c => c.SettingsComponent),
        title: 'Configuración - FitNova'
      }
    ]
  },

  {
    path: '**',
    redirectTo: '/auth/login'
  }
];