import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UIStore {
  private readonly _isOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  private readonly _activeTab = signal<string>('dashboard');
  private readonly _isGlobalLoading = signal<boolean>(false);
  private readonly _toastMessage = signal<string | null>(null);
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly isOnline = this._isOnline.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();
  readonly isGlobalLoading = this._isGlobalLoading.asReadonly();
  readonly isOffline = computed(() => !this._isOnline());
  readonly toastMessage = this._toastMessage.asReadonly();

  setOnline(value: boolean): void {
    this._isOnline.set(value);
  }

  setActiveTab(tab: string): void {
    this._activeTab.set(tab);
  }

  setGlobalLoading(value: boolean): void {
    this._isGlobalLoading.set(value);
  }

  showToast(message: string, durationMs = 3000): void {
    if (this._toastTimer) {
      clearTimeout(this._toastTimer);
    }
    this._toastMessage.set(message);
    this._toastTimer = setTimeout(() => {
      this._toastMessage.set(null);
      this._toastTimer = null;
    }, durationMs);
  }
}
