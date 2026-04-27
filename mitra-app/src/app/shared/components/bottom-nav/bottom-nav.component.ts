import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UIStore } from '../../ui/ui.store';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly uiStore = inject(UIStore);
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
    { path: '/notizen', label: 'Notizen', icon: '📝' },
    { path: '/angebote', label: 'Angebote', icon: '📄' },
    { path: '/termine', label: 'Termine', icon: '📅' },
    { path: '/wissen', label: 'Wissen', icon: '🔍' },
  ];

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  navigate(path: string): void {
    this.uiStore.setActiveTab(path.replace('/', ''));
    this.router.navigate([path]);
  }
}
