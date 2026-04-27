import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIStore } from '../../ui/ui.store';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (uiStore.isOffline()) {
      <div class="offline-bar">
        <span class="offline-dot"></span>
        Offline — Änderungen werden synchronisiert sobald du wieder online bist
      </div>
    }
  `,
  styles: [`
    .offline-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--color-warning);
      color: #000;
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
      padding: 6px var(--spacing-md);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .offline-dot {
      width: 8px;
      height: 8px;
      background: #000;
      border-radius: 50%;
      animation: blink 1.2s ease-in-out infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `],
})
export class OfflineIndicatorComponent {
  readonly uiStore = inject(UIStore);
}
