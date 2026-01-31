import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  limit,
  doc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Observable, of } from 'rxjs';
import { map, switchMap, shareReplay } from 'rxjs/operators';

export type MediaDoc = {
  id?: string;
  ownerId: string;
  name: string;
  originalName?: string;
  contentType: string;
  downloadUrl: string;
  size: number;
  storagePath: string;
  status?: 'UPLOADING' | 'READY' | 'FAILED' | string;
  createdAt?: any;
  updatedAt?: any;
  tags?: string[];
};

export type MediaStats = {
  totalFiles: number;
  totalImages: number;
  totalVideos: number;
  totalBytes: number;
  lastUploadAt?: any;
};

@Injectable({ providedIn: 'root' })
export class MediaService {
  private auth = inject(Auth);
  private fs = inject(Firestore);
  private storage = inject(Storage);

  readonly uid$: Observable<string | null> = authState(this.auth).pipe(
    map(u => u?.uid ?? null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  recent$(take = 8): Observable<MediaDoc[]> {
    return this.uid$.pipe(
      switchMap(uid => {
        if (!uid) return of([]);
        const colRef = collection(this.fs, `users/${uid}/media`);
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(take));
        return collectionData(q, { idField: 'id' }) as Observable<MediaDoc[]>;
      })
    );
  }

  all$(): Observable<MediaDoc[]> {
    return this.uid$.pipe(
      switchMap(uid => {
        if (!uid) return of([]);
        const colRef = collection(this.fs, `users/${uid}/media`);
        const q = query(colRef, orderBy('createdAt', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<MediaDoc[]>;
      })
    );
  }

  stats$(): Observable<MediaStats> {
    return this.all$().pipe(
      map(items => {
        let totalBytes = 0, totalImages = 0, totalVideos = 0;
        for (const m of items) {
          totalBytes += (m.size || 0);
          if ((m.contentType || '').startsWith('image/')) totalImages++;
          else if ((m.contentType || '').startsWith('video/')) totalVideos++;
        }
        return {
          totalFiles: items.length,
          totalImages,
          totalVideos,
          totalBytes,
          lastUploadAt: items[0]?.createdAt,
        };
      })
    );
  }

  download(url: string) {
    if (!url) return;
    window.location.assign(url);
  }

  async deleteMedia(media: MediaDoc): Promise<void> {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !media?.id) return;

    // Storage
    if (media.storagePath) {
      await deleteObject(ref(this.storage, media.storagePath));
    }
    // Firestore
    await deleteDoc(doc(this.fs, `users/${uid}/media/${media.id}`));
  }
}