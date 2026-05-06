import { Injectable, signal, computed } from '@angular/core';
import { Tagesbericht } from '../../../core/models/bautagebuch.model';

@Injectable({ providedIn: 'root' })
export class BautagebuchStore {
  private readonly _berichte = signal<Tagesbericht[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  readonly berichte = this._berichte.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly pendingCount = computed(() =>
    this._berichte().filter(b => b.sync_status === 'pending').length
  );

  setBerichte(berichte: Tagesbericht[]): void {
    this._berichte.set(berichte);
  }

  addBericht(bericht: Tagesbericht): void {
    this._berichte.update(list => [bericht, ...list]);
  }

  updateBericht(updated: Tagesbericht): void {
    this._berichte.update(list =>
      list.map(b => b.id === updated.id ? updated : b)
    );
  }

  removeBericht(id: string): void {
    this._berichte.update(list => list.filter(b => b.id !== id));
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }
}
