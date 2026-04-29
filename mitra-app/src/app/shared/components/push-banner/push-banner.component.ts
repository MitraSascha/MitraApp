import { Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-push-banner',
  standalone: true,
  templateUrl: './push-banner.component.html',
  styleUrl: './push-banner.component.scss',
})
export class PushBannerComponent {
  readonly notificationService = inject(NotificationService);
  readonly dismissed = signal(false);

  async activate(): Promise<void> {
    await this.notificationService.subscribe();
    this.dismissed.set(true);
  }
}
