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
  private readonly requestTimeoutMs = this.getRequestTimeoutMs();

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
    this.showLoadingHint();

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

      this.persist({
        token: data.token || '',
        email,
        name: data.user?.username || email,
        isAdmin: Boolean(data.user?.is_admin),
        isSuperUser: Boolean(data.user?.is_superuser),
        userId: data.user?.id ?? 0
      });
      this.persistRememberChoice(email);
      this.showAlert('Connexion reussie. Redirection...', 'success');
      setTimeout(() => this.goDashboard(), 700);
    } catch {
      this.showAlert(this.getNetworkErrorMessage(), 'error');
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
    this.showLoadingHint();

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
      this.persist({
        token: data.token || '',
        email,
        name: data.user?.username || this.registerName.trim() || email,
        isAdmin: Boolean(data.user?.is_admin),
        isSuperUser: Boolean(data.user?.is_superuser),
        userId: data.user?.id ?? 0
      });
      this.persistRememberChoice(email);
      this.showAlert('Compte cree avec succes. Redirection vers le dashboard...', 'success');
      this.closeRegisterModal();
      setTimeout(() => this.goDashboard(), 700);
    } catch {
      this.showAlert(this.getNetworkErrorMessage(), 'error');
    } finally {
      this.isLoading = false;
    }
  }

  onForgotPassword(): void {
    this.showAlert('Ajoutez ensuite une API reset-password cote Django.', 'info');
  }

  private getRequestTimeoutMs(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 65000;
    }

    const { hostname } = window.location;
    return hostname === 'localhost' || hostname === '127.0.0.1' ? 5000 : 65000;
  }

  private showLoadingHint(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const { hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      this.showAlert('Le serveur gratuit peut prendre quelques secondes pour se reveiller...', 'info');
    }
  }

  private getNetworkErrorMessage(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'Le serveur est temporairement indisponible.';
    }

    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'Backend Django indisponible sur 127.0.0.1:8000';
    }

    return 'Le serveur met plus de temps que prevu a repondre. Reessayez dans quelques secondes.';
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

  private persist(payload: {
    token: string;
    email: string;
    name: string;
    isAdmin: boolean;
    isSuperUser: boolean;
    userId: number;
  }): void {
    const expiresAt = new Date(Date.now() + 86400000);
    localStorage.setItem('auth_token', JSON.stringify({
      token: payload.token,
      email: payload.email,
      username: payload.name,
      is_admin: payload.isAdmin,
      is_superuser: payload.isSuperUser,
      id: payload.userId,
      issued_at: new Date().toISOString()
    }));
    localStorage.setItem('auth_expires', expiresAt.toISOString());
    localStorage.setItem('user_email', payload.email);
    localStorage.setItem('user_name', payload.name);
    localStorage.setItem('user_is_admin', String(payload.isAdmin));
    localStorage.setItem('user_is_superuser', String(payload.isSuperUser));
    localStorage.setItem('user_id', String(payload.userId));
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
    void this.router.navigateByUrl('dashboard').then((ok) => {
      if (!ok) window.location.hash = '#/dashboard';
    });
  }
}
