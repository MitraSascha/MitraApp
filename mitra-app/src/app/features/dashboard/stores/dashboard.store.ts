import { Injectable, computed, inject } from '@angular/core';
import { NotizStore } from '../../notizen/stores/notizen.store';
import { TerminStore } from '../../termine/stores/termine.store';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly notizStore = inject(NotizStore);
  private readonly terminStore = inject(TerminStore);

  readonly heutigeTermine = computed(() => this.terminStore.heutigeTermine());
  readonly morgigTermine = computed(() => this.terminStore.morgigTermine());
  readonly offeneAufgaben = computed(() => this.notizStore.offeneAufgaben());
  readonly offeneNotizenAnzahl = computed(() => this.notizStore.offeneNotizen().length);
  readonly pendingSync = computed(() => this.notizStore.pendingCount());

  readonly hatDringendesHeute = computed(() =>
    this.terminStore.heutigeTermine().some(t => t.typ === 'notdienst')
  );
}
