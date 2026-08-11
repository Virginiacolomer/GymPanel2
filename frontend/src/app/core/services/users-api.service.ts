import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserStatus = 'creado' | 'activo' | 'inactivo';

export interface AdminUserItem {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  estado: UserStatus;
}

export type PaymentState = 'alDia' | 'cuotaPendiente';

export interface UserMembershipSummary {
  membresiaId: number;
  nombre: string;
  dias: number | null;
  estadoPago: PaymentState;
}

export interface ActiveClientUserItem {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  estado: UserStatus;
  membresiaId: number | null;
  membresia: string;
  frecuenciaDias: number | null;
  estadoPago: PaymentState;
  membresias?: UserMembershipSummary[];
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  getUsuariosPendientes(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.apiBaseUrl}/users/pendientes`);
  }

  getClientesActivos(): Observable<ActiveClientUserItem[]> {
    return this.http.get<ActiveClientUserItem[]>(`${this.apiBaseUrl}/users/clientes-activos`);
  }

  updateUserMembership(userId: number, membresiaId: number): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/users/${userId}/membresia`, { membresiaId });
  }

  removeUserMembership(userId: number, membresiaId: number): Observable<unknown> {
    return this.http.delete(`${this.apiBaseUrl}/users/${userId}/membresia/${membresiaId}`);
  }

  markUserPaymentUpToDate(userId: number, membresiaId: number | null): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/users/${userId}/pago/al-dia`, { membresiaId });
  }

  updateEstado(userId: number, estado: UserStatus): Observable<AdminUserItem> {
    return this.http.patch<AdminUserItem>(`${this.apiBaseUrl}/users/${userId}/estado`, { estado });
  }

  deleteUsuario(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiBaseUrl}/users/${userId}`);
  }
}
