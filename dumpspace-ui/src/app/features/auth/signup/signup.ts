import { Component, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
})

export class Signup { 
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  loading = false;
  error = '';

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
  );

  matchPasswords(): ValidationErrors | null {
    const password = this.form.get('password')?.value;
    const confirm = this.form.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  };

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.loading = true;

    if (this.matchPasswords() !== null) {
      this.error = this.auth.mapAuthError({'code': 'auth/password-mismatch'});
      this.loading = false;
      return;
    }

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signup(email!, password!);
      await this.router.navigate(['/login']);
    } catch (err: any) {
      this.zone.run(() => {
        this.error = this.auth.mapAuthError(err);
        this.loading = false;
      });
    }
  }
}
