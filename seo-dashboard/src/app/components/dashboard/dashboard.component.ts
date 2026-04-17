import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h2>📊 Dashboard</h2>
      <p>Welcome to the SEO Dashboard</p>
      <div class="dashboard-grid">
        <div class="card">
          <h3>Traffic Overview</h3>
          <p class="stat">Loading analytics data...</p>
        </div>
        <div class="card">
          <h3>Top Pages</h3>
          <p class="stat">Loading top pages...</p>
        </div>
        <div class="card">
          <h3>Search Queries</h3>
          <p class="stat">Loading search data...</p>
        </div>
        <div class="card">
          <h3>Performance</h3>
          <p class="stat">Loading performance metrics...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
    }

    h2 {
      color: #667eea;
      margin-bottom: 20px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .stat {
      font-size: 14px;
      color: #999;
    }
  `]
})
export class DashboardComponent { }
