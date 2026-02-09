import { Component, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Firestore, collection, collectionData, orderBy, query, doc, deleteDoc } from '@angular/fire/firestore';
import { Observable, map, switchMap, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type MediaDoc = {
  id?: string;
  name: string;
  originalName?: string;
  ownerId: string;
  contentType: string;
  downloadUrl: string;
  size: number;
  storagePath: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  tags?: string[];
};

@Component({
  selector: 'app-images',
  imports: [CommonModule, MatIconModule],
  templateUrl: './images.html',
  styleUrl: './images.css',
})

export class LibraryImages {
  private fs = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);

  uid: string | null = null;
  
  previewUrl: string | null = null;
  previewName: string = '';

  images$: Observable<MediaDoc[]> = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) return of([]);
      const ref = collection(this.fs, `users/${user.uid}/media`);
      const q = query(ref, orderBy('createdAt', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<MediaDoc[]>;
    }),
    map(items =>
      items.filter(x => (x.contentType || '').startsWith('image/'))
    )
  );

  download(media: any, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();
    if (!media?.downloadUrl) return;
    window.location.assign(media.downloadUrl);
  }

  async delete(media: any, ev?: Event) {
    ev?.stopPropagation();
    ev?.preventDefault();

    const uid = this.auth.currentUser?.uid;
    if (!uid || !media?.id) {
      return
    }

    const ok = confirm(`Delete "${media.originalName || media.name}"?`);
    if (!ok) return;

    try {
      if (media.storagePath) {
        await deleteObject(ref(this.storage, media.storagePath));
      }
      await deleteDoc(doc(this.fs, `users/${uid}/media/${media.id}`));
    } catch (e: any) {
      alert(`Delete failed`);
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
