import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { from } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isBackendCall = req.url.startsWith(environment.apiBaseUrl);
  if (!isBackendCall) return next(req);

  const auth = inject(Auth);

  return authState(auth).pipe(
    take(1),
    switchMap(user => {
      if (!user) return next(req);

      return from(user.getIdToken()).pipe(
        switchMap(token => next(req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        })))
      );
    })
  );
};
