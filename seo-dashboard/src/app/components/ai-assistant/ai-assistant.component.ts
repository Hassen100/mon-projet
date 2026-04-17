import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiChatService, ChatMessage, AiResponse, AiServiceStatus } from '../../services/ai-chat.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-assistant-container">
      <header class="ai-header">
        <h2>AI SEO Assistant</h2>
        <p class="subtitle">Mode local Ollama avec fallback Gemini</p>
      </header>

      <div class="ai-service-selector" *ngIf="servicesStatus">
        <span class="service-pill" [class.up]="servicesStatus.ollama.available">Ollama {{ servicesStatus.ollama.available ? 'online' : 'offline' }}</span>
        <span class="service-pill" [class.up]="servicesStatus.gemini.available">Gemini {{ servicesStatus.gemini.available ? 'online' : 'offline' }}</span>
        <div class="mode-buttons">
          <button type="button" [class.active]="aiMode === 'auto'" (click)="setMode('auto')">Auto</button>
          <button type="button" [class.active]="aiMode === 'ollama'" [disabled]="!servicesStatus.ollama.available" (click)="setMode('ollama')">Local</button>
          <button type="button" [class.active]="aiMode === 'gemini'" [disabled]="!servicesStatus.gemini.available" (click)="setMode('gemini')">Cloud</button>
        </div>
      </div>

      <div class="ai-content">
        <div class="chat-messages" #messagesContainer>
          <div class="welcome-message" *ngIf="messages.length === 0">
            <h3>Bienvenue</h3>
            <p>Posez vos questions SEO sur trafic, rebond, pages, mots-cles.</p>
          </div>

          <div class="message" [ngClass]="msg.role" *ngFor="let msg of messages">
            <div class="message-avatar">{{ msg.role === 'user' ? 'U' : 'AI' }}</div>
            <div class="message-content">
              <p [innerHTML]="formatMessage(msg.content)"></p>
              <div class="message-meta" *ngIf="msg.metadata">
                <small>{{ msg.metadata['provider'] || 'ai' }} {{ msg.metadata['model'] || '' }} • {{ msg.timestamp }}</small>
              </div>
            </div>
          </div>

          <div class="loading-indicator" *ngIf="isLoading">Analyse en cours...</div>
        </div>

        <div class="context-panel" *ngIf="contextData">
          <h4>Contexte</h4>
          <div class="stat" *ngIf="contextData.sessions"><label>Sessions</label><span>{{ contextData.sessions | number }}</span></div>
          <div class="stat" *ngIf="contextData.users"><label>Users</label><span>{{ contextData.users | number }}</span></div>
          <div class="stat" *ngIf="contextData.page_views"><label>Pages vues</label><span>{{ contextData.page_views | number }}</span></div>
          <div class="stat" *ngIf="contextData.clicks"><label>Clicks</label><span>{{ contextData.clicks | number }}</span></div>
        </div>
      </div>

      <div class="ai-input-section">
        <form (ngSubmit)="sendMessage()" class="message-form">
          <div class="input-wrapper">
            <textarea
              [(ngModel)]="userMessage"
              name="message"
              placeholder="Posez votre question SEO..."
              (keydown.enter)="$event.shiftKey || sendMessage()"
              [disabled]="isLoading"
              class="message-input"
              rows="2"
            ></textarea>
            <button type="submit" [disabled]="!userMessage.trim() || isLoading" class="send-button">{{ isLoading ? '...' : 'Envoyer' }}</button>
          </div>
        </form>

        <div class="quick-actions">
          <button type="button" (click)="askQuickQuestion('Detecte-t-il des anomalies de trafic ?')" class="quick-btn">Anomalies</button>
          <button type="button" (click)="askQuickQuestion('Quelle page a le taux de rebond le plus eleve ?')" class="quick-btn">Rebond</button>
          <button type="button" (click)="askQuickQuestion('Quelles sont les 3 actions SEO prioritaires ?')" class="quick-btn">Actions</button>
        </div>

        <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
      </div>
    </div>
  `,
  styles: [`
    .ai-assistant-container { display: flex; flex-direction: column; height: calc(100vh - 200px); background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .ai-header { background: linear-gradient(135deg, #23395d 0%, #2f5d62 100%); color: white; padding: 16px 20px; }
    .ai-header h2 { margin: 0 0 4px 0; font-size: 22px; }
    .subtitle { margin: 0; font-size: 13px; opacity: 0.9; }
    .ai-service-selector { display: flex; gap: 10px; align-items: center; padding: 10px 16px; border-bottom: 1px solid #e8edf3; background: #f8fafc; flex-wrap: wrap; }
    .service-pill { font-size: 12px; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; color: #475569; }
    .service-pill.up { border-color: #16a34a; color: #166534; background: #f0fdf4; }
    .mode-buttons { margin-left: auto; display: flex; gap: 8px; }
    .mode-buttons button { border: 1px solid #cbd5e1; background: white; color: #334155; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
    .mode-buttons button.active { background: #0f766e; border-color: #0f766e; color: white; }
    .mode-buttons button:disabled { opacity: 0.5; cursor: not-allowed; }
    .ai-content { flex: 1; overflow-y: auto; padding: 16px; display: flex; gap: 16px; }
    .chat-messages { flex: 1; display: flex; flex-direction: column; gap: 12px; }
    .welcome-message { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 4px; }
    .message { display: flex; gap: 10px; }
    .message.user { justify-content: flex-end; }
    .message-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e2e8f0; font-size: 11px; }
    .message.user .message-avatar { background: #0f766e; color: white; }
    .message-content { max-width: 72%; background: #f8fafc; padding: 10px 12px; border-radius: 8px; }
    .message.user .message-content { background: #0f766e; color: white; }
    .message-content p { margin: 0; line-height: 1.45; }
    .message-meta { margin-top: 6px; opacity: 0.75; font-size: 12px; }
    .loading-indicator { color: #0f766e; padding: 10px; }
    .context-panel { width: 260px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; max-height: 360px; overflow-y: auto; }
    .context-panel h4 { margin: 0 0 10px 0; }
    .stat { display: flex; justify-content: space-between; padding: 6px 8px; background: white; border-radius: 4px; font-size: 13px; margin-bottom: 8px; }
    .ai-input-section { border-top: 1px solid #e2e8f0; padding: 14px; background: #f8fafc; }
    .message-form { margin-bottom: 10px; }
    .input-wrapper { display: flex; gap: 8px; }
    .message-input { flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 14px; }
    .send-button { border: none; border-radius: 6px; background: #0f766e; color: white; padding: 0 14px; cursor: pointer; }
    .send-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .quick-btn { border: 1px solid #cbd5e1; border-radius: 6px; background: white; padding: 8px; cursor: pointer; font-size: 12px; }
    .quick-btn:hover { background: #ecfeff; }
    .error-message { margin-top: 10px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px; }
    @media (max-width: 980px) { .ai-content { flex-direction: column; } .context-panel { width: 100%; max-height: 160px; } .quick-actions { grid-template-columns: 1fr; } }
  `]
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userMessage: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  contextData: any = null;
  servicesStatus: AiServiceStatus | null = null;
  aiMode: 'auto' | 'ollama' | 'gemini' = 'auto';
  private shouldScroll: boolean = false;

  constructor(private aiService: AiChatService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadServicesStatus();
    this.loadInitialContext();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  setMode(mode: 'auto' | 'ollama' | 'gemini') {
    this.aiMode = mode;
  }

  private loadServicesStatus() {
    this.aiService.getServicesStatus().subscribe({
      next: (status) => { this.servicesStatus = status; },
      error: () => { this.servicesStatus = null; }
    });
  }

  private loadInitialContext() {
    this.aiService.getDashboardContext('summary').subscribe({
      next: (data: any) => { this.contextData = data?.context_summary || data; },
      error: () => { this.contextData = null; }
    });
  }

  sendMessage() {
    if (!this.userMessage.trim()) {
      return;
    }

    const userMsg = this.userMessage.trim();
    this.userMessage = '';
    this.errorMessage = '';

    this.messages.push({ role: 'user', content: userMsg, timestamp: new Date().toLocaleTimeString() });

    this.isLoading = true;
    this.shouldScroll = true;

    this.aiService.sendMessageWithMode(userMsg, this.aiMode, 'summary').subscribe({
      next: (response: AiResponse) => {
        this.messages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toLocaleTimeString(),
          metadata: { provider: response.provider || this.aiMode, model: response.model || 'default' }
        });

        if (response.context_summary) {
          this.contextData = response.context_summary;
        }

        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.errorMessage = 'Le serveur met plus de temps que prevu a repondre. Reessayez dans quelques secondes.';
        this.isLoading = false;
        this.shouldScroll = true;
      }
    });
  }

  askQuickQuestion(question: string) {
    this.userMessage = question;
    this.sendMessage();
  }

  formatMessage(content: string): SafeHtml {
    const formatted = content
      .replace(/\\n/g, '<br>')
      .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.*?)\\*/g, '<em>$1</em>');
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 0);
    }
  }
}
