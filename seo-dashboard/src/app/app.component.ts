import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ]
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Check if user is authenticated, if not redirect to login
    const token = localStorage.getItem('auth_token');
    if (!token && !this.isLoginPage()) {
      this.router.navigate(['/login']);
    }
  }

  private isLoginPage(): boolean {
    return this.router.url.includes('/login') || this.router.url.includes('/register');
  }
}
