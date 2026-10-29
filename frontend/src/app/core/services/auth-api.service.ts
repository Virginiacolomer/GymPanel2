import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from './auth-state.service';

export interface RegisterUserRequest {
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  register(payload: RegisterUserRequest): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/users`, payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, payload);
  }
}
