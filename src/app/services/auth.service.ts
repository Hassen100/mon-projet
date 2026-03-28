import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface User {
  name: string;
  email: string;
  avatar: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** État réactif (RxJS) — même instance utilisateur que `currentUser` */
  readonly user$ = new BehaviorSubject<User | null>(null);

  currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    void this.hydrateFromSession();

    supabase.auth.onAuthStateChange((_event, session) => {
      const mapped = this.mapSupabaseUser(session?.user ?? null);
      this.currentUser.set(mapped);
      this.user$.next(mapped);
    });
  }

  private mapSupabaseUser(u: SupabaseUser | null): User | null {
    if (!u?.email) return null;
    const meta = u.user_metadata as Record<string, string | undefined> | undefined;
    const name =
      meta?.['name'] ||
      meta?.['full_name'] ||
      u.email.split('@')[0] ||
      'Utilisateur';
    return {
      name,
      email: u.email,
      avatar: name.charAt(0).toUpperCase()
    };
  }

  private async hydrateFromSession(): Promise<void> {
    const { data } = await supabase.auth.getSession();
    const mapped = this.mapSupabaseUser(data.session?.user ?? null);
    this.currentUser.set(mapped);
    this.user$.next(mapped);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  /** Pour le guard : vérifie la session auprès de Supabase (fiable après refresh). */
  async isSessionValid(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session?.user;
  }

  async signUp(
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name }
      }
    });
    if (error) {
      return { ok: false, error: this.translateAuthError(error.message) };
    }
    if (data.user && !data.session) {
      return {
        ok: false,
        error:
          'Compte créé. Confirmez votre e-mail (lien envoyé par Supabase) avant de vous connecter.'
      };
    }
    if (data.session?.user) {
      const mapped = this.mapSupabaseUser(data.session.user);
      this.currentUser.set(mapped);
      this.user$.next(mapped);
    }
    return { ok: true };
  }

  async login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, error: this.translateAuthError(error.message) };
    }
    if (data.session?.user) {
      const mapped = this.mapSupabaseUser(data.session.user);
      this.currentUser.set(mapped);
      this.user$.next(mapped);
    }
    return { ok: true };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser.set(null);
    this.user$.next(null);
    void this.router.navigate(['/login']);
  }

  async getUser() {
    return supabase.auth.getUser();
  }

  async getSession() {
    return supabase.auth.getSession();
  }

  private translateAuthError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
    if (m.includes('email not confirmed')) return 'Confirmez votre adresse e-mail avant de vous connecter.';
    if (m.includes('user already registered')) return 'Cet e-mail est déjà utilisé.';
    return msg;
  }
}
