import React, { useState, useMemo } from 'react';
import {
  Plus, X, Eye, Trash2, Edit2, MessageSquare, Clock,
  LayoutGrid, List, AlertTriangle, CheckCircle2, Ban,
  Loader2, Circle, History,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
export const PRIORITIES = [
  { value: 'critica',  label: 'Crítica',  color: '#dc2626', bg: '#fef2f2' },
  { value: 'urgente',  label: 'Urgente',  color: '#ea580c', bg: '#fff7ed' },
  { value: 'alta',     label: 'Alta',     color: '#f59e0b', bg: '#fffbeb' },
  { value: 'media',    label: 'Media',    color: '#3b82f6', bg: '#eff6ff' },
  { value: 'baja',     label: 'Baja',     color: '#10b981', bg: '#f0fdf4' },
  { value: 'minima',   label: 'Mínima',   color: '#6b7280', bg: '#f9fafb' },
  { value: 'ninguna',  label: 'Ninguna',  color: '#d1d5db', bg: '#f3f4f6' },
];

export const KANBAN_COLS = [
  { value: 'pendiente',   label: 'Pendiente',   color: '#94a3b8', Icon: Circle       },
  { value: 'en-progreso', label: 'En Progreso', color: '#3b82f6', Icon: Loader2      },
  { value: 'revision',    label: 'Revisión',    color: '#f59e0b', Icon: Eye          },
  { value: 'hecho',       label: 'Hecho',       color: '#10b981', Icon: CheckCircle2 },
  { value: 'bloqueado',   label: 'Bloqueado',   color: '#ef4444', Icon: Ban          },
];

export const GRUPOS = ['IT', 'Marketing', 'Redes', 'Sistemas', 'Desarrollo', 'Soporte'];

const STORAGE_KEY = 'ecg_tickets';
let _histId = 200;
let _cmtId  = 100;

const SEED = [
  {
    id: 1, titulo: 'Error en módulo de pagos',
    descripcion: 'Los pagos con tarjeta fallan al procesar el cargo. Se requiere revisión urgente del gateway.',
    estado: 'pendiente', grupo: 'Desarrollo', asignadoA: '', creadoPor: 'admin',
    prioridad: 'critica', fechaCreacion: '2024-03-01', fechaLimite: '2024-03-15',
    comentarios: [{ id: 1, author: 'admin', text: 'Revisión urgente requerida.', fecha: '2024-03-01' }],
    historial:   [{ id: 1, author: 'admin', action: 'Ticket creado con estado "pendiente"', fecha: '2024-03-01' }],
  },
  {
    id: 2, titulo: 'Actualización de base de datos',
    descripcion: 'Migración de esquema para soporte de nuevas entidades. Incluye scripts de rollback.',
    estado: 'en-progreso', grupo: 'Soporte', asignadoA: '', creadoPor: 'admin',
    prioridad: 'alta', fechaCreacion: '2024-03-02', fechaLimite: '2024-03-20',
    comentarios: [], historial: [{ id: 2, author: 'admin', action: 'Ticket creado', fecha: '2024-03-02' }],
  },
  {
    id: 3, titulo: 'Fallo en servidor de correo',
    descripcion: 'El servicio SMTP no envía notificaciones desde las 14:00.',
    estado: 'revision', grupo: 'Soporte', asignadoA: '', creadoPor: 'admin',
    prioridad: 'urgente', fechaCreacion: '2024-03-03', fechaLimite: '2024-03-10',
    comentarios: [], historial: [{ id: 3, author: 'admin', action: 'Ticket creado', fecha: '2024-03-03' }],
  },
  {
    id: 4, titulo: 'Revisión de permisos de red',
    descripcion: 'Auditoría de reglas del firewall y permisos de acceso.',
    estado: 'hecho', grupo: 'Redes', asignadoA: '', creadoPor: 'admin',
    prioridad: 'media', fechaCreacion: '2024-02-20', fechaLimite: null,
    comentarios: [], historial: [{ id: 4, author: 'admin', action: 'Ticket creado', fecha: '2024-02-20' }],
  },
  {
    id: 5, titulo: 'Implementar login SSO',
    descripcion: 'Integración con proveedor de identidad corporativo usando SAML 2.0.',
    estado: 'en-progreso', grupo: 'Desarrollo', asignadoA: '', creadoPor: 'admin',
    prioridad: 'alta', fechaCreacion: '2024-03-05', fechaLimite: '2024-04-01',
    comentarios: [], historial: [{ id: 5, author: 'admin', action: 'Ticket creado', fecha: '2024-03-05' }],
  },
  {
    id: 6, titulo: 'Backup semanal no ejecutado',
    descripcion: 'El job programado no corrió el domingo.',
    estado: 'bloqueado', grupo: 'Soporte', asignadoA: '', creadoPor: 'admin',
    prioridad: 'baja', fechaCreacion: '2024-03-06', fechaLimite: null,
    comentarios: [], historial: [{ id: 6, author: 'admin', action: 'Ticket creado', fecha: '2024-03-06' }],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};
const toDateStr = (d) => {
  if (!d) return '';
  try { return new Date(d).toISOString().substring(0, 10); } catch { return ''; }
};
const getPrio = (v) => PRIORITIES.find(p => p.value === v) ?? PRIORITIES[6];
const getCol  = (v) => KANBAN_COLS.find(c => c.value === v);

// ── Kanban card ────────────────────────────────────────────────────────────
const TicketCard = ({ ticket, isDragging, canEditState, onOpen, onDragStart, onDragEnd }) => {
  const prio = getPrio(ticket.prioridad);
  return (
    <div
      draggable={canEditState}
      onDragStart={() => onDragStart(ticket)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(ticket)}
      className={`bg-white rounded-xl border border-slate-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all select-none ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{ticket.titulo}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
          style={{ color: prio.color, background: prio.bg }}>{prio.label}</span>
      </div>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{ticket.descripcion}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">{ticket.grupo}</span>
          {ticket.comentarios.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <MessageSquare size={10} /> {ticket.comentarios.length}
            </span>
          )}
        </div>
        {ticket.fechaLimite && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock size={10} /> {fmtDate(ticket.fechaLimite)}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Field wrapper ──────────────────────────────────────────────────────────
const FL = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);
const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

// ── Main component ─────────────────────────────────────────────────────────
const TicketsSection = ({ currentUser }) => {
  const canViewAll   = currentUser.nivel >= 1;
  const canEdit      = currentUser.nivel >= 1;
  const canEditState = currentUser.nivel >= 1;
  const canDelete    = currentUser.nivel >= 2;
  const canAdd       = currentUser.nivel >= 1;

  const [tickets, setTickets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || SEED; } catch { return SEED; }
  });

  const persist = (updated) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTickets(updated);
  };

  // View
  const [viewMode, setViewMode]     = useState('kanban');
  const [quickFilter, setQuickFilter]   = useState('all');
  const [selectedGrupo, setSelectedGrupo] = useState('all');

  // Detail (derived)
  const [detailId, setDetailId]   = useState(null);
  const [newComment, setNewComment] = useState('');
  const detailTicket = useMemo(() => tickets.find(t => t.id === detailId) ?? null, [tickets, detailId]);

  // Edit / create
  const [editing, setEditing]     = useState(null);
  const [isNew, setIsNew]         = useState(false);

  // Drag
  const [draggingId, setDraggingId]   = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // ── Filtered tickets ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let base = canViewAll
      ? [...tickets]
      : tickets.filter(t => t.asignadoA === currentUser.email || t.creadoPor === currentUser.email);
    if (selectedGrupo !== 'all') base = base.filter(t => t.grupo === selectedGrupo);
    if (quickFilter === 'mine')       base = base.filter(t => t.asignadoA === currentUser.email);
    if (quickFilter === 'unassigned') base = base.filter(t => !t.asignadoA);
    if (quickFilter === 'high')       base = base.filter(t => ['critica','urgente','alta'].includes(t.prioridad));
    return base;
  }, [tickets, quickFilter, selectedGrupo, canViewAll, currentUser]);

  const forCol = (col) => filtered.filter(t => t.estado === col);

  // ── Drag & Drop ────────────────────────────────────────────────────────
  const onDragStart = (ticket) => { if (canEditState) setDraggingId(ticket.id); };
  const onDragEnd   = () => { setDraggingId(null); setDragOverCol(null); };
  const onDragOver  = (e, col) => { e.preventDefault(); setDragOverCol(col); };
  const onDrop      = (col) => {
    if (draggingId) {
      const t = tickets.find(x => x.id === draggingId);
      if (t && t.estado !== col) {
        const old = t.estado;
        persist(tickets.map(x =>
          x.id === draggingId
            ? { ...x, estado: col, historial: [...x.historial, { id: _histId++, author: currentUser.email, action: `Estado cambiado de "${old}" a "${col}"`, fecha: new Date().toISOString() }] }
            : x
        ));
      }
    }
    setDraggingId(null);
    setDragOverCol(null);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setIsNew(true);
    setEditing({ id: null, titulo: '', descripcion: '', estado: 'pendiente', grupo: GRUPOS[0], asignadoA: currentUser.email, creadoPor: currentUser.email, prioridad: 'media', fechaCreacion: new Date().toISOString(), fechaLimite: null, comentarios: [], historial: [] });
    setDetailId(null);
  };

  const openEdit = (ticket) => {
    setIsNew(false);
    setEditing({ ...ticket, comentarios: [...ticket.comentarios], historial: [...ticket.historial] });
    setDetailId(null);
  };

  const cancelEdit = () => { setEditing(null); setIsNew(false); };

  const saveEdit = () => {
    if (!editing) return;
    let updated;
    if (isNew) {
      const t = { ...editing, id: Date.now(), historial: [{ id: _histId++, author: currentUser.email, action: `Ticket creado con estado "${editing.estado}"`, fecha: new Date().toISOString() }] };
      updated = [t, ...tickets];
    } else {
      updated = tickets.map(t => {
        if (t.id !== editing.id) return t;
        const hist = [...editing.historial];
        if (t.estado !== editing.estado) hist.push({ id: _histId++, author: currentUser.email, action: `Estado cambiado de "${t.estado}" a "${editing.estado}"`, fecha: new Date().toISOString() });
        return { ...editing, historial: hist };
      });
    }
    persist(updated);
    setEditing(null);
    setIsNew(false);
  };

  const deleteTicket = (id) => {
    persist(tickets.filter(t => t.id !== id));
    if (detailId === id) setDetailId(null);
  };

  const addComment = () => {
    if (!newComment.trim() || !detailTicket) return;
    const cmt = { id: _cmtId++, author: currentUser.email, text: newComment.trim(), fecha: new Date().toISOString() };
    persist(tickets.map(t =>
      t.id === detailTicket.id
        ? { ...t, comentarios: [...t.comentarios, cmt], historial: [...t.historial, { id: _histId++, author: currentUser.email, action: 'Comentario agregado', fecha: new Date().toISOString() }] }
        : t
    ));
    setNewComment('');
  };

  const setField = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de solicitudes y tareas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('list')}  className={`p-2 rounded-lg transition-all ${viewMode === 'list'   ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
          </div>
          {canAdd && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all">
              <Plus size={16} /> Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { id: 'all',        label: 'Todos'          },
          { id: 'mine',       label: 'Mis tickets'    },
          { id: 'unassigned', label: 'Sin asignar'    },
          { id: 'high',       label: 'Alta prioridad' },
        ].map(f => (
          <button key={f.id} onClick={() => setQuickFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${quickFilter === f.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f.label}
          </button>
        ))}
        <select value={selectedGrupo} onChange={e => setSelectedGrupo(e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border-0 focus:outline-none cursor-pointer">
          <option value="all">Todos los grupos</option>
          {GRUPOS.map(g => <option key={g} value={g}>{g} ({tickets.filter(t => t.grupo === g).length})</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── KANBAN ── */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
          {KANBAN_COLS.map(col => {
            const colTickets = forCol(col.value);
            const isOver = dragOverCol === col.value;
            return (
              <div key={col.value}
                className={`flex-shrink-0 w-68 min-w-[260px] max-w-[280px] rounded-2xl p-3 transition-all ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : 'bg-slate-100/60'}`}
                onDragOver={e => onDragOver(e, col.value)}
                onDrop={() => onDrop(col.value)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
                    <span className="text-xs font-extrabold text-slate-700">{col.label}</span>
                  </div>
                  <span className="text-xs bg-white text-slate-500 font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">{colTickets.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket}
                      isDragging={draggingId === ticket.id}
                      canEditState={canEditState}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onOpen={t => { setDetailId(t.id); setEditing(null); setNewComment(''); }}
                    />
                  ))}
                  {colTickets.length === 0 && (
                    <div className="text-center py-8 text-slate-300 text-xs font-medium">Sin tickets</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST ── */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <AlertTriangle size={36} className="mx-auto mb-3 text-slate-200" />
              <p className="font-medium">No hay tickets con estos filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {['Título','Prioridad','Estado','Grupo','Fecha límite','Acciones'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(ticket => {
                    const prio = getPrio(ticket.prioridad);
                    const col  = getCol(ticket.estado);
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <button onClick={() => { setDetailId(ticket.id); setEditing(null); setNewComment(''); }}
                            className="font-semibold text-slate-800 text-sm hover:text-blue-600 text-left line-clamp-1 max-w-[200px]">{ticket.titulo}</button>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ticket.grupo}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: prio.color, background: prio.bg }}>{prio.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: (col?.color ?? '#94a3b8') + '20', color: col?.color ?? '#94a3b8' }}>{col?.label}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{ticket.grupo}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">{fmtDate(ticket.fechaLimite)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setDetailId(ticket.id); setEditing(null); setNewComment(''); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={15} /></button>
                            {canEdit   && <button onClick={() => openEdit(ticket)} className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"><Edit2 size={15} /></button>}
                            {canDelete && <button onClick={() => deleteTicket(ticket.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL PANEL ── */}
      {detailTicket && (
        <div className="fixed inset-0 z-[400] flex">
          <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDetailId(null)} />
          <div className="w-[460px] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-100">

            {/* Panel header */}
            <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket #{detailTicket.id}</span>
                  <h3 className="font-extrabold text-slate-800 mt-0.5 leading-snug">{detailTicket.titulo}</h3>
                </div>
                <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0 transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
              {/* Priority + status pills */}
              <div className="flex items-center gap-2 mt-3">
                {(() => { const p = getPrio(detailTicket.prioridad); return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: p.color, background: p.bg }}>{p.label}</span>; })()}
                {(() => { const c = getCol(detailTicket.estado); return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: (c?.color ?? '#94a3b8') + '20', color: c?.color ?? '#94a3b8' }}>{c?.label}</span>; })()}
                <span className="text-[11px] bg-slate-100 text-slate-500 font-semibold px-2.5 py-0.5 rounded-full">{detailTicket.grupo}</span>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* Description */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{detailTicket.descripcion || '—'}</p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'Asignado a', v: detailTicket.asignadoA || '—' },
                    { l: 'Creado por', v: detailTicket.creadoPor },
                    { l: 'Creación',   v: fmtDate(detailTicket.fechaCreacion) },
                    { l: 'Fecha límite', v: fmtDate(detailTicket.fechaLimite) },
                  ].map(m => (
                    <div key={m.l} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.l}</p>
                      <p className="text-sm font-semibold text-slate-700 truncate">{m.v}</p>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Comentarios ({detailTicket.comentarios.length})
                  </p>
                  <div className="space-y-2 mb-3">
                    {detailTicket.comentarios.length === 0 && (
                      <p className="text-xs text-slate-300 font-medium">Sin comentarios aún.</p>
                    )}
                    {detailTicket.comentarios.map(c => (
                      <div key={c.id} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{fmtDate(c.fecha)}</span>
                        </div>
                        <p className="text-sm text-slate-600">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment()}
                      placeholder="Agregar comentario…"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <button onClick={addComment} className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                      <MessageSquare size={15} />
                    </button>
                  </div>
                </div>

                {/* History */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History size={11} /> Historial
                  </p>
                  <div className="space-y-2">
                    {[...detailTicket.historial].reverse().map(h => (
                      <div key={h.id} className="flex gap-3 text-xs">
                        <div className="w-0.5 bg-slate-100 rounded-full flex-shrink-0 self-stretch mt-1" />
                        <div>
                          <span className="font-bold text-slate-700">{h.author}</span>
                          <span className="text-slate-500"> · {h.action}</span>
                          <div className="text-slate-300 mt-0.5">{fmtDate(h.fecha)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Panel footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              {canEdit && (
                <button onClick={() => openEdit(detailTicket)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 transition-all">
                  <Edit2 size={14} /> Editar
                </button>
              )}
              {canDelete && (
                <button onClick={() => deleteTicket(detailTicket.id)}
                  className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ── */}
      {editing && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={cancelEdit} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800">{isNew ? 'Nuevo Ticket' : 'Editar Ticket'}</h3>
              <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

              <FL label="Título">
                <input value={editing.titulo} onChange={e => setField('titulo', e.target.value)} placeholder="Título del ticket" className={inputCls} />
              </FL>

              <FL label="Descripción">
                <textarea value={editing.descripcion} onChange={e => setField('descripcion', e.target.value)} rows={3} placeholder="Describe el problema o tarea…" className={inputCls + ' resize-none'} />
              </FL>

              <div className="grid grid-cols-2 gap-4">
                <FL label="Prioridad">
                  <select value={editing.prioridad} onChange={e => setField('prioridad', e.target.value)} className={inputCls}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </FL>
                <FL label="Estado">
                  <select value={editing.estado} onChange={e => setField('estado', e.target.value)} className={inputCls}>
                    {KANBAN_COLS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </FL>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FL label="Grupo">
                  <select value={editing.grupo} onChange={e => setField('grupo', e.target.value)} className={inputCls}>
                    {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FL>
                <FL label="Asignado a">
                  <input value={editing.asignadoA} onChange={e => setField('asignadoA', e.target.value)} placeholder="correo@ejemplo.com" className={inputCls} />
                </FL>
              </div>

              <FL label="Fecha límite">
                <input type="date" value={toDateStr(editing.fechaLimite)} onChange={e => setField('fechaLimite', e.target.value || null)} className={inputCls} />
              </FL>

            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
              <button onClick={saveEdit}  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsSection;
