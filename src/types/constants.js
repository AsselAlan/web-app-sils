// Roles disponibles en el sistema
export const ROLES = {
  ADMIN: 'ADMIN',
  TECNICO: 'TECNICO'
};

// Zonas de trabajo disponibles (solo para herramientas)
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
  NO_HAY: 'NO_HAY'
};

// Estados para checks diarios
export const ESTADOS_CHECKS = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
  OMITIDO: 'OMITIDO'
};

// Estados encontrados en verificación
export const ESTADOS_VERIFICACION = {
  OK: 'OK',
  FALTANTE: 'FALTANTE',
  DAÑADO: 'DAÑADO'
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
    NO_HAY: 'No disponible'
  },
  ESTADOS_CHECKS: {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    COMPLETADO: 'Completado',
    OMITIDO: 'Omitido'
  },
  ESTADOS_VERIFICACION: {
    OK: 'OK - Presente',
    FALTANTE: 'Faltante',
    DAÑADO: 'Dañado'
  }
};
