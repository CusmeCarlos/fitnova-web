import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  email = '';
  code = '';
  hidePassword = true;
  hideConfirmPassword = true;

  // Requisitos de contraseña
  passwordRequirements = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator.bind(this)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Obtener email y código de los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.code = params['code'] || '';

      if (!this.email || !this.code) {
        this.snackBar.open('Sesión inválida. Por favor, inicia el proceso nuevamente.', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/auth/forgot-password']);
      }
    });

    // Monitorear cambios en el campo de contraseña para actualizar requisitos
    this.resetPasswordForm.get('password')?.valueChanges.subscribe(value => {
      this.updatePasswordRequirements(value);
    });
  }

  // Validador personalizado para verificar la fortaleza de la contraseña
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return !passwordValid ? { passwordStrength: true } : null;
  }

  // Validador para verificar que las contraseñas coincidan
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Actualizar el estado de los requisitos de contraseña
  updatePasswordRequirements(password: string): void {
    this.passwordRequirements.minLength = password.length >= 8;
    this.passwordRequirements.hasUpperCase = /[A-Z]/.test(password);
    this.passwordRequirements.hasLowerCase = /[a-z]/.test(password);
    this.passwordRequirements.hasNumber = /[0-9]/.test(password);
    this.passwordRequirements.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      const newPassword = this.resetPasswordForm.get('password')?.value;

      try {
        // Restablecer la contraseña
        await this.authService.confirmPasswordReset(this.email, this.code, newPassword);

        this.snackBar.open('Contraseña restablecida exitosamente', 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Navegar al login
        this.router.navigate(['/auth/login']);
      } catch (error: any) {
        console.error('Error al restablecer contraseña:', error);

        let errorMessage = 'Error al restablecer la contraseña';

        if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Código inválido o expirado. Solicita uno nuevo';
        } else if (error.code === 'auth/expired-action-code') {
          errorMessage = 'El código ha expirado. Solicita uno nuevo';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'La contraseña es demasiado débil';
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
      this.resetPasswordForm.markAllAsTouched();
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.resetPasswordForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (fieldName === 'password') {
      if (field?.hasError('minlength')) {
        return 'La contraseña debe tener al menos 8 caracteres';
      }
      if (field?.hasError('passwordStrength')) {
        return 'La contraseña no cumple con los requisitos de seguridad';
      }
    }

    if (fieldName === 'confirmPassword') {
      if (this.resetPasswordForm.hasError('passwordMismatch')) {
        return 'Las contraseñas no coinciden';
      }
    }

    return '';
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }
}
