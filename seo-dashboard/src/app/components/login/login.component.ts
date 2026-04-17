import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <h1>🔐 SEO Dashboard</h1>
        <form (ngSubmit)="login()">
          <div class="form-group">
            <label for="username">Username:</label>
            <input
              type="text"
              id="username"
              [(ngModel)]="username"
              name="username"
              placeholder="Enter your username"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password:</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" [disabled]="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>

        <p class="demo-note">
          For testing: Use demo credentials or contact your administrator
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-box {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }

    h1 {
      text-align: center;
      color: #667eea;
      margin-bottom: 30px;
      font-size: 28px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;
      margin-top: 10px;
    }

    button:hover:not(:disabled) {
      background: #5568d3;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .error-message {
      color: #d32f2f;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 14px;
    }

    .demo-note {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 20px;
    }
  `]
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simulate login - in production, call API
    setTimeout(() => {
      localStorage.setItem('access_token', 'demo-token-' + Date.now());
      localStorage.setItem('username', this.username);
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}
