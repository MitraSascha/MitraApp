import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WissenStore } from '../stores/wissen.store';
import { WissenService } from '../services/wissen.service';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ChatBubbleComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef<HTMLDivElement>;

  readonly store = inject(WissenStore);
  private readonly service = inject(WissenService);

  readonly frageText = signal('');

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const el = this.messageContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  async onSenden(): Promise<void> {
    const frage = this.frageText().trim();
    if (!frage || this.store.isStreaming()) return;
    this.frageText.set('');
    await this.service.sendeFrageStreaming(frage);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSenden();
    }
  }

  neueUnterhaltung(): void {
    this.service.neueSession();
  }
}
