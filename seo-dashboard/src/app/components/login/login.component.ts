import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getApiBaseUrl } from '../../api-base';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly api = getApiBaseUrl();
  private readonly requestTimeoutMs = 5000;

  email = '';
  emailError = '';
  password = '';
  passwordError = '';
  showPassword = false;
  remember = false;
  isLoading = false;
  alertMessage = '';
  alertType = '';
  showModal = false;
  registerName = '';
  registerEmail = '';
  registerCompany = '';
  registerPassword = '';
  registerConfirm = '';
  showRegisterPassword = false;
  showRegisterConfirm = false;
  acceptTerms = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
      this.email = rememberedEmail;
      this.remember = true;
    }
  }

  async onLogin(): Promise<void> {
    this.emailError = '';
    this.passwordError = '';
    if (!this.email || !this.password) {
      return this.showAlert('Veuillez remplir tous les champs', 'error');
    }

    this.isLoading = true;

    try {
      const email = this.email.trim().toLowerCase();
      const res = await this.fetchWithTimeout(`${this.api}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, email, password: this.password })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'Email not found') {
          this.emailError = 'Email introuvable';
        }
        if (data.message === 'Invalid credentials') {
          this.passwordError = 'Le mot de passe est incorrect';
        }
        return this.showAlert(this.toFrenchErrorMessage(data.message), 'error');
      }

      this.persist(email, data.user?.username || email, Boolean(data.user?.is_admin));
      this.persistRememberChoice(email);
      this.showAlert('Connexion reussie. Redirection...', 'success');
      setTimeout(() => this.goDashboard(), 700);
    } catch {
      this.showAlert('Backend Django indisponible sur 127.0.0.1:8000', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  openRegisterModal(): void {
    this.showModal = true;
  }

  closeRegisterModal(): void {
    this.showModal = false;
    this.registerName = '';
    this.registerEmail = '';
    this.registerCompany = '';
    this.registerPassword = '';
    this.registerConfirm = '';
    this.acceptTerms = false;
  }

  async onRegister(): Promise<void> {
    if (!this.registerName || !this.registerEmail || !this.registerPassword || !this.registerConfirm) {
      return this.showAlert('Veuillez remplir tous les champs obligatoires', 'error');
    }
    if (!this.acceptTerms) {
      return this.showAlert('Veuillez accepter les conditions d utilisation', 'error');
    }
    if (this.registerPassword !== this.registerConfirm) {
      return this.showAlert('Les mots de passe ne correspondent pas', 'error');
    }

    this.isLoading = true;

    try {
      const email = this.registerEmail.trim().toLowerCase();
      const res = await this.fetchWithTimeout(`${this.api}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, email, password: this.registerPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        return this.showAlert(data.message || 'Erreur pendant la creation du compte', 'error');
      }

      this.email = email;
      this.password = '';
      this.persist(email, this.registerName.trim(), false);
      this.persistRememberChoice(email);
      this.showAlert('Compte cree avec succes. Redirection vers le dashboard...', 'success');
      this.closeRegisterModal();
      setTimeout(() => this.goDashboard(), 700);
    } catch {
      this.showAlert('Backend Django indisponible sur 127.0.0.1:8000', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  onForgotPassword(): void {
    this.showAlert('Ajoutez ensuite une API reset-password cote Django.', 'info');
  }

  private toFrenchErrorMessage(message: string): string {
    if (message === 'Email not found') {
      return 'Email introuvable';
    }
    if (message === 'Invalid credentials') {
      return 'Le mot de passe est incorrect';
    }
    if (message === 'Missing credentials') {
      return 'Veuillez saisir votre email et votre mot de passe';
    }
    return message || 'Identifiants invalides';
  }

  private showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => (this.alertMessage = ''), 4000);
  }

  togglePasswordVisibility(field: 'login' | 'register' | 'confirm'): void {
    if (field === 'login') this.showPassword = !this.showPassword;
    if (field === 'register') this.showRegisterPassword = !this.showRegisterPassword;
    if (field === 'confirm') this.showRegisterConfirm = !this.showRegisterConfirm;
  }

  private persist(email: string, name: string, isAdmin: boolean): void {
    const expiresAt = new Date(Date.now() + 86400000);
    localStorage.setItem('auth_token', btoa(`${email}:${Date.now()}`));
    localStorage.setItem('auth_expires', expiresAt.toISOString());
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_is_admin', String(isAdmin));
  }

  private persistRememberChoice(email: string): void {
    if (this.remember) {
      localStorage.setItem('remember_email', email);
    } else {
      localStorage.removeItem('remember_email');
    }
  }

  private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  }

  private goDashboard(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void this.router.navigateByUrl('/dashboard').then((ok) => {
      if (!ok) window.location.href = '/dashboard';
    });
  }
}
