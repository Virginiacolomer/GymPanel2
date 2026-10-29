import { Injectable } from '@angular/core';
import {
  UsuarioService,
  UserStatus,
  AdminUserItem,
  ActiveClientUserItem,
} from '../../features/usuarios/services/usuario.service';

export type { UserStatus, AdminUserItem, ActiveClientUserItem };

/**
 * @deprecated Use `UsuarioService` de `features/usuarios/services/usuario.service`.
 * Se mantiene temporalmente para compatibilidad hacia atrás.
 */
@Injectable({ providedIn: 'root' })
export class UsersApiService extends UsuarioService {}
