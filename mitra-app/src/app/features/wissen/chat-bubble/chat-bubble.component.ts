import { Component, Input } from '@angular/core';
import { ChatMessage } from '../../../core/models/chat.model';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.scss',
})
export class ChatBubbleComponent {
  @Input({ required: true }) message!: ChatMessage;
}
