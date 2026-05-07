import { AfterViewChecked, Component, ElementRef, HostBinding, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {
  AiChatService,
  AiResponse,
  DashboardContext,
  QuickAnalysisResponse,
} from '../../services/ai-chat.service';

interface AssistantMessage {
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
  styleUrls: ['./ai-assistant.component.scss'],
})
export class AiAssistantComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() embedded = false;

  @HostBinding('class.embedded')
  get embeddedClass(): boolean {
    return this.embedded;
  }

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: AssistantMessage[] = [];
  userInput = '';
  isLoading = false;
  quickAnalysis: QuickAnalysisResponse | null = null;
  shouldScroll = false;
  private messageIdCounter = 0;
  private requestGuardTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private aiChatService: AiChatService,
    private sanitizer: DomSanitizer,
  ) {
    this.addSystemMessage(
      'Bienvenue ! 👋 Je suis votre expert SEO IA intégré au dashboard Pulse Board.\n\n' +
      'Je peux analyser vos données en temps réel et vous proposer des optimisations concrètes :\n\n' +
      '📄 **Pages problématiques** - Identifiez les pages avec taux de rebond élevé\n' +
      '🔎 **Opportunités de mots-clés** - Détectez les quick wins en SEO\n' +
      '📉 **Anomalies de trafic** - Analysez les fluctuations anormales\n' +
      '⚙️ **Optimisation technique** - Conseils d amélioration\n\n' +
      'Posez-moi vos questions librement en français !'
    );
  }

  ngOnInit(): void {
    this.resetState();
    // this.loadQuickAnalysis(); // Désactivé temporairement pour diagnostic blocage
  }

  private resetState(): void {
    this.clearRequestGuard();
    this.isLoading = false;
    this.messages = [];
    this.messageIdCounter = 0;
    this.quickAnalysis = null;
    this.shouldScroll = false;
    this.addSystemMessage(
      'Bienvenue ! 👋 Je suis votre expert SEO IA intégré au dashboard Pulse Board.\n\n' +
      'Je peux analyser vos données en temps réel et vous proposer des optimisations concrètes :\n\n' +
      '📄 **Pages problématiques** - Identifiez les pages avec taux de rebond élevé\n' +
      '🔎 **Opportunités de mots-clés** - Détectez les quick wins en SEO\n' +
      '📉 **Anomalies de trafic** - Analysez les fluctuations anormales\n' +
      '⚙️ **Optimisation technique** - Conseils d amélioration\n\n' +
      'Posez-moi vos questions librement en français !'
    );
  }

  ngOnDestroy(): void {
    this.clearRequestGuard();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private addSystemMessage(content: string): void {
    this.messages.push({
      id: this.messageIdCounter++,
      role: 'assistant',
      content,
      timestamp: new Date(),
    });
  }

  private addLoadingMessage(): void {
    this.messages.push({
      id: this.messageIdCounter++,
      role: 'assistant',
      content: 'Analyse en cours...',
      timestamp: new Date(),
      isLoading: true,
    });
    this.shouldScroll = true;
  }

  private removeLoadingMessage(): void {
    this.messages = this.messages.filter((message) => message.isLoading !== true);
    this.shouldScroll = true;
  }

  private clearRequestGuard(): void {
    if (this.requestGuardTimer) {
      clearTimeout(this.requestGuardTimer);
      this.requestGuardTimer = null;
    }
  }

  private completeRequestState(): void {
    this.clearRequestGuard();
    this.removeLoadingMessage();
    this.isLoading = false;
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer?.nativeElement?.scrollTo({
        top: this.messagesContainer.nativeElement.scrollHeight,
      });
    } catch {
      // Ignore scroll errors during initial render.
    }
  }

  loadQuickAnalysis(): void {
    // Timeout court pour éviter de bloquer l'UI si l'API est lente
    this.aiChatService.getDashboardContext(undefined, 30)
      .pipe(timeout(15000))
      .subscribe({
        next: (context: any) => {
          this.quickAnalysis = this.buildQuickAnalysis(context as DashboardContext);
        },
        error: (err: any) => {
          console.error('Erreur lors du chargement du contexte AI:', err);
          this.quickAnalysis = null;
          // Débloque l'UI si blocage
          this.isLoading = false;
        },
      });
  }

  private buildQuickAnalysis(context: DashboardContext): QuickAnalysisResponse {
    const analytics = this.asRecord(context.analytics);
    const searchConsole = this.asRecord(context.search_console);

    return {
      analysis: '',
      dashboard_stats: {
        sessions: this.readNumber(analytics['total_sessions']),
        bounce_rate: this.readNumber(analytics['avg_bounce_rate']),
        search_clicks: this.readNumber(searchConsole['total_clicks']),
        avg_position: this.readNumber(searchConsole['avg_position']),
      },
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private readNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatMessage(content: string): SafeHtml {
    const formatted = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isLoading) {
      return;
    }

    this.removeLoadingMessage();
    this.clearRequestGuard();

    this.messages.push({
      id: this.messageIdCounter++,
      role: 'user',
      content: this.userInput,
      timestamp: new Date(),
    });

    const userMessage = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.shouldScroll = true;
    this.addLoadingMessage();

    let requestTimedOut = false;

    const requestSubscription = this.aiChatService.sendMessage(userMessage, 'summary')
      .pipe(
        finalize(() => {
          this.completeRequestState();
        }),
      )
      .subscribe({
        next: (response: AiResponse) => {
          if (requestTimedOut) {
            return;
          }

          this.messages.push({
            id: this.messageIdCounter++,
            role: 'assistant',
            content: response.response,
            timestamp: new Date(),
          });

          if (response.context_summary) {
            this.loadQuickAnalysis();
          }
        },
        error: (err) => {
          if (requestTimedOut) {
            return;
          }

          console.error('Erreur lors de l\'appel à l\'API AI:', err);
          const backendMessage = err?.error?.message || err?.error?.detail || '';
          this.messages.push({
            id: this.messageIdCounter++,
            role: 'assistant',
            content: backendMessage
              ? `Erreur: ${backendMessage}`
              : 'Erreur lors de l analyse. Veuillez reessayer.',
            timestamp: new Date(),
          });
        },
      });

    this.requestGuardTimer = setTimeout(() => {
      if (!this.isLoading) {
        return;
      }

      requestTimedOut = true;
      requestSubscription.unsubscribe();
      this.completeRequestState();
      this.messages.push({
        id: this.messageIdCounter++,
        role: 'assistant',
        content: 'Délai dépassé (>10s). Le serveur ne répond pas, veuillez réessayer.',
        timestamp: new Date(),
      });
    }, 10000);
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  suggestQuestion(suggestion: string): void {
    this.userInput = suggestion;
    setTimeout(() => this.sendMessage(), 100);
  }

  clear(): void {
    this.clearRequestGuard();
    this.isLoading = false;
    this.messages = [];
    this.messageIdCounter = 0;
    this.addSystemMessage('Chat réinitialisé. Comment puis-je vous aider ?');
  }
}
