import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  name: string;
  email: string;
  avatar: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USERS_KEY = 'seo_ia_users';
  private readonly SESSION_KEY = 'seo_ia_session';

  currentUser = signal<User | null>(this.loadSession());

  constructor(private router: Router) {}

  private loadSession(): User | null {
    try {
      const s = sessionStorage.getItem(this.SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }

  private getUsers(): Record<string, { password: string; name: string; email: string }> {
    try {
      const u = localStorage.getItem(this.USERS_KEY);
      return u ? JSON.parse(u) : {};
    } catch { return {}; }
  }

  private saveUsers(users: Record<string, any>): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  register(name: string, email: string, password: string): { ok: boolean; error?: string } {
    const users = this.getUsers();
    if (users[email]) return { ok: false, error: 'Cet email est déjà utilisé.' };

    users[email] = { password, name, email };
    this.saveUsers(users);

    const user: User = { name, email, avatar: name.charAt(0).toUpperCase() };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    return { ok: true };
  }

  login(email: string, password: string): { ok: boolean; error?: string } {
    const users = this.getUsers();
    const found = users[email];
    if (!found) return { ok: false, error: 'Email introuvable.' };
    if (found.password !== password) return { ok: false, error: 'Mot de passe incorrect.' };

    const user: User = { name: found.name, email, avatar: found.name.charAt(0).toUpperCase() };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    return { ok: true };
  }

  logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
