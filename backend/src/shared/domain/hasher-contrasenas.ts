export const HASHER_CONTRASENAS = Symbol('HASHER_CONTRASENAS');

// Puerto compartido: Usuarios hashea al registrar y Auth compara al iniciar
// sesion.
export interface HasherContrasenas {
  hashear(contrasena: string): Promise<string>;
  comparar(contrasena: string, hash: string): Promise<boolean>;
}
