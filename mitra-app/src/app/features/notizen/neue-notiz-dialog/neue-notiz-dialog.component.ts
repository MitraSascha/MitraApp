import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VONWEM, TOPICS, VONWEM_ENTRIES, TOPICS_ENTRIES } from '../../../core/models/notiz.constants';
import { NotizVonwem, NotizTopic } from '../../../core/models/notiz.model';

@Component({
  selector: 'app-neue-notiz-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './neue-notiz-dialog.component.html',
  styleUrl: './neue-notiz-dialog.component.scss',
})
export class NeueNotizDialogComponent {
  readonly created = output<{ vonwem: NotizVonwem; topic: NotizTopic }>();
  readonly closed  = output<void>();

  readonly VONWEM        = VONWEM;
  readonly TOPICS        = TOPICS;
  readonly vonwemEntries = VONWEM_ENTRIES;
  readonly topicsEntries = TOPICS_ENTRIES;

  vonwem = signal<NotizVonwem>('kunde');
  topic  = signal<NotizTopic>('allgemein');

  erstellen(): void {
    this.created.emit({ vonwem: this.vonwem(), topic: this.topic() });
    this.closed.emit();
  }
}
