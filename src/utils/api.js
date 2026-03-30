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
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
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

export async function apiResetPassword(email, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña.');
  return data;
}

// ── Tickets ────────────────────────────────────────────────────────────────
export async function apiGetTickets() {
  const res = await fetch(`${BASE_URL}/api/tickets`, {
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener tickets.');
  return data;
}

export async function apiCreateTicket(_userId, ticket) {
  const res = await fetch(`${BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(ticket),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear ticket.');
  return data;
}

export async function apiUpdateTicket(_userId, ticketId, fields) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar ticket.');
  return data;
}

export async function apiDeleteTicket(_userId, ticketId) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
    method: 'DELETE',
    headers: authHeaders(false),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar ticket.');
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

export async function apiRegister(name, email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al registrarse.');
  return data;
}
