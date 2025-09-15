// src/app/auth/login/login.component.ts
// 🔐 LOGIN COMPONENT WEB - ADAPTADO DE MÓVIL FUNCIONAL

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// ✅ MATERIAL DESIGN IMPORTS
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;

  // ✅ CREDENCIALES PRECARGADAS PARA TESTING (igual que móvil)
  testCredentials = {
    trainer: {
      email: 'trainer@fitnova.com',
      password: 'trainer123'
    },
    admin: {
      email: 'admin@fitnova.com', 
      password: 'admin123'
    }
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // ✅ VERIFICAR SI YA ESTÁ LOGUEADO
    this.auth.user$.subscribe(user => {
      if (user) {
        console.log('✅ Usuario ya logueado, redirigiendo...');
        this.router.navigate(['/dashboard/overview']);
      }
    });
  }

  // ✅ INICIALIZAR FORMULARIO REACTIVO (misma lógica que móvil)
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // ✅ PRECARGAR CREDENCIALES DE TRAINER PARA TESTING
    if (this.testCredentials.trainer) {
      this.loginForm.patchValue({
        email: this.testCredentials.trainer.email,
        password: this.testCredentials.trainer.password
      });
    }
  }

  // ✅ LOGIN - MISMA LÓGICA QUE MÓVIL
  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { email, password } = this.loginForm.value;
      
      console.log('🔐 Intentando login web:', email);
      await this.auth.login(email, password);
      
      // La navegación se maneja en AuthService tras login exitoso
    } catch (error) {
      console.error('❌ Error en login:', error);
      // Los errores se manejan en AuthService con snackbar
    } finally {
      this.isLoading = false;
    }
  }

  // ✅ CARGAR CREDENCIALES DE TESTING
  loadTestCredentials(role: 'trainer' | 'admin'): void {
    const credentials = this.testCredentials[role];
    if (credentials) {
      this.loginForm.patchValue(credentials);
      console.log(`📋 Credenciales de ${role} cargadas`);
    }
  }

  // ✅ TOGGLE VISIBILIDAD PASSWORD
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // ✅ MARCAR TODOS LOS CAMPOS COMO TOUCHED PARA MOSTRAR ERRORES
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  // ✅ GETTERS PARA VALIDACIÓN DE ERRORES (igual que móvil)
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  // ✅ MENSAJES DE ERROR DINÁMICOS
  getEmailErrorMessage(): string {
    if (this.email?.hasError('required')) {
      return 'El correo electrónico es obligatorio';
    }
    if (this.email?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    if (this.password?.hasError('required')) {
      return 'La contraseña es obligatoria';
    }
    if (this.password?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  // ✅ RESET PASSWORD (funcionalidad adicional para web)
  async onForgotPassword(): Promise<void> {
    const email = this.email?.value;
    if (!email) {
      this.email?.markAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      await this.auth.resetPassword(email);
    } catch (error) {
      // Error manejado en AuthService
    } finally {
      this.isLoading = false;
    }
  }
}