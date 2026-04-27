import { Component, input, output, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotizItem } from '../../../core/models/notiz.model';
import { TopicConfig } from '../../../core/models/notiz.constants';

@Component({
  selector: 'app-item-zeile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-zeile.component.html',
  styleUrl: './item-zeile.component.scss',
})
export class ItemZeileComponent {
  private el = inject(ElementRef);

  readonly item        = input.required<NotizItem>();
  readonly topicConfig = input.required<TopicConfig>();
  readonly changed     = output<NotizItem>();
  readonly deleted     = output<void>();

  get catConfig() {
    return this.topicConfig().categories.find(c => c.id === this.item().typ)
      ?? { color: '#94a3b8', label: this.item().typ };
  }

  onTextBlur(event: FocusEvent): void {
    const text = (event.target as HTMLElement).innerText.trim();
    if (text !== this.item().text) {
      this.changed.emit({ ...this.item(), text });
    }
  }

  onTextKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      (event.target as HTMLElement).blur();
    }
  }
}
