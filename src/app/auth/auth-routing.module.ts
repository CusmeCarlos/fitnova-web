// src/app/auth/auth-routing.module.ts
// 🛣️ RUTAS DE AUTENTICACIÓN

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyCodeComponent } from './verify-code/verify-code.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Iniciar Sesión - FitNova'
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'Recuperar Contraseña - FitNova'
  },
  {
    path: 'verify-code',
    component: VerifyCodeComponent,
    title: 'Verificar Código - FitNova'
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Restablecer Contraseña - FitNova'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }