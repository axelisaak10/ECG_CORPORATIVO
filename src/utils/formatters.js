export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateLong = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';

export const uid = () => Date.now() + Math.random().toString(36).slice(2);
