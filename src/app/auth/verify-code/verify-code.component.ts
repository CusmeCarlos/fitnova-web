import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-verify-code',
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
  templateUrl: './verify-code.component.html',
  styleUrls: ['./verify-code.component.scss']
})
export class VerifyCodeComponent implements OnInit {
  verifyCodeForm: FormGroup;
  isLoading = false;
  email = '';
  resendCooldown = 0;
  resendTimer: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.verifyCodeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/), Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit(): void {
    // Obtener el email de los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.snackBar.open('Sesión inválida. Por favor, inicia el proceso nuevamente.', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/auth/forgot-password']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.verifyCodeForm.valid && !this.isLoading) {
      this.isLoading = true;
      const code = this.verifyCodeForm.get('code')?.value;

      try {
        // Verificar el código
        const isValid = await this.authService.verifyPasswordResetCode(this.email, code);

        if (isValid) {
          this.snackBar.open('Código verificado correctamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          // Navegar a la página de nueva contraseña
          this.router.navigate(['/auth/reset-password'], {
            queryParams: { email: this.email, code }
          });
        } else {
          this.snackBar.open('Código inválido o expirado', 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      } catch (error: any) {
        console.error('Error al verificar código:', error);

        let errorMessage = 'Error al verificar el código';

        if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Código inválido o expirado';
        } else if (error.code === 'auth/expired-action-code') {
          errorMessage = 'El código ha expirado. Solicita uno nuevo';
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
      this.verifyCodeForm.markAllAsTouched();
    }
  }

  async resendCode(): Promise<void> {
    if (this.resendCooldown > 0 || this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.sendPasswordResetCode(this.email);

      this.snackBar.open('Nuevo código enviado a tu correo', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });

      // Iniciar cooldown de 60 segundos
      this.resendCooldown = 60;
      this.resendTimer = setInterval(() => {
        this.resendCooldown--;
        if (this.resendCooldown <= 0) {
          clearInterval(this.resendTimer);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error al reenviar código:', error);

      let errorMessage = 'Error al reenviar el código';

      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
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
  }

  getErrorMessage(fieldName: string): string {
    const field = this.verifyCodeForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'El código es requerido';
    }

    if (field?.hasError('pattern') || field?.hasError('minlength') || field?.hasError('maxlength')) {
      return 'El código debe tener 6 dígitos';
    }

    return '';
  }

  // Formatear entrada para aceptar solo números
  onCodeInput(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
    this.verifyCodeForm.get('code')?.setValue(input.value);
  }
}
