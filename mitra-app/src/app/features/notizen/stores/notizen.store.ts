import { Injectable, signal, computed } from '@angular/core';
import { Notiz, NotizStatus, SyncStatus } from '../../../core/models/notiz.model';

@Injectable({ providedIn: 'root' })
export class NotizStore {
  private readonly _notizen = signal<Notiz[]>([]);
  private readonly _aktiveNotiz = signal<Notiz | null>(null);
  private readonly _syncStatus = signal<SyncStatus>('synced');
  private readonly _isLoading = signal<boolean>(false);
  private readonly _filter = signal<NotizStatus | 'alle'>('alle');

  readonly notizen = this._notizen.asReadonly();
  readonly aktiveNotiz = this._aktiveNotiz.asReadonly();
  readonly syncStatus = this._syncStatus.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly filter = this._filter.asReadonly();

  readonly gefilterteNotizen = computed(() => {
    const f = this._filter();
    if (f === 'alle') return this._notizen();
    return this._notizen().filter(n => n.status === f);
  });

  readonly offeneNotizen = computed(() =>
    this._notizen().filter(n => n.status === 'offen')
  );

  readonly pendingCount = computed(() =>
    this._notizen().filter(n => n.sync_status === 'pending').length
  );

  readonly offeneAufgaben = computed(() =>
    this._notizen()
      .filter(n => n.status !== 'erledigt')
      .flatMap(n => n.ki_items?.filter(i => i.typ === 'aufgabe' && !i.erledigt) ?? [])
  );

  setNotizen(notizen: Notiz[]): void {
    this._notizen.set(notizen);
  }

  addNotiz(notiz: Notiz): void {
    this._notizen.update(list => [notiz, ...list]);
  }

  updateNotiz(updated: Notiz): void {
    this._notizen.update(list =>
      list.map(n => n.id === updated.id ? updated : n)
    );
    if (this._aktiveNotiz()?.id === updated.id) {
      this._aktiveNotiz.set(updated);
    }
  }

  removeNotiz(id: string): void {
    this._notizen.update(list => list.filter(n => n.id !== id));
    if (this._aktiveNotiz()?.id === id) {
      this._aktiveNotiz.set(null);
    }
  }

  setAktiveNotiz(notiz: Notiz | null): void {
    this._aktiveNotiz.set(notiz);
  }

  setSyncStatus(status: SyncStatus): void {
    this._syncStatus.set(status);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  setFilter(filter: NotizStatus | 'alle'): void {
    this._filter.set(filter);
  }
}
