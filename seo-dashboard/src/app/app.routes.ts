import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AiAssistantComponent } from './components/ai-assistant/ai-assistant.component';
import { ContentOptimizerComponent } from './components/content-optimizer/content-optimizer.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'ai-assistant', component: AiAssistantComponent },
  { path: 'content-optimizer', component: ContentOptimizerComponent },
  { path: '**', redirectTo: 'dashboard' }
];
