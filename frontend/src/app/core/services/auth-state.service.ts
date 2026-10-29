import { Injectable, signal, computed } from '@angular/core';

export interface CurrentUser {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  role: 'CLIENTE' | 'ADMIN';
  dni?: string;
}

// Service de estado de sesion. Unica fuente de verdad sobre el usuario
// autenticado. Expuesto como readonly para que nadie mute el estado desde afuera.
@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly _token = signal<string | null>(this.loadTokenFromStorage());
  private readonly _currentUser = signal<CurrentUser | null>(this.loadUserFromStorage());

  // Solo lectura para los consumidores.
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(
    () => this._currentUser() !== null && this._token() !== null,
  );

  private loadUserFromStorage(): CurrentUser | null {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? (JSON.parse(userJson) as CurrentUser) : null;
    } catch {
      return null;
    }
  }

  private loadTokenFromStorage(): string | null {
    try {
      return localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  setSession(user: CurrentUser, token: string): void {
    this._token.set(token);
    this._currentUser.set(user);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser(): CurrentUser | null {
    return this._currentUser();
  }

  getToken(): string | null {
    return this._token();
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
  }
}
