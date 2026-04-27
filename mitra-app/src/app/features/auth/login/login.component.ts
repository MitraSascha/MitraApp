import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly username = signal('');
  readonly password = signal('');
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = this.auth.isLoading;

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.auth.login({ username: this.username(), password: this.password() });
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/dashboard';
      await this.router.navigateByUrl(returnUrl);
    } catch {
      this.errorMessage.set('Ungültige Anmeldedaten. Bitte erneut versuchen.');
    }
  }
}
