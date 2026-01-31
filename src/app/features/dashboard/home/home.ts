import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MediaService, MediaDoc } from '../../../core/media.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class DashboardHome {
  private mediaSvc = inject(MediaService);

  stats$ = this.mediaSvc.stats$();
  recent$ = this.mediaSvc.recent$(8);

  // Preview modal
  previewUrl: string | null = null;
  previewName = '';
  previewIsVideo = false;

  openPreview(m: MediaDoc, ev?: Event) {
    ev?.stopPropagation();
    this.previewUrl = m.downloadUrl;
    this.previewName = m.originalName || m.name;
    this.previewIsVideo = (m.contentType || '').startsWith('video/');
  }

  closePreview() {
    this.previewUrl = null;
    this.previewName = '';
    this.previewIsVideo = false;
  }

  download(m: MediaDoc, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    this.mediaSvc.download(m.downloadUrl);
  }

  async delete(m: MediaDoc, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    const ok = confirm(`Delete "${m.originalName || m.name}"?`);
    if (!ok) return;
    try {
      await this.mediaSvc.deleteMedia(m);
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check console for details.');
    }
  }

  formatBytes(bytes = 0): string {
    const units = ['B','KB','MB','GB','TB'];
    let n = bytes;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }
}
