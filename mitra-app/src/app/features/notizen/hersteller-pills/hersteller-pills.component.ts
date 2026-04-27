import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HERSTELLER_SANITAER, HERSTELLER_HEIZUNG, HERSTELLER_KLIMA } from '../../../core/models/hersteller.constants';

@Component({
  selector: 'app-hersteller-pills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hersteller-pills.component.html',
  styleUrl: './hersteller-pills.component.scss',
})
export class HerstellerPillsComponent {
  @Input() selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  readonly kategorien = [
    { label: 'Sanitär', hersteller: HERSTELLER_SANITAER },
    { label: 'Heizung', hersteller: HERSTELLER_HEIZUNG },
    { label: 'Klima', hersteller: HERSTELLER_KLIMA },
  ] as const;

  isSelected(name: string): boolean {
    return this.selected.includes(name);
  }

  toggle(name: string): void {
    const next = this.isSelected(name)
      ? this.selected.filter(h => h !== name)
      : [...this.selected, name];
    this.selectedChange.emit(next);
  }
}
