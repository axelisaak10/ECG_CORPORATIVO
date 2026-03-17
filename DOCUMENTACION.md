# Documentación — ECG Corporativo Portal

**Versión:** 1.0
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
├── index.html                    # Punto de entrada SPA
├── vite.config.js                # Config Vite + proxy API
├── vercel.json                   # Rewrites para SPA y API
├── package.json                  # Dependencias frontend
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
│   ├── index.js                  # Servidor Express
│   ├── .env                      # Variables de entorno (no se sube)
│   └── package.json
│
├── public/
│   └── assets/logos/
│       ├── Corporativo.png       # Logo principal / favicon
│       ├── Capacitacion.png
│       ├── Dictaminacion.png
│       └── centro.png
│
└── src/
    ├── main.jsx                  # Entry point React
    ├── App.jsx                   # Router principal + auth state
    │
    ├── components/
    │   ├── auth/
    │   │   ├── AuthModal.jsx     # Modal login / registro / recuperar
    │   │   ├── AdminDashboard.jsx# Panel admin (nivel >= 1)
    │   │   └── UserDashboard.jsx # Panel usuario (nivel 0)
    │   ├── admin/
    │   │   └── TicketsSection.jsx# Sistema de tickets Kanban
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
        ├── api.js                # Funciones fetch hacia /api/*
        └── formatters.js         # fmtDate, fmtDateLong, uid
```

---

## 4. Configuración del Entorno

### Requisitos

- Node.js 18+
- npm 9+
- Cuenta en Supabase

### Instalación local

```bash
# 1. Clonar e instalar frontend
npm install

# 2. Instalar backend
cd server && npm install && cd ..

# 3. Crear archivo de variables de entorno
cp server/.env.example server/.env
# Editar server/.env con las credenciales de Supabase

# 4. Levantar en modo desarrollo
npm run dev         # Frontend :5173
node server/index.js  # Backend :3001
```

### Variables de entorno locales (`server/.env`)

```env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
PORT=3001
```

---

## 5. Base de Datos (Supabase)

### Tabla: `Usuarios`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer | PK, auto-asignado |
| `Nombre Completo` | text[] (array) | Nombre del usuario (se usa `[0]`) |
| `Correo` | text | Email único |
| `Contraseña` | text | Contraseña en texto plano |
| `nivel` | integer | Nivel de acceso (0, 1 o 2) |

> **Nota de seguridad:** La contraseña se almacena actualmente en texto plano. Para producción se recomienda migrar a bcrypt o usar Supabase Auth.

---

## 6. API Endpoints

Todos los endpoints usan `Content-Type: application/json` y CORS abierto (`*`).

### Autenticación

#### `POST /api/auth/login`

Verifica credenciales y devuelve el usuario.

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

Actualiza la contraseña de un usuario existente.

**Request:**
```json
{ "email": "user@example.com", "newPassword": "nuevaPass123" }
```

**Response 200:**
```json
{ "message": "Contraseña actualizada correctamente." }
```

**Errores:** `400` campos vacíos o contraseña < 6 chars · `404` correo no encontrado

---

### Gestión de Usuarios (solo superadmin)

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

---

#### `PUT /api/users`

Actualiza el nivel de un usuario.

**Request:**
```json
{ "id": 3, "nivel": 1 }
```

**Response 200:** `{ "message": "Nivel actualizado." }`

---

#### `DELETE /api/users`

Elimina un usuario por ID.

**Request:**
```json
{ "id": 3 }
```

**Response 200:** `{ "message": "Usuario eliminado." }`

---

## 7. Frontend — Módulos y Componentes

### `App.jsx` — Router principal

Gestiona el estado global de autenticación con un hook `useAuth()` que lee/escribe en `localStorage.ecg_session`.

**Rutas definidas:**

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/` | `MainPortal` | Público |
| `/empresa/:id/:seccion` | `EmpresaView` | Público |
| `/empresa/:id` | Redirect a `inicio` | Público |
| `/admin` | `AdminDashboard` | `role === 'admin'` |
| `/usuario` | `UserDashboard` | Autenticado |
| `*` | Redirect a `/` | — |

---

### `AuthModal.jsx` — Modal de autenticación

Tres tabs:

| Tab | Descripción |
|-----|-------------|
| `login` | Email + contraseña → `apiLogin()` → guarda sesión → redirige |
| `register` | Nombre + email + contraseña + confirmar → `apiRegister()` |
| `recover` | Email + nueva contraseña + confirmar → `apiResetPassword()` |

---

### `AdminDashboard.jsx` — Panel de administración

Sidebar fijo con navegación. Las secciones disponibles dependen del `nivel`:

| Tab | nivel mínimo | Descripción |
|-----|:---:|-------------|
| Resumen | 1 | Estadísticas, empresas, usuarios |
| Cotizaciones | 1 | CRUD de cotizaciones con estados |
| Dictaminación | 1 | CRUD de dictámenes técnicos |
| Tickets | 1 | Kanban de tickets (ver sección 11) |
| Gestión de Usuarios | 2 | CRUD de usuarios vía API Supabase |

**Badge visual:**
- nivel 1 → icono `Shield`, texto azul "Administrador"
- nivel 2 → icono `Crown`, texto morado "Superadmin"

---

### `UserDashboard.jsx` — Panel de usuario

Acceso para usuarios con `nivel = 0`:
- Saludo personalizado con nombre del usuario
- Tarjetas de acceso rápido a las 3 empresas
- Perfil lateral con info de contacto

---

### Secciones de empresa

Cada empresa tiene 6 secciones accesibles por `/empresa/:id/:seccion`:

| Sección | Descripción |
|---------|-------------|
| `inicio` | Carrusel de imágenes + tarjetas de características |
| `nosotros` | Historia, Misión, Visión |
| `servicios` | Listado de servicios ofrecidos |
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
       │      │
       │      ├─ POST /api/auth/login
       │      ├─ OK → guarda en localStorage.ecg_session
       │      └─ Redirige: nivel >= 1 → /admin | nivel 0 → /usuario
       │
       ├─ Tab "Registrarse"
       │      │
       │      ├─ Valida: mín. 6 chars, contraseñas coinciden
       │      ├─ POST /api/auth/register
       │      └─ Muestra pantalla de éxito
       │
       └─ "¿Olvidaste tu contraseña?"
              │
              ├─ Ingresa email + nueva contraseña
              ├─ POST /api/auth/reset-password
              └─ Muestra pantalla de éxito → vuelve a login
```

### Cierre de sesión

```js
localStorage.removeItem('ecg_session');
setCurrentUser(null);
// Redirige a /
```

---

## 9. Roles y Permisos

| `nivel` | Rol | Acceso |
|:-------:|-----|--------|
| 0 | usuario | Portal público + `/usuario` |
| 1 | admin | Todo lo anterior + `/admin` (Resumen, Cotizaciones, Dictaminación, Tickets) |
| 2 | superadmin | Todo lo anterior + Gestión de Usuarios |

### Permisos en Tickets (según nivel)

| Permiso | nivel 0 | nivel 1 | nivel 2 |
|---------|:-------:|:-------:|:-------:|
| Ver tickets | — | ✓ | ✓ |
| Ver todos | — | ✓ | ✓ |
| Crear | — | ✓ | ✓ |
| Editar | — | ✓ | ✓ |
| Cambiar estado | — | ✓ | ✓ |
| Eliminar | — | — | ✓ |

> Los usuarios con nivel 0 no tienen acceso al panel de administración ni al módulo de tickets.

---

## 10. Panel de Administración

### Cotizaciones

Datos guardados en `localStorage` bajo la clave `ecg_cotizaciones`.

**Campos del formulario:**

| Campo | Tipo | Opciones |
|-------|------|---------|
| Cliente | texto | — |
| Empresa ECG | select | Las 3 empresas |
| Servicio cotizado | texto | — |
| Monto estimado | número | — |
| Estado | select | Pendiente / Aprobada / Rechazada |
| Notas | textarea | — |

---

### Dictaminación

Datos guardados en `ecg_dictamenes`.

**Campos del formulario:**

| Campo | Tipo | Opciones |
|-------|------|---------|
| Cliente | texto | — |
| Empresa ECG | select | Las 3 empresas |
| Tipo de dictamen | select | 7 tipos técnicos |
| Folio / Referencia | texto | — |
| Estado | select | En proceso / Completado / Rechazado |
| Descripción | textarea | — |
| Resultado / Conclusión | textarea | — |

---

### Gestión de Usuarios (nivel 2)

Consumo directo de la API:
- Tabla con todos los usuarios de Supabase
- Selector de nivel (0 / 1 / 2) por usuario
- Eliminar usuario (con confirmación)
- No se puede modificar el propio perfil

---

## 11. Sistema de Tickets

Componente: `src/components/admin/TicketsSection.jsx`
Storage: `localStorage` → clave `ecg_tickets`

### Estados (columnas Kanban)

| Estado | Color | Descripción |
|--------|-------|-------------|
| `pendiente` | Gris | Creado, sin atender |
| `en-progreso` | Azul | En desarrollo |
| `revision` | Amarillo | Pendiente de revisión |
| `hecho` | Verde | Completado |
| `bloqueado` | Rojo | Bloqueado por impedimento |

### Niveles de prioridad

| Prioridad | Color |
|-----------|-------|
| Crítica | Rojo |
| Urgente | Naranja |
| Alta | Amarillo |
| Media | Azul |
| Baja | Verde |
| Mínima | Gris |
| Ninguna | Gris claro |

### Grupos disponibles

`IT` · `Marketing` · `Redes` · `Sistemas` · `Desarrollo` · `Soporte`

### Vistas

- **Kanban:** Columnas drag & drop. Arrastrar una tarjeta cambia su estado y registra el cambio en el historial.
- **Lista:** Tabla con filtros por prioridad, estado y grupo.

### Filtros rápidos

| Filtro | Descripción |
|--------|-------------|
| Todos | Todos los tickets visibles |
| Mis tickets | Solo los asignados al usuario actual |
| Sin asignar | `asignadoA` vacío |
| Alta prioridad | critica / urgente / alta |

### Estructura de un ticket

```json
{
  "id": 1,
  "titulo": "Error en módulo de pagos",
  "descripcion": "Descripción detallada...",
  "estado": "pendiente",
  "grupo": "Desarrollo",
  "asignadoA": "user@ecg.com",
  "creadoPor": "admin@ecg.com",
  "prioridad": "critica",
  "fechaCreacion": "2024-03-01T00:00:00.000Z",
  "fechaLimite": "2024-03-15T00:00:00.000Z",
  "comentarios": [
    { "id": 1, "author": "admin@ecg.com", "text": "Revisión urgente", "fecha": "..." }
  ],
  "historial": [
    { "id": 1, "author": "admin@ecg.com", "action": "Ticket creado", "fecha": "..." }
  ]
}
```

---

## 12. Empresas del Portal

### Centro de Capacitación ECG (ID: 1)

- **Logo:** `/assets/logos/Capacitacion.png`
- **Contacto:** 5214427734562 · centroecging@gmail.com
- **Director:** Ing. Juan Erasmo Cuaya G.
- **Servicios:** SGA, Seguridad e Higiene, Desarrollo Organizacional, Mantenimiento, Electricidad, Código RED
- **Diferenciadores:** +20 años de experiencia, certificaciones NOM, confidencialidad

### Dictaminación y Gestoría ECG — JECG (ID: 2)

- **Logo:** `/assets/logos/Dictaminacion.png`
- **Servicios:** Cambio de tarifa, Corrección de factor de potencia, Motores eficientes, Estudios de calidad de energía, Cogeneración, Apoyo DAP legal
- **Diferenciadores:** Reducción de costos hasta 40%, sustentabilidad, innovación

### Centro de Ingeniería y Abastecimiento ECG (ID: 3)

- **Logo:** `/assets/logos/centro.png`
- **Servicios:** Diseño de subestaciones, Optimización de layouts, Energía industrial integral, Soldadura especializada, Mobiliario industrial, Construcción de bodegas
- **Diferenciadores:** Experiencia, precisión, confiabilidad

---

## 13. Persistencia de Datos

### localStorage (frontend)

| Clave | Contenido |
|-------|-----------|
| `ecg_session` | Objeto usuario con `{ id, name, email, role, nivel }` |
| `ecg_cotizaciones` | Array de cotizaciones |
| `ecg_dictamenes` | Array de dictámenes |
| `ecg_tickets` | Array de tickets |

> Los datos de cotizaciones, dictámenes y tickets son locales al navegador. No se sincronizan entre dispositivos.

### Supabase (backend)

| Tabla | Datos persistidos |
|-------|------------------|
| `Usuarios` | Todos los usuarios, credenciales y niveles |

---

## 14. Despliegue

### Vercel (producción)

El proyecto se despliega automáticamente en cada push a `main`.

**`vercel.json`:**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)",     "destination": "/index.html" }
  ]
}
```

- Las rutas `/api/*` se resuelven como Vercel Serverless Functions desde `api/`
- Todas las demás rutas sirven `index.html` (SPA routing)

**Variables de entorno en Vercel (Settings → Environment Variables):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (marcar como Sensitive)

> Después de agregar o cambiar variables, hacer **Redeploy** desde el panel de Vercel para que tomen efecto.

---

## 15. Variables de Entorno

### Producción (Vercel)

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Service role key (acceso total, sin RLS) |

### Desarrollo local (`server/.env`)

```env
SUPABASE_URL=https://pstookpmuzfmtjdztzdl.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
PORT=3001
```

---

## Apéndice — Comandos útiles

```bash
# Desarrollo
npm run dev                  # Frontend en :5173
node server/index.js         # Backend en :3001

# Build de producción
npm run build                # Genera /dist

# Git
git add .
git commit -m "mensaje"
git push origin main         # Dispara deploy en Vercel
```

---

*Documentación generada para el proyecto ECG Corporativo — Marzo 2026*
