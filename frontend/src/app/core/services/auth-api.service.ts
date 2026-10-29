import { Injectable } from '@angular/core';
import {
  AuthService,
  RegisterUserRequest,
  LoginRequest,
  LoginResponse,
} from './auth.service';

export type { RegisterUserRequest, LoginRequest, LoginResponse };

@Injectable({ providedIn: 'root' })
export class AuthApiService extends AuthService {}
