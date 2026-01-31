import { Component, NgZone, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})

export class Login implements OnInit, OnDestroy{
  images = [
    'assets/login/1.jpg',
    'assets/login/2.jpg',
    'assets/login/3.jpg',
  ];

  a = this.images[0];
  b = this.images[1];
  showA = true;

  private idx = 1;
  private timerId: any;

  ngOnInit(): void {
    this.images.forEach(src => { const img = new Image(); img.src = src; });
    
    this.timerId = setInterval(() => {
      this.idx = (this.idx + 1) % this.images.length;
      const next = this.images[this.idx];

      if (this.showA) this.b = next;
      else this.a = next;

      this.showA = !this.showA;
    }, 4500);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.loading = true;

    try{
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email!, password!);
      await this.router.navigate(['/home']);
    } catch (err: any) {
      this.zone.run(() => {
        this.error = this.auth.mapAuthError(err);
        this.loading = false;
      });
    }
  }
}
