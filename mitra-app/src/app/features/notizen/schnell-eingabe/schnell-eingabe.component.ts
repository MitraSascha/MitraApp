import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopicConfig } from '../../../core/models/notiz.constants';
import { NotizItem, NotizItemTyp } from '../../../core/models/notiz.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-schnell-eingabe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schnell-eingabe.component.html',
  styleUrl: './schnell-eingabe.component.scss',
})
export class SchnellEingabeComponent {
  readonly topicConfig = input.required<TopicConfig>();
  readonly added       = output<NotizItem>();

  typ        = signal<NotizItemTyp>('notiz');
  text       = signal('');
  hersteller = signal('');

  constructor() {
    effect(() => {
      const cats = this.topicConfig().categories;
      this.typ.set((cats[0]?.id ?? 'notiz') as NotizItemTyp);
      this.hersteller.set('');
    });
  }

  get catObj() {
    return this.topicConfig().categories.find(c => c.id === this.typ())
      ?? this.topicConfig().categories[0];
  }

  get isProdukt() { return this.typ() === 'produkt'; }

  submit(): void {
    if (!this.text().trim()) return;
    this.added.emit({
      id: uuidv4(),
      typ: this.typ(),
      text: this.text().trim(),
      hersteller: this.isProdukt ? this.hersteller() : '',
      erledigt: false,
    });
    this.text.set('');
    this.hersteller.set('');
  }

  toggleHersteller(h: string): void {
    this.hersteller.set(this.hersteller() === h ? '' : h);
  }
}
