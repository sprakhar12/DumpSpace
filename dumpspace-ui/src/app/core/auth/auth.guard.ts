import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => user ? true : router.parseUrl('/login'))
  );
};
