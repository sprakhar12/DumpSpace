import { EnvironmentInjector, NgZone, inject, runInInjectionContext } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type PreviewType = 'image' | 'video' | 'none';

type PickedFile = File & {
  previewUrl?: string;
  previewType?: PreviewType;
};

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrl: '../../../styles/upload.css',
})

export class Upload {
  files: PickedFile[] = [];
  isDragOver = false;

  uploading = false;
  progress = 0;
  error = '';

  // Limits (tweak later)
  private readonly maxFileSizeBytes = 150 * 1024 * 1024; // 150MB
  private readonly allowedMimePrefixes = ['image/', 'video/'];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const dropped = event.dataTransfer?.files;
    if (!dropped?.length) return;

    this.addFiles(Array.from(dropped));
  }

  onFilePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    const picked = input.files ? Array.from(input.files) : [];
    this.addFiles(picked);

    this.zone.run(() => {
      this.addFiles(picked);
    });
    // allow re-picking same file
    input.value = '';
  }

  addFiles(incoming: File[]) {
    this.error = '';

    const valid: File[] = [];
    const rejected: string[] = [];

    const allowedPrefixes = ['image/', 'video/']; // simplest, matches your accept="image/*,video/*"
    const allowedExact = new Set([
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence',
    ]);

    for (const file of incoming) {
      const mime = (file.type || '').toLowerCase();
      const name = file.name || 'unnamed';
      const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';

      const okMime =
        (!!mime && (allowedPrefixes.some(p => mime.startsWith(p)) || allowedExact.has(mime)));

      // Some mobile browsers provide empty file.type; fall back to extension
      const okExt =
        !mime && ['jpg','jpeg','png','webp','gif','heic','heif','mp4','mov','webm','m4v','3gp'].includes(ext);

      if (!(okMime || okExt)) {
        rejected.push(name);
        continue;
      }

      if (file.size > this.maxFileSizeBytes) {
        rejected.push(`${name} (too large)`);
        continue;
      }

      valid.push(file);
    }

    // Dedupe by name+size
    const existingKeys = new Set(this.files.map(f => `${f.name}|${f.size}`));
    const deduped = valid.filter(f => !existingKeys.has(`${f.name}|${f.size}`));

    const picked = deduped.map(f => this.attachPreview(f));
    this.files = [...this.files, ...picked];

    if (rejected.length) {
      this.error = `Some files were skipped: ${rejected.slice(0, 3).join(', ')}${rejected.length > 3 ? '…' : ''}`;
    }

    if (!valid.length && incoming.length) {
      this.error = 'No files accepted. (Type may be empty or unsupported on this device.)';
    }
  }

  attachPreview(file: File): PickedFile {
    const picked = file as PickedFile;
    const url = URL.createObjectURL(file);
    picked.previewUrl = url;

    if (file.type.startsWith('image/')) picked.previewType = 'image';
    else if (file.type.startsWith('video/')) picked.previewType = 'video';
    else picked.previewType = 'none';

    return picked;
  }

  remove(index: number) {
    const f = this.files[index];
    if (f?.previewUrl) URL.revokeObjectURL(f.previewUrl);
    this.files.splice(index, 1);
    this.files = [...this.files];
  }

  clear() {
    for (const f of this.files) if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    this.files = [];
    this.progress = 0;
    this.error = '';
    this.uploading = false;
  }

  private auth = inject(Auth);
  private fs = inject(Firestore);
  private storage = inject(Storage);
  private envInjector = inject(EnvironmentInjector);
  private zone = inject(NgZone);

  private uid(): string {
    const u = this.auth.currentUser;
    if (!u) throw new Error('Not authenticated');
    return u.uid;
  }

  private newId(): string {
    const c: any = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();

    // fallback UUID v4-ish
    const bytes = new Uint8Array(16);
    (c?.getRandomValues ? c.getRandomValues(bytes) : bytes.fill(Math.random() * 256));

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  // Placeholder: next step we wire Firebase Storage + Firestore
  async upload() {
    this.zone.run(() => {
      this.uploading = true;
      this.progress = 0;
      this.error = '';
    });
    this.error = '';
    if (!this.files.length) return;
    this.uploading = true;
    this.progress = 0;
    
    const uid = this.uid();

    try {
      const totalBytes = this.files.reduce((s, f) => s + f.size, 0);
      let uploadedBytesSoFar = 0;

      for (const file of this.files) {
        const id = this.newId();
        const safeName = file.name.replace(/[^\w.\- ]/g, '_');
        const storagePath = `users/${uid}/media/${id}/${safeName}`;
        const storageRef = ref(this.storage, storagePath);

        // Create Firestore doc first (UPLOADING)
        await setDoc(doc(this.fs, `users/${uid}/media/${id}`), {
          ownerId: uid,
          name: safeName,
          originalName: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          storagePath,
          downloadUrl: '',
          tags: [],
          status: 'UPLOADING',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Upload with resumable task + per-file progress
        const task = runInInjectionContext(this.envInjector, () =>
          uploadBytesResumable(storageRef, file, { 
            contentType: file.type || 'application/octet-stream',
            contentDisposition: `attachment; filename="${safeName}"`, 
          })
        );

        await new Promise<void>((resolve, reject) => {
          let lastTransferred = 0;

          task.on(
            'state_changed',
            (snap) => {
              const delta = snap.bytesTransferred - lastTransferred;
              lastTransferred = snap.bytesTransferred;
              uploadedBytesSoFar += delta;
              this.progress = totalBytes ? Math.min(100, Math.round((uploadedBytesSoFar / totalBytes) * 100)) : 0;
              this.zone.run(() => {
              this.progress = totalBytes
                ? Math.min(100, Math.round((uploadedBytesSoFar / totalBytes) * 100))
                : 0;
              });
            },
            (err) => reject(err),
            () => resolve()
          );
        });

        const downloadUrl = await runInInjectionContext(this.envInjector, () =>
          getDownloadURL(storageRef)
        );

        // Mark READY in Firestore
        await setDoc(
          doc(this.fs, `users/${uid}/media/${id}`),
          {
            downloadUrl,
            status: 'READY',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )};

      this.zone.run(() => {
        this.clear();
      });
      this.clear();
      return;
    } catch (e: any) {
      this.zone.run(() => {
        this.error = e?.message ?? 'Upload failed';
      });
    } finally {
      this.zone.run(() => {
      this.uploading = false;
      this.progress = 0;
    });
    }
  }

  formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const v = bytes / Math.pow(k, i);
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  ngOnDestroy() {
    for (const f of this.files) if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
  }
}
