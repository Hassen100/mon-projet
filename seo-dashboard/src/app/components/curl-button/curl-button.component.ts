import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurlService, CurlCommand } from '../../services/curl.service';

@Component({
  selector: 'app-curl-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="curl-btn" 
      (click)="openCurlModal()" 
      title="Générer une commande cURL"
    >
      <span class="btn-icon">🔧</span>
      <span class="btn-text">cURL</span>
    </button>
  `,
  styles: [`
    .curl-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      position: relative;
      overflow: hidden;
    }

    .curl-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    .curl-btn:hover::before {
      left: 100%;
    }

    .curl-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }

    .curl-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
    }

    .btn-icon {
      font-size: 16px;
      line-height: 1;
    }

    .btn-text {
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
      .curl-btn {
        padding: 6px 12px;
        font-size: 13px;
      }
      
      .btn-text {
        display: none;
      }
      
      .btn-icon {
        font-size: 18px;
      }
    }
  `]
})
export class CurlButtonComponent {
  @Input() period = 30;
  @Input() token = '';
  @Output() curlModalOpen = new EventEmitter<{ period: number; token: string }>();

  constructor(private curlService: CurlService) {}

  openCurlModal() {
    this.curlModalOpen.emit({
      period: this.period,
      token: this.token
    });
  }
}
