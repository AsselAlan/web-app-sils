// Roles disponibles en el sistema
export const ROLES = {
  ADMIN: 'ADMIN',
  TECNICO: 'TECNICO'
};

// Zonas de trabajo disponibles
export const ZONAS = {
  INSTALACIONES: 'INSTALACIONES',
  MANTENIMIENTO: 'MANTENIMIENTO',
  TALLER: 'TALLER'
};

// Estados de herramientas disponibles
export const ESTADOS_HERRAMIENTAS = {
  BIEN: 'BIEN',
  REGULAR: 'REGULAR',
  MAL: 'MAL',
  FALTANTE: 'FALTANTE',
  ROTA: 'ROTA'
};

// Estados de solicitudes
export const ESTADOS_SOLICITUDES = {
  PENDIENTE: 'PENDIENTE',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  ENTREGADA: 'ENTREGADA',
  COMPLETADA: 'COMPLETADA',
  CANCELADA: 'CANCELADA'
};

// Tipos de solicitudes
export const TIPOS_SOLICITUDES = {
  CAMBIO: 'CAMBIO',
  NUEVA: 'NUEVA',
  REPARACION: 'REPARACION'
};

// Utilidades para obtener labels en español
export const LABELS = {
  ROLES: {
    ADMIN: 'Administrador',
    TECNICO: 'Técnico'
  },
  ZONAS: {
    INSTALACIONES: 'Instalaciones',
    MANTENIMIENTO: 'Mantenimiento',
    TALLER: 'Taller'
  },
  ESTADOS_HERRAMIENTAS: {
    BIEN: 'En buen estado',
    REGULAR: 'Estado regular',
    MAL: 'En mal estado',
    FALTANTE: 'Faltante',
    ROTA: 'Rota'
  },
  ESTADOS_SOLICITUDES: {
    PENDIENTE: 'Pendiente',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
    ENTREGADA: 'Entregada',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada'
  },
  TIPOS_SOLICITUDES: {
    CAMBIO: 'Cambio',
    NUEVA: 'Nueva',
    REPARACION: 'Reparación'
  }
};
