export type UserStatus = 'creado' | 'activo' | 'inactivo';

export interface AdminUserItem {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  estado: UserStatus;
}

export interface ActiveClientUserItem {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  estado: UserStatus;
}
