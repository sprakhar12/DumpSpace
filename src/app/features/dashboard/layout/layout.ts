import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})

export class DashboardLayout {
  auth = inject(AuthService);
  private router = inject(Router);

  displayName = computed(() => {
    // ToDo : user friendly Display Name
  });

  initials(emailOrName: string | null | undefined) {
    const s = (emailOrName ?? '').trim();
    if (!s) return 'U';
    const base = s.includes('@') ? s.split('@')[0] : s;
    const parts = base.split(/[.\s_-]+/).filter(Boolean);
    const a = parts[0]?.[0] ?? 'U';
    const b = parts.length > 1 ? (parts[1]?.[0] ?? '') : (base.length > 1 ? base[1] : '');
    return (a + b).toUpperCase();
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
