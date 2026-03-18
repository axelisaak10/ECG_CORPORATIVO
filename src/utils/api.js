// En producción (Vercel) las funciones /api/* están en el mismo dominio.
// En desarrollo local se usa el proxy de Vite hacia Express.
const BASE_URL = '';

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
export async function apiGetTickets(userId) {
  const res = await fetch(`${BASE_URL}/api/tickets?userId=${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener tickets.');
  return data;
}

export async function apiCreateTicket(userId, ticket) {
  const res = await fetch(`${BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...ticket }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear ticket.');
  return data;
}

export async function apiUpdateTicket(userId, ticketId, fields) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar ticket.');
  return data;
}

export async function apiDeleteTicket(userId, ticketId) {
  const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar ticket.');
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
