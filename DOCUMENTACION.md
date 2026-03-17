# Documentación — ECG Corporativo Portal

**Versión:** 1.2
**Fecha:** Marzo 2026
**Stack:** React 18 + Vite · Express.js · Supabase · Vercel

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura](#2-arquitectura)
3. [Estructura de Directorios](#3-estructura-de-directorios)
4. [Configuración del Entorno](#4-configuración-del-entorno)
5. [Base de Datos (Supabase)](#5-base-de-datos-supabase)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend — Módulos y Componentes](#7-frontend--módulos-y-componentes)
8. [Sistema de Autenticación](#8-sistema-de-autenticación)
9. [Roles y Permisos](#9-roles-y-permisos)
10. [Panel de Administración](#10-panel-de-administración)
11. [Sistema de Tickets](#11-sistema-de-tickets)
12. [Empresas del Portal](#12-empresas-del-portal)
13. [Persistencia de Datos](#13-persistencia-de-datos)
14. [Despliegue](#14-despliegue)
15. [Variables de Entorno](#15-variables-de-entorno)
16. [Historial de Cambios](#16-historial-de-cambios)

---

## 1. Descripción General

**ECG Corporativo** es un portal empresarial multi-compañía que agrupa tres empresas del grupo ECG bajo una misma plataforma web. Permite a visitantes conocer los servicios de cada empresa y a usuarios registrados acceder a herramientas internas según su nivel de acceso.

### Empresas incluidas

| # | Empresa | Enfoque |
|---|---------|---------|
| 1 | Centro de Capacitación ECG | Capacitación industrial y laboral |
| 2 | Dictaminación y Gestoría ECG (JECG) | Eficiencia energética y gestoría |
| 3 | Centro de Ingeniería y Abastecimiento ECG | Ingeniería industrial y soluciones |

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                │
│            React 18 SPA  —  Vite / Tailwind         │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / HTTPS
          ┌──────────┴──────────┐
          │     Vercel CDN      │
          │  (frontend estático)│
          └──────────┬──────────┘
                     │
          ┌──────────┴──────────┐
          │  Vercel Serverless  │  ← /api/*
          │  Functions (Node.js)│
          └──────────┬──────────┘
                     │ @supabase/supabase-js
          ┌──────────┴──────────┐
          │   Supabase (Postgres)│
          │   Tabla: Usuarios   │
          └─────────────────────┘
```

**Desarrollo local:**
- Frontend: `npm run dev` → puerto 5173
- Backend: `node server/index.js` → puerto 3001
- Vite proxea `/api/*` → `localhost:3001`

---

## 3. Estructura de Directorios

```
ECG_CORPORATIVO/
├── index.html                    # Punto de entrada SPA (favicon: Corporativo.png)
├── vite.config.js                # Config Vite + proxy API
├── vercel.json                   # Rewrites para SPA y API
├── package.json                  # Dependencias frontend
├── DOCUMENTACION.md              # Este archivo
│
├── api/                          # Vercel Serverless Functions
│   ├── package.json              # { "type": "commonjs" }
│   ├── users.js                  # GET/PUT/DELETE /api/users
│   └── auth/
│       ├── login.js              # POST /api/auth/login
│       ├── register.js           # POST /api/auth/register
│       └── reset-password.js     # POST /api/auth/reset-password
│
├── server/                       # Backend Express (dev local)
│   ├── index.js                  # Servidor Express + rutas equivalentes a /api
│   ├── .env                      # Variables de entorno (no se sube a git)
│   └── package.json
│
├── public/
│   └── assets/logos/
│       ├── Corporativo.png       # Logo principal — usado también como favicon
│       ├── Corporativo1.png      # Variante del logo
│       ├── Capacitacion.png
│       ├── Dictaminacion.png
│       └── centro.png
│
└── src/
    ├── main.jsx                  # Entry point React
    ├── App.jsx                   # Router principal + hook useAuth
    │
    ├── components/
    │   ├── auth/
    │   │   ├── AuthModal.jsx     # Modal login / registro / recuperar contraseña
    │   │   ├── AdminDashboard.jsx# Panel admin (nivel >= 1) con sidebar
    │   │   └── UserDashboard.jsx # Panel usuario (nivel 0)
    │   ├── admin/
    │   │   └── TicketsSection.jsx# Sistema de tickets Kanban (nivel >= 1)
    │   ├── layout/
    │   │   ├── Header.jsx
    │   │   ├── HamburgerMenu.jsx
    │   │   ├── CompanySelector.jsx
    │   │   └── MainPortal.jsx
    │   ├── sections/
    │   │   ├── InicioSection.jsx
    │   │   ├── NosotrosSection.jsx
    │   │   ├── ServiciosSection.jsx
    │   │   ├── MiembrosSection.jsx
    │   │   ├── PoliticasSection.jsx
    │   │   └── ContactoSection.jsx
    │   └── shared/
    │       ├── Chatbot.jsx
    │       ├── WhatsAppButton.jsx
    │       ├── ImageGalleryModal.jsx
    │       └── SocialMediaButtons.jsx
    │
    ├── data/
    │   ├── companies.js          # Datos completos de las 3 empresas
    │   ├── navItems.js           # Ítems de navegación
    │   ├── politicas.js          # Políticas corporativas
    │   └── features.js           # Características destacadas
    │
    └── utils/
        ├── api.js                # apiLogin · apiRegister · apiResetPassword
        └── formatters.js         # fmtDate · fmtDateLong · uid
```

---

## 4. Configuración del Entorno

### Requisitos

- Node.js 18+
- npm 9+
- Cuenta en Supabase

### Instalación local

```bash
# 1. Instalar dependencias del frontend
npm install

# 2. Instalar dependencias del backend
cd server && npm install && cd ..

# 3. Configurar variables de entorno
# Crear server/.env con el contenido indicado en la sección 15

# 4. Levantar en modo desarrollo
npm run dev            # Frontend en :5173
node server/index.js   # Backend en :3001
```

---

## 5. Base de Datos (Supabase)

### Tabla: `Usuarios`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer | PK, asignado manualmente (max + 1) |
| `Nombre Completo` | text[] | Array de texto — se usa el índice `[0]` |
| `Correo` | text | Email único del usuario |
| `Contraseña` | text | Contraseña en texto plano |
| `nivel` | integer | Nivel de acceso: `0`, `1` o `2` |

> **Nota de seguridad:** La contraseña se almacena en texto plano. Para producción se recomienda migrar a bcrypt o usar Supabase Auth nativo.

---

## 6. API Endpoints

Todos los endpoints usan `Content-Type: application/json` y CORS abierto (`*`).
Las funciones en `api/` son Vercel Serverless (CommonJS). El servidor Express en `server/index.js` replica los mismos endpoints para desarrollo local.

---

### Autenticación

#### `POST /api/auth/login`

Verifica credenciales y devuelve el usuario autenticado.

**Request:**
```json
{ "email": "user@example.com", "password": "Camila2021" }
```

**Response 200:**
```json
{
  "user": {
    "id": 1,
    "name": "Nombre Apellido",
    "email": "user@example.com",
    "role": "admin",
    "nivel": 1
  }
}
```

**Lógica de `role`:** `nivel >= 1` → `"admin"` · `nivel = 0` → `"user"`

**Errores:** `400` campos vacíos · `401` credenciales incorrectas · `500` env no configuradas

---

#### `POST /api/auth/register`

Crea un nuevo usuario con `nivel = 0`.

**Request:**
```json
{ "name": "Nombre", "email": "user@example.com", "password": "123456" }
```

**Response 201:**
```json
{ "message": "Cuenta creada exitosamente." }
```

**Errores:** `400` campos vacíos · `409` correo ya registrado · `500` error BD

---

#### `POST /api/auth/reset-password`

Restablece la contraseña de un usuario existente (sin verificación por email).

**Request:**
```json
{ "email": "user@example.com", "newPassword": "nuevaPass123" }
```

**Validaciones:** contraseña mínimo 6 caracteres.

**Response 200:**
```json
{ "message": "Contraseña actualizada correctamente." }
```

**Errores:** `400` campos vacíos / contraseña < 6 chars · `404` correo no encontrado

---

### Gestión de Usuarios

> Pensado para uso exclusivo desde el panel de Superadmin (nivel 2). No hay validación de autorización en el endpoint — la restricción es solo a nivel de UI.

#### `GET /api/users`

Devuelve todos los usuarios del sistema.

**Response 200:**
```json
{
  "users": [
    { "id": 1, "name": "Admin", "email": "admin@ecg.com", "nivel": 2, "role": "superadmin" }
  ]
}
```

**Mapeo de `role`:** `nivel >= 2` → `"superadmin"` · `nivel = 1` → `"admin"` · `nivel = 0` → `"user"`

---

#### `PUT /api/users`

Actualiza el nivel de acceso de un usuario.

**Request:**
```json
{ "id": 3, "nivel": 1 }
```

**Response 200:** `{ "message": "Nivel actualizado." }`

---

#### `DELETE /api/users`

Elimina permanentemente un usuario.

**Request:**
```json
{ "id": 3 }
```

**Response 200:** `{ "message": "Usuario eliminado." }`

---

## 7. Frontend — Módulos y Componentes

### `App.jsx` — Router principal

Gestiona el estado global de autenticación con el hook `useAuth()` que persiste la sesión en `localStorage.ecg_session`.

**Rutas definidas:**

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | `MainPortal` | Público |
| `/empresa/:id/:seccion` | `EmpresaView` | Público |
| `/empresa/:id` | Redirect a `inicio` | Público |
| `/admin` | `AdminDashboard` | `role === 'admin'` (nivel >= 1) |
| `/usuario` | `UserDashboard` | Autenticado (nivel 0) |
| `*` | Redirect a `/` | — |

---

### `AuthModal.jsx` — Modal de autenticación

Tres tabs/flujos:

| Tab | Descripción |
|-----|-------------|
| `login` | Email + contraseña → `apiLogin()` → sesión → redirige según nivel |
| `register` | Nombre + email + contraseña (mín. 6) + confirmar → `apiRegister()` |
| `recover` | Email + nueva contraseña + confirmar → `apiResetPassword()` |

Al iniciar sesión: `nivel >= 1` → `/admin` · `nivel 0` → `/usuario`

---

### `AdminDashboard.jsx` — Panel de administración

Sidebar fijo a la izquierda (260 px). Las secciones disponibles dependen del `nivel`:

| Tab | `id` | Nivel mínimo | Descripción |
|-----|------|:---:|-------------|
| Resumen | `resumen` | 1 | Estadísticas generales, empresas, tabla de usuarios |
| Cotizaciones | `cotizaciones` | 1 | CRUD de cotizaciones con estados |
| Dictaminación | `dictaminacion` | 1 | CRUD de dictámenes técnicos |
| Tickets | `tickets` | 1 | Sistema Kanban de tickets |
| Gestión de Usuarios | `usuarios` | 2 | CRUD de usuarios vía API Supabase |

**Badge visual en sidebar:**
- nivel 1 → icono `Shield` azul · etiqueta "Administrador"
- nivel 2 → icono `Crown` morado · etiqueta "Superadmin"

---

### `TicketsSection.jsx` — Sistema de tickets

Ver sección 11 para detalle completo.
Accesible desde el tab `tickets` del AdminDashboard. Solo visible para nivel >= 1.

---

### `UserDashboard.jsx` — Panel de usuario

Acceso para usuarios con `nivel = 0`:
- Saludo personalizado con nombre del usuario
- Tarjetas de acceso rápido a las 3 empresas
- Perfil lateral con info de contacto

---

### Secciones de empresa

Accesibles por `/empresa/:id/:seccion`:

| `seccion` | Descripción |
|-----------|-------------|
| `inicio` | Carrusel de imágenes + tarjetas de características |
| `nosotros` | Historia, Misión, Visión |
| `servicios` | Listado de servicios |
| `miembros` | Equipo de trabajo |
| `politicas` | Políticas corporativas |
| `contacto` | Teléfono, email, WhatsApp |

---

## 8. Sistema de Autenticación

### Flujo completo

```
Usuario abre AuthModal
       │
       ├─ Tab "Ingresar"
       │      ├─ POST /api/auth/login
       │      ├─ OK → guarda en localStorage.ecg_session
       │      └─ Redirige: nivel >= 1 → /admin  |  nivel 0 → /usuario
       │
       ├─ Tab "Registrarse"
       │      ├─ Valida: mín. 6 chars, contraseñas coinciden
       │      ├─ POST /api/auth/register
       │      └─ Pantalla de éxito → vuelve a login
       │
       └─ "¿Olvidaste tu contraseña?"
              ├─ Email + nueva contraseña + confirmar
              ├─ POST /api/auth/reset-password
              └─ Pantalla de éxito → vuelve a login
```

### Cierre de sesión

```js
localStorage.removeItem('ecg_session');
setCurrentUser(null);
// Redirige a /
```

---

## 9. Roles y Permisos

### Niveles de acceso

| `nivel` | Rol | Ruta de acceso |
|:-------:|-----|----------------|
| 0 | usuario | Portal público + `/usuario` |
| 1 | admin | Todo lo anterior + `/admin` |
| 2 | superadmin | Todo lo anterior + Gestión de Usuarios |

### Permisos por módulo

#### Tickets

| Permiso | nivel 0 | nivel 1 | nivel 2 |
|---------|:-------:|:-------:|:-------:|
| Ver tickets | — | ✓ | ✓ |
| Ver todos los tickets | — | ✓ | ✓ |
| Crear ticket | — | ✓ | ✓ |
| Editar ticket | — | ✓ | ✓ |
| Cambiar estado (drag & drop) | — | ✓ | ✓ |
| Eliminar ticket | — | — | ✓ |

> Los usuarios nivel 0 no tienen acceso al panel `/admin` y por tanto nunca ven el módulo de tickets.

#### Gestión de Usuarios

| Permiso | nivel 0 | nivel 1 | nivel 2 |
|---------|:-------:|:-------:|:-------:|
| Ver usuarios | — | — | ✓ |
| Cambiar nivel de usuario | — | — | ✓ |
| Eliminar usuario | — | — | ✓ |

---

## 10. Panel de Administración

### Resumen

Muestra tres tarjetas estadísticas:
- Total de usuarios registrados
- Total de empresas en el portal
- Total de cotizaciones

También incluye una lista de las empresas activas y una tabla de usuarios registrados (con opción de eliminar para nivel >= 1).

---

### Cotizaciones

Storage: `localStorage` → clave `ecg_cotizaciones`

**Campos:**

| Campo | Tipo | Opciones |
|-------|------|---------|
| Cliente | texto | — |
| Empresa ECG | select | Las 3 empresas |
| Servicio cotizado | texto | — |
| Monto estimado | número | — |
| Estado | select | Pendiente / Aprobada / Rechazada |
| Notas | textarea | — |

**Estados:**

| Estado | Badge |
|--------|-------|
| Pendiente | Amarillo |
| Aprobada | Verde |
| Rechazada | Rojo |

---

### Dictaminación

Storage: `localStorage` → clave `ecg_dictamenes`

**Campos:**

| Campo | Tipo | Opciones |
|-------|------|---------|
| Cliente | texto | — |
| Empresa ECG | select | Las 3 empresas |
| Tipo de dictamen | select | Gestión Ambiental · Seguridad e Higiene · Instalación Eléctrica · Eficiencia Energética · Calidad de Energía · Cumplimiento NOM · Otro |
| Folio / Referencia | texto | — |
| Estado | select | En proceso / Completado / Rechazado |
| Descripción | textarea | — |
| Resultado / Conclusión | textarea | — |

---

### Gestión de Usuarios (nivel 2)

Consume la API `/api/users`:
- Lista todos los usuarios de Supabase con nombre, correo y nivel actual
- Cambia el nivel de cualquier usuario con un selector (0 / 1 / 2)
- Elimina usuarios con confirmación
- El propio usuario no puede modificar su perfil ni eliminarse

---

## 11. Sistema de Tickets

**Componente:** `src/components/admin/TicketsSection.jsx`
**Storage:** `localStorage` → clave `ecg_tickets`
**Acceso:** nivel >= 1 (admin y superadmin únicamente)

### Estados Kanban

| Estado | Color | Descripción |
|--------|-------|-------------|
| `pendiente` | Gris (#94a3b8) | Creado, sin atender |
| `en-progreso` | Azul (#3b82f6) | En desarrollo activo |
| `revision` | Amarillo (#f59e0b) | Pendiente de revisión |
| `hecho` | Verde (#10b981) | Completado |
| `bloqueado` | Rojo (#ef4444) | Bloqueado por impedimento |

### Prioridades

| Prioridad | Color |
|-----------|-------|
| Crítica | Rojo (#dc2626) |
| Urgente | Naranja (#ea580c) |
| Alta | Amarillo (#f59e0b) |
| Media | Azul (#3b82f6) |
| Baja | Verde (#10b981) |
| Mínima | Gris (#6b7280) |
| Ninguna | Gris claro (#d1d5db) |

### Grupos disponibles

`IT` · `Marketing` · `Redes` · `Sistemas` · `Desarrollo` · `Soporte`

### Vistas

| Vista | Descripción |
|-------|-------------|
| **Kanban** | 5 columnas con drag & drop. Mover una tarjeta cambia el estado y lo registra en el historial automáticamente. |
| **Lista** | Tabla con todas las columnas. Incluye acciones de ver, editar y eliminar (según permisos). |

### Filtros rápidos

| Filtro | Lógica |
|--------|--------|
| Todos | Sin filtro adicional |
| Mis tickets | `asignadoA === currentUser.email` |
| Sin asignar | `asignadoA` vacío |
| Alta prioridad | prioridad ∈ {critica, urgente, alta} |

También hay un selector por **grupo** (`IT`, `Marketing`, etc.).

### Panel de detalle

Al hacer clic en una tarjeta se abre un panel lateral (460 px) con:
- Título, prioridad y estado en el encabezado
- Descripción completa
- Metadatos: asignado a, creado por, fecha de creación, fecha límite
- Sección de comentarios (agregar con Enter o botón)
- Historial cronológico de cambios

### Estructura de un ticket

```json
{
  "id": 1733000000000,
  "titulo": "Error en módulo de pagos",
  "descripcion": "Descripción detallada...",
  "estado": "pendiente",
  "grupo": "Desarrollo",
  "asignadoA": "admin@ecg.com",
  "creadoPor": "admin@ecg.com",
  "prioridad": "critica",
  "fechaCreacion": "2024-03-01T00:00:00.000Z",
  "fechaLimite": "2024-03-15",
  "comentarios": [
    { "id": 100, "author": "admin@ecg.com", "text": "Revisión urgente.", "fecha": "2024-03-01T..." }
  ],
  "historial": [
    { "id": 200, "author": "admin@ecg.com", "action": "Ticket creado con estado \"pendiente\"", "fecha": "2024-03-01T..." }
  ]
}
```

---

## 12. Empresas del Portal

### Centro de Capacitación ECG (ID: 1)

- **Logo:** `/assets/logos/Capacitacion.png`
- **Contacto:** +52 1 442 773 4562 · centroecging@gmail.com
- **Director:** Ing. Juan Erasmo Cuaya G.
- **Servicios:** SGA · Seguridad e Higiene · Desarrollo Organizacional · Mantenimiento · Electricidad · Código RED
- **Diferenciadores:** +20 años de experiencia · Certificaciones NOM · Confidencialidad garantizada

---

### Dictaminación y Gestoría ECG — JECG (ID: 2)

- **Logo:** `/assets/logos/Dictaminacion.png`
- **Servicios:** Cambio de tarifa · Corrección de factor de potencia · Motores eficientes · Estudios de calidad de energía · Cogeneración · Apoyo DAP legal
- **Diferenciadores:** Reducción de costos hasta 40% · Sustentabilidad · Innovación

---

### Centro de Ingeniería y Abastecimiento ECG (ID: 3)

- **Logo:** `/assets/logos/centro.png`
- **Servicios:** Diseño de subestaciones · Optimización de layouts · Energía industrial integral · Soldadura especializada · Mobiliario industrial · Construcción de bodegas
- **Diferenciadores:** Experiencia · Precisión · Confiabilidad

---

## 13. Persistencia de Datos

### localStorage (por dispositivo, no sincronizado)

| Clave | Tipo | Contenido |
|-------|------|-----------|
| `ecg_session` | objeto | `{ id, name, email, role, nivel }` del usuario activo |
| `ecg_cotizaciones` | array | Lista de cotizaciones |
| `ecg_dictamenes` | array | Lista de dictámenes |
| `ecg_tickets` | array | Lista de tickets con comentarios e historial |

> Los datos de cotizaciones, dictámenes y tickets se guardan solo en el navegador local. No se comparten entre dispositivos ni usuarios.

### Supabase (persistencia centralizada)

| Tabla | Datos |
|-------|-------|
| `Usuarios` | Usuarios registrados, contraseñas y niveles de acceso |

---

## 14. Despliegue

### Vercel

El proyecto se despliega automáticamente en cada push a la rama `main`.

**`vercel.json`:**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)",     "destination": "/index.html" }
  ]
}
```

- `/api/*` → Vercel Serverless Functions (directorio `api/`)
- Todo lo demás → `index.html` (SPA routing con React Router)

**Después de agregar o cambiar variables de entorno** en Vercel hay que hacer **Redeploy** manual para que tomen efecto.

---

## 15. Variables de Entorno

### Producción (Vercel → Settings → Environment Variables)

| Variable | Descripción | Marcar como |
|----------|-------------|:-----------:|
| `SUPABASE_URL` | URL del proyecto Supabase (`https://xxxx.supabase.co`) | — |
| `SUPABASE_SERVICE_KEY` | Service role key (acceso sin RLS) | Sensitive |

### Desarrollo local (`server/.env`)

```env
SUPABASE_URL=https://pstookpmuzfmtjdztzdl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
PORT=3001
```

---

## Apéndice A — Comandos útiles

```bash
# Desarrollo
npm run dev                    # Frontend en http://localhost:5173
node server/index.js           # Backend en http://localhost:3001

# Build de producción
npm run build                  # Genera /dist listo para Vercel

# Git / despliegue
git add .
git commit -m "descripción"
git push origin main           # Dispara deploy automático en Vercel
```

---

## 16. Historial de Cambios

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 1.0 | Mar 2026 | Versión inicial del portal con login, registro y panel admin |
| 1.1 | Mar 2026 | Añadido nivel 2 (superadmin) con gestión de usuarios vía API |
| 1.1 | Mar 2026 | Añadida función de recuperar contraseña en el login |
| 1.1 | Mar 2026 | Funciones Vercel migradas a CommonJS (`api/package.json`) |
| 1.2 | Mar 2026 | Añadido sistema de tickets Kanban (solo admin y superadmin) |
| 1.2 | Mar 2026 | Favicon actualizado con logo `Corporativo.png` |
| 1.2 | Mar 2026 | Acceso a tickets restringido a nivel >= 1 (usuarios nivel 0 excluidos) |

---

*ECG Corporativo — Documentación técnica interna*
