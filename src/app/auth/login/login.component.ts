import { Component, OnInit, signal } from '@angular/core';
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
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    if (await this.auth.isSessionValid()) {
      await this.router.navigate(['/dashboard']);
    }
  }

  async submit() {
    if (!this.email || !this.password) {
      this.error.set('Veuillez remplir tous les champs.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const result = await this.auth.login(this.email, this.password);
    this.loading.set(false);

    if (result.ok) {
      await this.router.navigate(['/dashboard']);
    } else {
      this.error.set(result.error || 'Erreur de connexion.');
    }
  }
}
