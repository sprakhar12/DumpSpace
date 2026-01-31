import { Component, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collection, collectionData, orderBy, query, doc, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Observable, map, switchMap, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

type MediaDoc = {
  id?: string;
  ownerId: string;
  name: string;
  originalName?: string;
  contentType: string;
  downloadUrl: string;
  size: number;
  storagePath: string;
  createdAt?: any;
};

@Component({
  selector: 'app-videos',
  imports: [CommonModule, MatIconModule],
  templateUrl: './videos.html',
  styleUrl: './videos.css',
})

export class LibraryVideos {
  private auth = inject(Auth);
  private fs = inject(Firestore);
  private storage = inject(Storage);

  uid: string | null = null;

  previewUrl: string | null = null;
  previewName: string = '';

  videos$: Observable<MediaDoc[]> = authState(this.auth).pipe(
    switchMap(user => {
      this.uid = user?.uid ?? null;
      if (!user) return of([]);
      const refCol = collection(this.fs, `users/${user.uid}/media`);
      const q = query(refCol, orderBy('createdAt', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<MediaDoc[]>;
    }),
    map(items => items.filter(x => (x.contentType || '').startsWith('video/')))
  );

  download(media: MediaDoc, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    if (!media?.downloadUrl) return;
    window.location.assign(media.downloadUrl);
  }

  async delete(media: MediaDoc, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    if (!this.uid || !media?.id) return;

    const ok = confirm(`Delete "${media.originalName || media.name}"?`);
    if (!ok) return;

    try {
      if (media.storagePath) await deleteObject(ref(this.storage, media.storagePath));
      await deleteDoc(doc(this.fs, `users/${this.uid}/media/${media.id}`));
    } catch (e) {
      alert('Delete failed');
    }
  }

  openPreview(media: MediaDoc, ev?: Event) {
    ev?.stopPropagation();
    this.previewUrl = media.downloadUrl;
    this.previewName = media.originalName || media.name;
  }
  
  closePreview() {
    this.previewUrl = null;
    this.previewName = '';
  }
}
