import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  get passwordStrength(): { level: number; label: string; color: string } {
    const p = this.password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = [
      { level: 1, label: 'Faible', color: '#f78166' },
      { level: 2, label: 'Moyen', color: '#e3b341' },
      { level: 3, label: 'Fort', color: '#3fb950' },
      { level: 4, label: 'Très fort', color: '#2ea99b' },
    ];
    return map[Math.min(score, 4) - 1] ?? { level: 0, label: '', color: '' };
  }

  submit() {
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.error.set('Veuillez remplir tous les champs.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    setTimeout(() => {
      const result = this.auth.register(this.name, this.email, this.password);
      if (result.ok) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(result.error || 'Erreur lors de la création du compte.');
        this.loading.set(false);
      }
    }, 800);
  }
}
