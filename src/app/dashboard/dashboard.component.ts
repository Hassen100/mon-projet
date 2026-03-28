import { Component, OnInit, OnDestroy, signal, inject, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Inject services
  private router = inject(Router);
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);

  // Signals
  loading = signal(false);
  user = signal<any>(null);
  kpis = signal<{ sessions: number; users: number; pageviews: number; bounceRate: string }>({
    sessions: 0,
    users: 0,
    pageviews: 0,
    bounceRate: '0%'
  });
  lastSync = signal('Jamais');

  // Auto-refresh timer
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL = 60000; // 60 seconds

  constructor() {
    // Get current user from auth service
    this.authService.user$.subscribe(user => {
      this.user.set(user);
    });
  }

  ngOnInit() {
    // Start auto-refresh
    this.startAutoRefresh();
    
    // Load initial data
    this.updateKPIs();
  }

  ngOnDestroy() {
    // Clear auto-refresh timer
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewInit() {
    // Load data after view is ready
    this.updateKPIs();
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      this.updateKPIs();
    }, this.REFRESH_INTERVAL);
  }

  updateKPIs() {
    // Load real data from Google Analytics API
    this.analyticsService.getOverview().subscribe({
      next: (data: any) => {
        console.log('✅ Real GA data received:', data);
        this.kpis.set({ 
          sessions: data.sessions, 
          users: data.users, 
          pageviews: data.pageViews, 
          bounceRate: (data.bounceRate * 100).toFixed(1) + '%'
        });
      },
      error: (error) => {
        console.error('❌ Error fetching overview data:', error);
        // Show error instead of fake data
        console.log('🔍 Backend connection failed - check if backend is running');
      }
    });
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
