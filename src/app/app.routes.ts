import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Signup } from './features/auth/signup/signup';
import { authGuard } from './core/auth/auth.guard';
import { Upload } from './features/upload/upload';
import { DashboardLayout } from './features/dashboard/layout/layout';
import { DashboardHome } from './features/dashboard/home/home';
import { LibraryImages } from './features/images/images';
import { LibraryVideos } from './features/videos/videos';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    {
        path: 'home',
        component: DashboardLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: DashboardHome },
            { path: 'upload', component: Upload },
            { path: 'images', component: LibraryImages },
            { path: 'videos', component: LibraryVideos },
        ]
    },
    { path: '**', redirectTo: 'home' }
];
