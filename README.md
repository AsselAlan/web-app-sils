# SILS - Sistema Integrado de Logística de Salud

Aplicación web para el control y gestión de herramientas en diferentes zonas de trabajo.

## 🚀 Características

- **Gestión de Herramientas**: Registro y control de herramientas de mano, máquinas e insumos
- **Controles Diarios/Semanales**: Checklists para verificar presencia y estado
- **Sistema de Solicitudes**: Proceso de solicitud de cambios y nuevas herramientas
- **Panel Administrativo**: Gestión y aprobación de solicitudes
- **Autenticación**: Login seguro con Supabase Auth
- **Notificaciones**: Sistema de alertas y recordatorios

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta en Supabase
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd web-app-sils
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

4. **Configurar Supabase**

Ejecuta el script SQL que se encuentra en la documentación para crear:
- Tablas (herramientas, checklists, solicitudes, etc.)
- Enums (zonas, tipos, estados)
- Políticas RLS (Row Level Security)

## 🎯 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linter
npm run lint
```

## 📁 Estructura del Proyecto

```
web-app-sils/
├── src/
│   ├── auth/              # Componentes de autenticación
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── components/        # Componentes reutilizables
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── QRScanner.jsx
│   ├── pages/            # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── Herramientas.jsx
│   │   ├── Controles.jsx
│   │   ├── Solicitudes.jsx
│   │   └── Admin.jsx
│   ├── lib/              # Configuraciones
│   │   └── supabase.js
│   ├── types/            # Tipos y constantes
│   │   └── db.js
│   ├── App.jsx           # Router principal
│   └── main.jsx          # Punto de entrada
├── public/
│   └── _redirects        # Configuración SPA para Netlify
├── .env                  # Variables de entorno (no commitear)
├── .env.example          # Plantilla de variables
└── package.json
```

## 🔐 Autenticación

La aplicación usa Supabase Auth con email/password. 

**Primer uso:**
1. Ir a `/register` y crear una cuenta
2. Verificar el email (si está configurado en Supabase)
3. Iniciar sesión en `/login`

## 📊 Base de Datos

### Tablas Principales

- **herramientas**: Catálogo de herramientas con estados
- **checklists**: Controles diarios y semanales
- **checklist_items**: Items individuales de cada checklist
- **solicitudes**: Solicitudes de cambio/nuevas herramientas
- **historial_herramienta**: Registro de cambios
- **notificaciones**: Alertas y recordatorios
- **calendario_laboral**: Días hábiles/no hábiles

### Zonas

- INSTALACIONES
- MANTENIMIENTO
- TALLER

### Tipos de Herramientas

- DE_MANO
- MAQUINA
- INSUMO

## 🚀 Deploy en Netlify

1. **Conectar repositorio a Netlify**
2. **Configurar build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Agregar variables de entorno:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy!**

El archivo `public/_redirects` ya está configurado para SPA routing.

## 🎨 Stack Tecnológico

- **Frontend**: React 19 + Vite
- **UI**: Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Router**: React Router DOM v7
- **Build**: Vite con SWC
- **Deploy**: Netlify

## 📝 Flujo de Trabajo

1. **Técnico** realiza controles diarios/semanales
2. **Técnico** puede solicitar cambios o nuevas herramientas
3. **Administrador** aprueba/rechaza solicitudes
4. Sistema registra todo en el historial
5. Notificaciones alertan sobre controles pendientes

## 🔜 Roadmap

- [ ] Scanner QR con cámara (jsqr)
- [ ] Exportación de reportes a PDF/Excel
- [ ] Gráficos y estadísticas avanzadas
- [ ] Notificaciones push
- [ ] App móvil (React Native)
- [ ] Modo offline

## 🐛 Solución de Problemas

**Error de CORS:**
- Verifica que las URLs de Supabase sean correctas
- Revisa las políticas RLS en Supabase

**Rutas 404:**
- Verifica que el archivo `_redirects` esté en `public/`
- En desarrollo, usa `npm run dev` (no `npm run preview`)

**Sesión no persiste:**
- Verifica cookies en el navegador
- Revisa configuración de Auth en Supabase

## 📄 Licencia

MIT

## 👥 Autor

SILS Team

---

**¿Necesitas ayuda?** Abre un issue en el repositorio.
