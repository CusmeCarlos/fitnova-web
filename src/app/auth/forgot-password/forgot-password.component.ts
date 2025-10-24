import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forgot-password',
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
    MatSnackBarModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {}

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;

      try {
        // Enviar código de verificación
        await this.authService.sendPasswordResetCode(email);

        this.snackBar.open('Código de verificación enviado a tu correo', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Navegar a la página de verificación de código
        this.router.navigate(['/auth/verify-code'], {
          queryParams: { email }
        });
      } catch (error: any) {
        console.error('Error al enviar código de recuperación:', error);

        let errorMessage = 'Error al enviar el código de verificación';

        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No existe una cuenta con este correo electrónico';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Correo electrónico inválido';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      this.forgotPasswordForm.markAllAsTouched();
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (field?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }

    return '';
  }
}
