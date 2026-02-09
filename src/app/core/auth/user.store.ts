import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Identity = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
};

@Injectable({ providedIn: 'root' })
export class UserStore {
  private identitySubject = new BehaviorSubject<Identity | null>(null);
  $identity = this.identitySubject.asObservable();

  setIdentity(identity: Identity) { this.identitySubject.next(identity); }
  clear() { this.identitySubject.next(null); }
}