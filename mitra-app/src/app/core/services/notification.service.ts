import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  private readonly _permission = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  private readonly _isSubscribed = signal<boolean>(false);

  readonly permission = this._permission.asReadonly();
  readonly isSubscribed = this._isSubscribed.asReadonly();
  readonly canRequestPermission = computed(() => this._permission() === 'default');

  async init(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    this._permission.set(Notification.permission);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    this._isSubscribed.set(sub !== null);
  }

  async subscribe(): Promise<void> {
    const result = await Notification.requestPermission();
    this._permission.set(result);
    if (result !== 'granted') return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(environment.vapidPublicKey).buffer as ArrayBuffer,
      });
      await firstValueFrom(this.api.post('/push/subscribe/', sub.toJSON()));
      this._isSubscribed.set(true);
    } catch (err) {
      console.error('[Push] Subscription fehlgeschlagen:', err);
      alert('Push-Fehler: ' + (err as Error).message);
    }
  }

  async unsubscribe(): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await firstValueFrom(this.api.delete('/push/unsubscribe/'));
    }
    this._isSubscribed.set(false);
  }

  checkIosInstallStatus(): boolean {
    return (navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }
}
