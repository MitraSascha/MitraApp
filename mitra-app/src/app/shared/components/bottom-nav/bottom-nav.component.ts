import { Component, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { UIStore } from '../../ui/ui.store';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly uiStore = inject(UIStore);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly moreOpen = signal(false);

  readonly mainItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/notizen', label: 'Notizen', icon: '📝' },
    { path: '/angebote', label: 'Angebote', icon: '📄' },
  ];

  readonly moreItems: NavItem[] = [
    { path: '/termine', label: 'Termine', icon: '📅' },
    { path: '/bautagebuch', label: 'Bautagebuch', icon: '📋' },
    { path: '/visitenkarten', label: 'Visitenkarten', icon: '🃏' },
    { path: '/wissen', label: 'Wissen', icon: '🔍' },
  ];

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  isMoreActive(): boolean {
    return this.moreItems.some(item => this.isActive(item.path));
  }

  toggleMore(): void {
    this.moreOpen.update(v => !v);
  }

  navigate(path: string): void {
    this.moreOpen.set(false);
    this.uiStore.setActiveTab(path.replace('/', ''));
    this.router.navigate([path]);
  }

  async logout(): Promise<void> {
    if (!confirm('Wirklich abmelden?')) return;
    this.moreOpen.set(false);
    await this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
