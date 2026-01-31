import { Injectable, inject } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private auth: Auth = inject(Auth);
    public user$: Observable<User | null> = authState(this.auth);

    signup(email: string, password: string) {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    login(email: string, password: string) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    logout() {
        return signOut(this.auth);
    }

    mapAuthError(error: any): string {
        const code = error?.code;
        switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/weak-password':
            return 'Password should be at least 8 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/password-mismatch':
            return 'Passwords do not match.';
        default:
            return 'Something went wrong. Please try again.';
        }
    }
}