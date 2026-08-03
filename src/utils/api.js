// En producción (Vercel) las funciones /api/* están en el mismo dominio.
// En desarrollo local se usa el proxy de Vite hacia Express.
const BASE_URL = '';

export function authHeaders(includeContentType = true) {
  const headers = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  try {
    const session = JSON.parse(localStorage.getItem('ecg_session') || 'null');
    if (session?.sessionToken) headers['Authorization'] = `Bearer ${session.sessionToken}`;
  } catch { /* ignorar */ }
  return headers;
}

export async function apiLogin(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Error al iniciar sesión.');
    if (data.activeSessions) err.activeSessions = data.activeSessions;
    throw err;
  }
  return data.user;
}

export async function apiForgotPassword(email) {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al enviar el correo.');
  return data;
}

export async function apiResetPassword(token, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña.');
  return data;
}

// ── Tareas ─────────────────────────────────────────────────────────────────
export async function apiGetTareas() {
  const res = await fetch(`${BASE_URL}/api/tareas`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener tareas.');
  return data;
}

export async function apiCreateTarea(_userId, tarea) {
  const res = await fetch(`${BASE_URL}/api/tareas`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(tarea),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear tarea.');
  return data;
}

export async function apiUpdateTarea(_userId, tareaId, fields) {
  const res = await fetch(`${BASE_URL}/api/tareas/${tareaId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar tarea.');
  return data;
}

export async function apiDeleteTarea(_userId, tareaId) {
  const res = await fetch(`${BASE_URL}/api/tareas/${tareaId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar tarea.');
  return data;
}

// ── Contacto ────────────────────────────────────────────────────────────────
export async function apiSendContacto(nombre, correo, mensaje, empresa) {
  const res = await fetch(`${BASE_URL}/api/contacto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, mensaje, empresa }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al enviar el mensaje.');
  return data;
}

export async function apiGetMensajes() {
  const res = await fetch(`${BASE_URL}/api/contacto`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener mensajes.');
  return data;
}

export async function apiMarkMensajeLeido(id) {
  const res = await fetch(`${BASE_URL}/api/contacto/${id}`, {
    method: 'PATCH',
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al marcar como leído.');
  return data;
}

export async function apiDeleteMensaje(id) {
  const res = await fetch(`${BASE_URL}/api/contacto/${id}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar mensaje.');
  return data;
}

export async function apiRegister(name, email, password, extras = {}) {
  const res = await fetch(`${BASE_URL}/api/auth/register?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, ...extras }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrarse.');
  return data;
}

// ── Clientes ─────────────────────────────────────────────────────────────────
export async function apiGetClientes() {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=clientes`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener clientes.');
  return data.clientes;
}

export async function apiCreateCliente(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=clientes`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear cliente.');
  return data.cliente;
}

export async function apiUpdateCliente(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=clientes&id=${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar cliente.');
  return data.cliente;
}

export async function apiDeleteCliente(id) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=clientes&id=${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar cliente.');
  return data;
}

// ── Artículos catálogo ────────────────────────────────────────────────────────
export async function apiGetArticulos() {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=articulos`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener artículos.');
  return data.articulos;
}

export async function apiCreateArticulo(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=articulos`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear artículo.');
  return data.articulo;
}

export async function apiUpdateArticulo(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=articulos&id=${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar artículo.');
  return data.articulo;
}

export async function apiDeleteArticulo(id, tabla = 'articulos_catalogo') {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=articulos&id=${id}&tabla=${tabla}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar artículo.');
  return data;
}

// ── Herramientas catálogo ─────────────────────────────────────────────────────
export async function apiGetHerramientas() {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=herramientas`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener herramientas.');
  return data.herramientas;
}

export async function apiCreateHerramienta(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=herramientas`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear herramienta.');
  return data.herramienta;
}

export async function apiUpdateHerramienta(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=herramientas&id=${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar herramienta.');
  return data.herramienta;
}

export async function apiDeleteHerramienta(id) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=herramientas&id=${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar herramienta.');
  return data;
}

// ── Trabajos ──────────────────────────────────────────────────────────────────
export async function apiGetTrabajos() {
  const res = await fetch(`${BASE_URL}/api/trabajos`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener trabajos.');
  return data;
}

export async function apiCreateTrabajo(fields) {
  const res = await fetch(`${BASE_URL}/api/trabajos`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear trabajo.');
  return data;
}

export async function apiGetTrabajoByCodigo(codigo) {
  const res = await fetch(`${BASE_URL}/api/trabajos?codigo=${encodeURIComponent(codigo)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Código no encontrado.');
  return data;
}

// ── Cotizaciones ──────────────────────────────────────────────────────────────
export async function apiGetCotizaciones() {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=cotizaciones`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener cotizaciones.');
  return data.cotizaciones;
}

export async function apiCreateCotizacion(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=cotizaciones`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear cotización.');
  return data.cotizacion;
}

export async function apiUpdateCotizacion(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=cotizaciones&id=${id}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar cotización.');
  return data.cotizacion;
}

export async function apiDeleteCotizacion(id) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=cotizaciones&id=${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar cotización.');
  return data;
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export async function apiGetUsers() {
  const res = await fetch(`${BASE_URL}/api/users`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios.');
  return data.users;
}

export async function apiGetDeletedUsers() {
  const res = await fetch(`${BASE_URL}/api/users?deleted=true`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener usuarios eliminados.');
  return data.users;
}

export async function apiRestoreUser(id) {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al restaurar usuario.');
  return data;
}

export async function apiPermanentDeleteUser(id) {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ id, permanent: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario permanentemente.');
  return data;
}

// ── Perfil de Usuario ─────────────────────────────────────────────────────────
export async function apiGetProfile() {
  const res = await fetch(`${BASE_URL}/api/auth/get-profile?action=get-profile`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener perfil.');
  return data.profile;
}

export async function apiUpdateProfile(fields) {
  const res = await fetch(`${BASE_URL}/api/auth/update-profile?action=update-profile`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil.');
  return data;
}

export async function apiDeleteOwnAccount() {
  const res = await fetch(`${BASE_URL}/api/auth/delete-account?action=delete-account`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar cuenta.');
  return data;
}

export async function apiChangeOwnPassword(currentPassword, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/change-password?action=change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña.');
  return data;
}

export async function apiAdminChangePassword(targetUserId, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/change-password?action=change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ targetUserId, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al cambiar la contraseña.');
  return data;
}

// ── Gantt Proyectos ───────────────────────────────────────────────────────────
export async function apiGetGanttProyectos() {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-proyectos`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener proyectos.');
  return data.proyectos;
}

export async function apiCreateGanttProyecto(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-proyectos`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear proyecto.');
  return data.proyecto;
}

export async function apiUpdateGanttProyecto(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-proyectos&id=${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar proyecto.');
  return data.proyecto;
}

export async function apiDeleteGanttProyecto(id) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-proyectos&id=${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar proyecto.');
  return data;
}

// ── Gantt Tareas ──────────────────────────────────────────────────────────────
export async function apiGetGanttTareas(proyectoId) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-tareas&proyecto_id=${proyectoId}`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener tareas.');
  return data.tareas;
}

export async function apiCreateGanttTarea(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-tareas`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear tarea.');
  return data.tarea;
}

export async function apiUpdateGanttTarea(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-tareas&id=${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar tarea.');
  return data.tarea;
}

export async function apiDeleteGanttTarea(id) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=gantt-tareas&id=${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar tarea.');
  return data;
}

// ── Encuestas de Satisfacción ─────────────────────────────────────────────────
export async function apiEncuestaGetPreguntas() {
  const res = await fetch(`${BASE_URL}/api/encuesta/preguntas?all=1`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener preguntas.');
  return data.preguntas;
}

export async function apiEncuestaCreatePregunta(fields) {
  const res = await fetch(`${BASE_URL}/api/encuesta/preguntas`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear pregunta.');
  return data.pregunta;
}

export async function apiEncuestaUpdatePregunta(id, fields) {
  const res = await fetch(`${BASE_URL}/api/encuesta/preguntas/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar pregunta.');
  return data.pregunta;
}

export async function apiEncuestaDeletePregunta(id) {
  const res = await fetch(`${BASE_URL}/api/encuesta/preguntas/${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar pregunta.');
  return data;
}

export async function apiEncuestaGetCodigos() {
  const res = await fetch(`${BASE_URL}/api/encuesta/codigos`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener códigos.');
  return data.codigos;
}

export async function apiEncuestaCreateCodigo(fields) {
  const res = await fetch(`${BASE_URL}/api/encuesta/codigos`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al generar código.');
  return data.codigo;
}

export async function apiEncuestaDeleteCodigo(id) {
  const res = await fetch(`${BASE_URL}/api/encuesta/codigos/${id}`, {
    method: 'DELETE', headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar código.');
  return data;
}

export async function apiEncuestaValidar(codigo) {
  const res = await fetch(`${BASE_URL}/api/encuesta/validar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Código no válido.');
  return data;
}

export async function apiEncuestaResponderPublico() {
  const res = await fetch(`${BASE_URL}/api/encuesta/publico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar encuesta pública.');
  return data;
}

export async function apiEncuestaResponder(codigo_id, respuestas) {
  const res = await fetch(`${BASE_URL}/api/encuesta/responder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo_id, respuestas }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al enviar respuestas.');
  return data;
}

export async function apiEncuestaGetEstadisticas() {
  const res = await fetch(`${BASE_URL}/api/encuesta/estadisticas`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener estadísticas.');
  return data;
}

// ── Anuncios / Pop-ups ────────────────────────────────────────────────────────
// Nota: las llamadas van a /api/users?resource=anuncios para no superar
// el límite de 12 funciones serverless del plan Hobby de Vercel.

const ANUNCIOS_BASE = `${BASE_URL}/api/users?resource=anuncios`;

/** Lista todos los anuncios (requiere token, nivel >= 1) */
export async function apiGetAnuncios() {
  const res = await fetch(ANUNCIOS_BASE, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener anuncios.');
  return data.anuncios || [];
}

/** Lista anuncios activos y vigentes para un destino (público, sin token) */
export async function apiGetAnunciosPublicos(destino) {
  const url = destino
    ? `${ANUNCIOS_BASE}&destino=${encodeURIComponent(destino)}`
    : ANUNCIOS_BASE;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener anuncios.');
  return data.anuncios || [];
}

/** Crea un nuevo anuncio (nivel >= 1) */
export async function apiCreateAnuncio(anuncio) {
  const res = await fetch(ANUNCIOS_BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(anuncio),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear anuncio.');
  return data.anuncio;
}

/** Actualiza campos de un anuncio (nivel >= 1 para los propios, >= 2 para cualquiera) */
export async function apiUpdateAnuncio(id, updates) {
  const res = await fetch(`${ANUNCIOS_BASE}&id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar anuncio.');
  return data.anuncio;
}

/** Activa o desactiva un anuncio */
export async function apiToggleAnuncio(id, activo) {
  return apiUpdateAnuncio(id, { activo });
}

/** Elimina un anuncio (nivel >= 2) */
export async function apiDeleteAnuncio(id) {
  const res = await fetch(`${ANUNCIOS_BASE}&id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar anuncio.');
  return data;
}

// ── Reportes de Puesta a Tierra ──────────────────────────────────────────────
export async function apiGetReportesPuestaTierra() {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=reportes_puesta_tierra`, { headers: authHeaders(false) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener reportes de puesta a tierra.');
  return data.reportes;
}

export async function apiCreateReportePuestaTierra(fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=reportes_puesta_tierra`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear reporte de puesta a tierra.');
  return data.reporte;
}

export async function apiUpdateReportePuestaTierra(id, fields) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=reportes_puesta_tierra&id=${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar reporte de puesta a tierra.');
  return data.reporte;
}

export async function apiDeleteReportePuestaTierra(id) {
  const res = await fetch(`${BASE_URL}/api/catalogo?r=reportes_puesta_tierra&id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar reporte de puesta a tierra.');
  return data;
}
