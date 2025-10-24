// src/app/auth/login/login.component.ts
// 🔐 LOGIN PREMIUM ESTILO FINZENAPP - SIN TESTING

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// Material Design Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  isFormAnimated = false;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Animación de entrada
    setTimeout(() => {
      this.isFormAnimated = true;
    }, 100);

    // Verificar usuario logueado
    const userSub = this.auth.user$.subscribe(user => {
      if (user) {
        console.log('✅ Usuario ya logueado, redirigiendo...');
        this.router.navigate(['/dashboard/overview']);
      }
    });
    this.subscriptions.add(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.showError('Por favor completa todos los campos correctamente');
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    try {
      const result = await this.auth.login(email, password);
      
      console.log('✅ Login exitoso');
      this.showSuccess('¡Bienvenido a FitNova!');
      setTimeout(() => {
        this.router.navigate(['/dashboard/overview']);
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      this.showError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, '✅', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, '❌', {
      duration: 4000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // Getters para validación en template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}