import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { analysisGuard } from './analysis.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent) },
  { path: 'analysis', canActivate: [authGuard], loadComponent: () => import('./components/analysis/analysis.component').then(c => c.AnalysisComponent) },
  { path: 'google-config', canActivate: [authGuard], loadComponent: () => import('./components/google-config/google-config.component').then(c => c.GoogleConfigComponent) },
  { path: 'pagespeed', canActivate: [authGuard], loadComponent: () => import('./components/pagespeed/pagespeed.component').then(c => c.PageSpeedComponent) },
  { path: 'ai-model', canActivate: [authGuard], loadComponent: () => import('./components/ai-model/ai-model.component').then(c => c.AiModelComponent) },
  { path: 'ai-assistant', canActivate: [authGuard], loadComponent: () => import('./components/ai-assistant/ai-assistant.component').then(c => c.AiAssistantComponent) },
  { path: 'content-optimizer', canActivate: [authGuard], loadComponent: () => import('./components/content-optimizer/content-optimizer.component').then(c => c.ContentOptimizerComponent) },
  { path: 'analytics', canActivate: [authGuard, analysisGuard], loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: 'dashboard', canActivate: [authGuard, analysisGuard], loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) },
  { path: '**', redirectTo: 'login' }
];
