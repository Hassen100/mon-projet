import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, HttpClientModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="header-content">
          <h1>📊 SEO Dashboard</h1>
          <nav>
            <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            <a routerLink="/ai-assistant" routerLinkActive="active">🤖 AI Assistant</a>
            <a routerLink="/content-optimizer" routerLinkActive="active">✨ Content</a>
          </nav>
        </div>
      </header>

      <main class="app-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <p>&copy; 2026 SEO Dashboard. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    nav {
      display: flex;
      gap: 30px;
    }

    nav a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background 0.3s;
    }

    nav a:hover,
    nav a.active {
      background: rgba(255,255,255,0.2);
    }

    .app-content {
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      padding: 20px;
    }

    .app-footer {
      background: #f5f5f5;
      border-top: 1px solid #ddd;
      padding: 20px;
      text-align: center;
      color: #666;
      margin-top: auto;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 15px;
      }

      nav {
        gap: 15px;
      }

      h1 {
        font-size: 20px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Check if user is authenticated, if not redirect to login
    const token = localStorage.getItem('access_token');
    if (!token && !this.isLoginPage()) {
      this.router.navigate(['/login']);
    }
  }

  private isLoginPage(): boolean {
    return this.router.url.includes('/login') || this.router.url.includes('/register');
  }
}
