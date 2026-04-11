import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurlService, CurlCommand } from '../../services/curl.service';

@Component({
  selector: 'app-curl-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="curl-modal-overlay" *ngIf="isOpen" (click)="closeOnOverlay($event)">
      <div class="curl-modal">
        <div class="curl-modal-header">
          <h3>
            <span class="icon">🔧</span>
            Commande cURL
          </h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        
        <div class="curl-modal-body">
          <div class="command-info">
            <div class="info-item">
              <strong>Endpoint:</strong> {{ curlCommand?.url }}
            </div>
            <div class="info-item">
              <strong>Méthode:</strong> {{ curlCommand?.method }}
            </div>
            <div class="info-item" *ngIf="curlCommand?.params">
              <strong>Paramètres:</strong>
              <span *ngFor="let param of getParamsList(curlCommand?.params || {})">
                {{ param.key }}={{ param.value }}
              </span>
            </div>
          </div>
          
          <div class="command-container">
            <div class="command-header">
              <strong>Commande cURL:</strong>
              <div class="actions">
                <button 
                  class="copy-btn" 
                  (click)="copyCommand()" 
                  [disabled]="copying"
                  title="Copier dans le presse-papier"
                >
                  <span *ngIf="!copying">📋 Copier</span>
                  <span *ngIf="copying">📋 Copié!</span>
                </button>
                <button 
                  class="test-btn" 
                  (click)="testCommand()" 
                  [disabled]="testing"
                  title="Tester la commande"
                >
                  <span *ngIf="!testing">🧪 Tester</span>
                  <span *ngIf="testing">🧪 Test...</span>
                </button>
              </div>
            </div>
            
            <pre class="command-output"><code>{{ curlCommand?.command }}</code></pre>
          </div>
          
          <div class="test-result" *ngIf="testResult">
            <strong>Résultat du test:</strong>
            <pre [class]="{'error': testError}">{{ testResult | json }}</pre>
          </div>
        </div>
        
        <div class="curl-modal-footer">
          <button class="btn-secondary" (click)="closeModal()">Fermer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .curl-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .curl-modal {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .curl-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #333;
      background: #252525;
      border-radius: 12px 12px 0 0;
    }

    .curl-modal-header h3 {
      margin: 0;
      color: #fff;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon {
      font-size: 20px;
    }

    .close-btn {
      background: none;
      border: none;
      color: #999;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #ff4444;
      color: white;
    }

    .curl-modal-body {
      padding: 24px;
    }

    .command-info {
      margin-bottom: 20px;
      padding: 16px;
      background: #252525;
      border-radius: 8px;
      border: 1px solid #333;
    }

    .info-item {
      margin-bottom: 8px;
      color: #ccc;
      font-size: 14px;
    }

    .info-item strong {
      color: #4CAF50;
      margin-right: 8px;
    }

    .command-container {
      margin-bottom: 20px;
    }

    .command-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .command-header strong {
      color: #fff;
      font-size: 16px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .copy-btn, .test-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .copy-btn {
      background: #4CAF50;
      color: white;
    }

    .copy-btn:hover:not(:disabled) {
      background: #45a049;
      transform: translateY(-1px);
    }

    .test-btn {
      background: #2196F3;
      color: white;
    }

    .test-btn:hover:not(:disabled) {
      background: #1976D2;
      transform: translateY(-1px);
    }

    .edit-btn {
      background: #FF9800;
      color: white;
    }

    .edit-btn:hover {
      background: #F57C00;
      transform: translateY(-1px);
    }

    .copy-btn:disabled, .test-btn:disabled, .edit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .command-output {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 16px;
      color: #58a6ff;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      margin: 0;
      resize: vertical;
      min-height: 120px;
      width: 100%;
    }

    .command-output.readonly {
      resize: none;
      cursor: default;
    }

    .command-output.editable {
      cursor: text;
      background: #0a0e1a;
      border-color: #58a6ff;
    }

    .command-output.editable:focus {
      outline: none;
      border-color: #79c0ff;
      box-shadow: 0 0 0 2px rgba(121, 192, 255, 0.2);
    }

    .test-result {
      margin-top: 16px;
      padding: 16px;
      background: #252525;
      border-radius: 8px;
      border: 1px solid #333;
    }

    .test-result strong {
      color: #fff;
      display: block;
      margin-bottom: 8px;
    }

    .test-result pre {
      margin: 0;
      padding: 12px;
      background: #0d1117;
      border-radius: 6px;
      font-size: 13px;
      overflow-x: auto;
    }

    .test-result pre.error {
      border: 1px solid #ff4444;
      color: #ff6b6b;
    }

    .curl-modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #333;
      background: #252525;
      border-radius: 0 0 12px 12px;
      text-align: right;
    }

    .btn-secondary {
      background: #666;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #555;
    }

    @media (max-width: 768px) {
      .curl-modal {
        width: 95%;
        max-height: 90vh;
      }
      
      .command-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }
      
      .actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class CurlModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() period = 30;
  @Input() token = '';
  @Output() close = new EventEmitter<void>();

  curlCommand: CurlCommand | null = null;
  copying = false;
  testing = false;
  testResult: any = null;
  testError = false;
  editMode = false;
  editableCommand = '';

  constructor(private curlService: CurlService) {}

  ngOnInit() {
    if (this.isOpen && this.token) {
      this.generateCommand();
    }
  }

  ngOnChanges() {
    if (this.isOpen && this.token) {
      this.generateCommand();
    }
  }

  generateCommand() {
    this.curlCommand = this.curlService.generateAnalyticsCurl(this.period, this.token);
    this.editableCommand = this.curlCommand?.command || '';
    this.testResult = null;
    this.testError = false;
  }

  async copyCommand() {
    const commandToCopy = this.editMode ? this.editableCommand : this.curlCommand?.command;
    if (!commandToCopy) return;

    this.copying = true;
    const success = await this.curlService.copyToClipboard(commandToCopy);
    
    if (success) {
      setTimeout(() => {
        this.copying = false;
      }, 2000);
    } else {
      this.copying = false;
      alert('Erreur lors de la copie. Veuillez copier manuellement.');
    }
  }

  testCommand() {
    if (!this.curlCommand) return;

    this.testing = true;
    this.testResult = null;
    this.testError = false;

    this.curlService.testAnalyticsEndpoint(this.period, this.token).subscribe({
      next: (response) => {
        this.testResult = response;
        this.testError = false;
        this.testing = false;
      },
      error: (error) => {
        this.testResult = error;
        this.testError = true;
        this.testing = false;
      }
    });
  }

  getParamsList(params?: { [key: string]: string }) {
    if (!params) return [];
    return Object.entries(params).map(([key, value]) => ({ key, value }));
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.editableCommand = this.curlCommand?.command || '';
    }
  }

  closeOnOverlay(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
    this.close.emit();
  }
}
