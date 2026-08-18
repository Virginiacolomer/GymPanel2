import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CurrentUser {
  id: string;
  // El superadmin no pertenece a ningun gimnasio.
  gimnasioId?: number;
  email: string;
  nombre?: string;
  apellido?: string;
  role: 'CLIENTE' | 'ADMIN' | 'SUPERADMIN';
  dni?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private token: string | null = this.loadTokenFromStorage();
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.loadUserFromStorage()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  private loadUserFromStorage(): CurrentUser | null {
    try {
      const userJson = localStorage.getItem('currentUser');
      return userJson ? JSON.parse(userJson) : null;
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

  setCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  setSession(user: CurrentUser, token: string): void {
    this.token = token;
    localStorage.setItem('accessToken', token);
    this.setCurrentUser(user);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.token;
  }

  logout(): void {
    this.token = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null && this.token !== null;
  }
}
