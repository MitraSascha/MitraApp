import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppUser, AuthTokens, LoginRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'mitra_access';
const REFRESH_TOKEN_KEY = 'mitra_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<AppUser | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isLoading = this._isLoading.asReadonly();

  async login(credentials: LoginRequest): Promise<void> {
    this._isLoading.set(true);
    try {
      const tokens = await firstValueFrom(
        this.http.post<AuthTokens>(`${environment.apiUrl}/auth/login/`, credentials)
      );
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
      await this.loadCurrentUser();
    } finally {
      this._isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    this.clearTokens();
    this._currentUser.set(null);
  }

  async refreshToken(): Promise<string> {
    const refresh = this.getRefreshToken();
    if (!refresh) throw new Error('Kein Refresh-Token vorhanden');

    const tokens = await firstValueFrom(
      this.http.post<AuthTokens>(`${environment.apiUrl}/auth/refresh/`, { refresh })
    );
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    return tokens.access;
  }

  async loadCurrentUser(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    const user = await firstValueFrom(
      this.http.get<AppUser>(`${environment.apiUrl}/auth/me/`)
    );
    this._currentUser.set(user);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
