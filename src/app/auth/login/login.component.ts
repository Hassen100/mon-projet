import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  submit() {
    if (!this.email || !this.password) {
      this.error.set('Veuillez remplir tous les champs.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    setTimeout(() => {
      const result = this.auth.login(this.email, this.password);
      if (result.ok) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(result.error || 'Erreur de connexion.');
        this.loading.set(false);
      }
    }, 800);
  }
}
