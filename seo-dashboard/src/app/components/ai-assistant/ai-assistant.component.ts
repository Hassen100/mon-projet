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
