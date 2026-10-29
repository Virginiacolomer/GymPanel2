import { Injectable } from '@angular/core';
import {
  UsuarioService,
  UserStatus,
  AdminUserItem,
  ActiveClientUserItem,
} from './usuario.service';

export type { UserStatus, AdminUserItem, ActiveClientUserItem };

@Injectable({ providedIn: 'root' })
export class UsersApiService extends UsuarioService {}
