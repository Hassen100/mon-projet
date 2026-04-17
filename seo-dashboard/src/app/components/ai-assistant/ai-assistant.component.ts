import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, ChatMessage, AiResponse } from '../../services/ai-chat.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-assistant-container">
      <header class="ai-header">
        <h2>🤖 AI SEO Assistant</h2>
        <p class="subtitle">Get AI-powered SEO insights and recommendations</p>
      </header>

      <div class="ai-content">
        <!-- Chat Messages -->
        <div class="chat-messages" #messagesContainer>
          <div class="welcome-message" *ngIf="messages.length === 0">
            <h3>Welcome to AI SEO Assistant!</h3>
            <p>Ask me anything about your SEO performance. I'm powered by Gemini AI and can help you:</p>
            <ul>
              <li>Analyze your website traffic patterns</li>
              <li>Identify top-performing pages</li>
              <li>Suggest content optimization strategies</li>
              <li>Find search ranking opportunities</li>
            </ul>
          </div>

          <div class="message" [ngClass]="msg.role" *ngFor="let msg of messages">
            <div class="message-avatar">
              <span>{{ msg.role === 'user' ? '👤' : '🤖' }}</span>
            </div>
            <div class="message-content">
              <p [innerHTML]="formatMessage(msg.content)"></p>
              <div class="message-meta" *ngIf="msg.metadata">
                <small>{{ msg.metadata.model }} • {{ msg.timestamp }}</small>
              </div>
            </div>
          </div>

          <div class="loading-indicator" *ngIf="isLoading">
            <div class="spinner"></div>
            <span>AI is thinking...</span>
          </div>
        </div>

        <!-- Context Summary -->
        <div class="context-panel" *ngIf="contextData">
          <h4>📊 Current Context</h4>
          <div class="context-stats">
            <div class="stat" *ngIf="contextData.sessions">
              <label>Sessions:</label>
              <span>{{ contextData.sessions | number }}</span>
            </div>
            <div class="stat" *ngIf="contextData.users">
              <label>Users:</label>
              <span>{{ contextData.users | number }}</span>
            </div>
            <div class="stat" *ngIf="contextData.page_views">
              <label>Page Views:</label>
              <span>{{ contextData.page_views | number }}</span>
            </div>
            <div class="stat" *ngIf="contextData.clicks">
              <label>GSC Clicks:</label>
              <span>{{ contextData.clicks | number }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Section -->
      <div class="ai-input-section">
        <form (ngSubmit)="sendMessage()" class="message-form">
          <div class="input-wrapper">
            <textarea
              [(ngModel)]="userMessage"
              name="message"
              placeholder="Ask me about your SEO performance..."
              (keydown.enter)="$event.shiftKey || sendMessage()"
              [disabled]="isLoading"
              class="message-input"
              rows="2"
            ></textarea>
            <button
              type="submit"
              [disabled]="!userMessage.trim() || isLoading"
              class="send-button"
            >
              {{ isLoading ? '⏳' : '➤' }}
            </button>
          </div>
        </form>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button (click)="askQuickQuestion('What are my top performing pages?')" class="quick-btn">
            📈 Top Pages
          </button>
          <button (click)="askQuickQuestion('What keywords should I target?')" class="quick-btn">
            🎯 Keywords
          </button>
          <button (click)="askQuickQuestion('How is my organic traffic trending?')" class="quick-btn">
            📊 Traffic Trend
          </button>
          <button (click)="askQuickQuestion('What are your top SEO recommendations?')" class="quick-btn">
            💡 Recommendations
          </button>
        </div>

        <!-- Error Message -->
        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-assistant-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 200px);
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .ai-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-bottom: 2px solid #555;
    }

    .ai-header h2 {
      margin: 0 0 5px 0;
      font-size: 24px;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }

    .ai-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      gap: 20px;
    }

    .chat-messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .welcome-message {
      background: #f0f7ff;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 4px;
      margin-top: 20px;
    }

    .welcome-message h3 {
      margin: 0 0 10px 0;
      color: #667eea;
    }

    .welcome-message ul {
      margin: 10px 0 0 20px;
      padding: 0;
    }

    .welcome-message li {
      margin: 5px 0;
      color: #555;
    }

    .message {
      display: flex;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      justify-content: flex-end;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: #f0f0f0;
      flex-shrink: 0;
    }

    .message.user .message-avatar {
      background: #667eea;
      color: white;
    }

    .message-content {
      max-width: 70%;
      background: #f5f5f5;
      padding: 12px 16px;
      border-radius: 8px;
      word-wrap: break-word;
    }

    .message.user .message-content {
      background: #667eea;
      color: white;
    }

    .message-content p {
      margin: 0 0 8px 0;
      line-height: 1.5;
    }

    .message-content p:last-child {
      margin: 0;
    }

    .message-meta {
      margin-top: 8px;
      opacity: 0.7;
      font-size: 12px;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #667eea;
      padding: 20px;
      justify-content: center;
    }

    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .context-panel {
      width: 250px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 15px;
      max-height: 400px;
      overflow-y: auto;
    }

    .context-panel h4 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .context-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 8px;
      background: white;
      border-radius: 4px;
    }

    .stat label {
      font-weight: 500;
      color: #666;
    }

    .stat span {
      color: #667eea;
      font-weight: 600;
    }

    .ai-input-section {
      border-top: 1px solid #ddd;
      padding: 20px;
      background: #f9f9f9;
    }

    .message-form {
      margin-bottom: 16px;
    }

    .input-wrapper {
      display: flex;
      gap: 10px;
    }

    .message-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .message-input:disabled {
      background: #f0f0f0;
      cursor: not-allowed;
    }

    .send-button {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s;
      min-width: 50px;
    }

    .send-button:hover:not(:disabled) {
      background: #5568d3;
    }

    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }

    .quick-btn {
      padding: 10px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
    }

    .quick-btn:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .error-message {
      color: #d32f2f;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 14px;
    }

    @media (max-width: 1024px) {
      .ai-content {
        flex-direction: column;
      }

      .context-panel {
        width: 100%;
        max-height: 150px;
      }

      .message-content {
        max-width: 100%;
      }

      .quick-actions {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .ai-assistant-container {
        height: calc(100vh - 150px);
      }

      .ai-header h2 {
        font-size: 18px;
      }

      .ai-content {
        padding: 12px;
        gap: 12px;
      }

      .input-wrapper {
        flex-direction: column;
      }

      .send-button {
        width: 100%;
      }

      .quick-actions {
        grid-template-columns: 1fr;
      }

      .message-content {
        max-width: 100%;
      }
    }
  `]
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userMessage: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  contextData: any = null;
  private shouldScroll: boolean = false;

  constructor(
    private aiService: AiChatService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.loadInitialContext();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private loadInitialContext() {
    this.aiService.getDashboardContext('summary').subscribe(
      (data) => {
        this.contextData = data.context_summary || data;
      },
      (error) => {
        console.error('Error loading context:', error);
      }
    );
  }

  sendMessage() {
    if (!this.userMessage.trim()) {
      return;
    }

    const userMsg = this.userMessage.trim();
    this.userMessage = '';
    this.errorMessage = '';

    // Add user message to chat
    this.messages.push({
      role: 'user',
      content: userMsg,
      timestamp: new Date().toLocaleTimeString()
    });

    this.isLoading = true;
    this.shouldScroll = true;

    this.aiService.sendMessage(userMsg, 'summary').subscribe(
      (response: AiResponse) => {
        this.messages.push({
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toLocaleTimeString(),
          metadata: {
            model: 'Gemini AI'
          }
        });

        if (response.context_summary) {
          this.contextData = response.context_summary;
        }

        this.isLoading = false;
        this.shouldScroll = true;
      },
      (error) => {
        console.error('Error sending message:', error);
        this.errorMessage = 'Failed to get AI response. Please try again.';
        this.isLoading = false;
        this.shouldScroll = true;
      }
    );
  }

  askQuickQuestion(question: string) {
    this.userMessage = question;
    this.sendMessage();
  }

  formatMessage(content: string): SafeHtml {
    // Simple markdown-like formatting
    let formatted = content
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
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { AIChatService, AIChatResponse, AIQuickAnalysis } from '../../services/ai-chat.service';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  quickAnalysis: AIQuickAnalysis | null = null;
  shouldScroll: boolean = false;
  messageIdCounter: number = 0;
  private requestGuardTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private aiChatService: AIChatService, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {
    this.addSystemMessage(
      "Bienvenue ! 👋 Je suis votre expert SEO IA intégré au dashboard Pulse Board.\n\n" +
      "Je peux analyser vos données en temps réel et vous proposer des optimisations concrètes :\n\n" +
      "📄 **Pages problématiques** - Identifiez les pages avec taux de rebond élevé\n" +
      "🔍 **Opportunités de mots-clés** - Détectez les quick wins en SEO\n" +
      "📉 **Anomalies de trafic** - Analysez les fluctuations anormales\n" +
      "⚙️ **Optimisation technique** - Conseils d'amélioration\n\n" +
      "Posez-moi vos questions librement en français !"
    );
  }

  ngOnInit() {
    this.loadQuickAnalysis();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling:', err);
    }
  }

  private addSystemMessage(content: string) {
    this.messages.push({
      id: this.messageIdCounter++,
      role: 'assistant',
      content,
      timestamp: new Date(),
      isLoading: false
    });
  }

  private addLoadingMessage() {
    this.messages.push({
      id: this.messageIdCounter++,
      role: 'assistant',
      content: '⏳ Analyse en cours...',
      timestamp: new Date(),
      isLoading: true
    });
    this.shouldScroll = true;
  }

  private removeLoadingMessage() {
    // Remove all stale loading bubbles to keep UI state consistent.
    const before = this.messages.length;
    this.messages = this.messages.filter(m => m.isLoading !== true);
    if (this.messages.length !== before) {
      this.shouldScroll = true;
      this.cdr.detectChanges();
    }
  }

  private clearRequestGuard() {
    if (this.requestGuardTimer) {
      clearTimeout(this.requestGuardTimer);
      this.requestGuardTimer = null;
    }
  }

  private completeRequestState() {
    // Idempotent cleanup to avoid stuck "Analyse..." state on any race/error path.
    this.clearRequestGuard();
    this.removeLoadingMessage();
    this.isLoading = false;
    this.shouldScroll = true;
    this.cdr.detectChanges();
  }

  loadQuickAnalysis() {
    this.aiChatService.getQuickAnalysis(undefined, 30).subscribe({
      next: (analysis) => {
        this.quickAnalysis = analysis;
      },
      error: (err) => {
        console.error('Error loading quick analysis:', err);
      }
    });
  }

  formatMessage(content: string): SafeHtml {
    // Simple HTML escaping and formatting
    let formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\n/g, '<br/>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  sendMessage() {
    if (!this.userInput.trim()) {
      return;
    }

    // Ensure stale loading state from a previous request does not survive.
    this.removeLoadingMessage();
    this.clearRequestGuard();

    // Add user message
    this.messages.push({
      id: this.messageIdCounter++,
      role: 'user',
      content: this.userInput,
      timestamp: new Date()
    });

    const userMessage = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;

    // Add loading indicator
    this.addLoadingMessage();

    // Send to AI
    this.requestGuardTimer = setTimeout(() => {
      // Only trigger timeout if request is still pending
      if (!this.isLoading) {
        return;
      }

      console.warn('⏱️ Request timeout after 210s - forcing cleanup');
      
      this.removeLoadingMessage();
      this.isLoading = false;
      this.shouldScroll = true;

      this.messages.push({
        id: this.messageIdCounter++,
        role: 'assistant',
        content: "⏱️ Délai dépassé (>210s). L'analyse a pris trop de temps, veuillez réessayer.",
        timestamp: new Date()
      });
      
      // Force UI update
      this.cdr.detectChanges();
    }, 210000);

    this.aiChatService.sendMessage(userMessage, undefined, 30)
      .pipe(
        finalize(() => {
          this.completeRequestState();
        })
      )
      .subscribe({
      next: (response: AIChatResponse) => {
        // Defensive: in some browser/runtime races finalize may be delayed.
        this.completeRequestState();
        
        this.messages.push({
          id: this.messageIdCounter++,
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        });
        
        // Update quick analysis if available
        if (response.context_summary) {
          this.loadQuickAnalysis();
        }
      },
      error: (err) => {
        this.completeRequestState();
        console.error('Error sending message:', err);

        const backendMessage = err?.error?.message || err?.error?.detail || '';
        const displayMessage = backendMessage
          ? `❌ Erreur: ${backendMessage}`
          : "❌ Erreur lors de l'analyse. Veuillez réessayer.";

        this.messages.push({
          id: this.messageIdCounter++,
          role: 'assistant',
          content: displayMessage,
          timestamp: new Date()
        });

      }
    });
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Preset suggestions
  suggestQuestion(suggestion: string) {
    this.userInput = suggestion;
    setTimeout(() => this.sendMessage(), 100);
  }

  clear() {
    this.clearRequestGuard();
    this.isLoading = false;
    this.messages = [];
    this.addSystemMessage(
      "Chat réinitialisé. Comment puis-je vous aider ? 🔍"
    );
  }
}
