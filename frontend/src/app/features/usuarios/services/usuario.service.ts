import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActiveClientUserItem,
  AdminUserItem,
  UserStatus,
} from '../models/usuario.model';

export type { UserStatus, AdminUserItem, ActiveClientUserItem };

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  getUsuariosPendientes(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.apiBaseUrl}/users/pendientes`);
  }

  getClientesActivos(): Observable<ActiveClientUserItem[]> {
    return this.http.get<ActiveClientUserItem[]>(`${this.apiBaseUrl}/users/clientes-activos`);
  }

  updateEstado(userId: number, estado: UserStatus): Observable<AdminUserItem> {
    return this.http.patch<AdminUserItem>(`${this.apiBaseUrl}/users/${userId}/estado`, { estado });
  }

  deleteUsuario(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiBaseUrl}/users/${userId}`);
  }
}
