export enum UserRole {
  CLIENTE = 'CLIENTE',
  ADMIN = 'ADMIN',
  // No pertenece a ningun gimnasio: es quien administra los planes
  // (Basico/Pro/Full) de todos los gimnasios de la plataforma.
  SUPERADMIN = 'SUPERADMIN',
}