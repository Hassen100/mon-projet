import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent) },
  { path: 'google-config', loadComponent: () => import('./components/google-config/google-config.component').then(c => c.GoogleConfigComponent) },
  { path: 'analytics', loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: '**', redirectTo: 'login' }
];
