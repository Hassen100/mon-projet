import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent) },
  { path: 'google-config', loadComponent: () => import('./components/google-config/google-config.component').then(c => c.GoogleConfigComponent) },
  { path: 'pagespeed', loadComponent: () => import('./components/pagespeed/pagespeed.component').then(c => c.PageSpeedComponent) },
  { path: 'ai-model', loadComponent: () => import('./components/ai-model/ai-model.component').then(c => c.AiModelComponent) },
  { path: 'content-optimizer', loadComponent: () => import('./components/content-optimizer/content-optimizer.component').then(c => c.ContentOptimizerComponent) },
  { path: 'analytics', loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: '**', redirectTo: 'login' }
];
