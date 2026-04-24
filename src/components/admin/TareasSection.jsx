import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Plus, X, Eye, Trash2, Edit2, Clock, Lock,
  LayoutGrid, List, AlertTriangle, CheckCircle2, Ban,
  Loader2, Circle,
} from 'lucide-react';
import { apiGetTareas, apiCreateTarea, apiUpdateTarea, apiDeleteTarea, authHeaders } from '../../utils/api';

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
const getPrio = (v) => PRIORITIES.find(p => p.value === v) ?? PRIORITIES[3];
const getCol  = (v) => KANBAN_COLS.find(c => c.value === v);

// ── Kanban card ────────────────────────────────────────────────────────────
const isTareaVencida = (t) => {
  if (!t.fecha_limite) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(t.fecha_limite) < today;
};

const TareaCard = ({ tarea, isDragging, canEditState, locked, onOpen, onDragStart, onDragEnd, onTouchStart, onTouchMove, onTouchEnd }) => {
  const prio    = getPrio(tarea.prioridad);
  const vencida = isTareaVencida(tarea);
  const movable = canEditState && !vencida;
  return (
    <div
      draggable={movable}
      onDragStart={() => movable && onDragStart(tarea)}
      onDragEnd={onDragEnd}
      onTouchStart={movable ? () => onTouchStart(tarea) : undefined}
      onTouchMove={movable ? onTouchMove : undefined}
      onTouchEnd={movable ? onTouchEnd : undefined}
      onClick={() => onOpen(tarea)}
      className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all select-none touch-none
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${vencida ? 'opacity-60 border-red-200 bg-red-50/30' : locked ? 'border-slate-200 bg-slate-50/60 opacity-75' : 'border-slate-100'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-bold text-slate-800 line-clamp-2 flex-1">{tarea.titulo}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
            style={{ color: prio.color, background: prio.bg }}>{prio.label}</span>
          {vencida && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 flex items-center gap-0.5 whitespace-nowrap"><Lock size={8} /> Vencido</span>}
          {locked && !vencida && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 flex items-center gap-0.5 whitespace-nowrap"><Lock size={8} /> Sin acceso</span>}
        </div>
      </div>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{tarea.descripcion}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">{tarea.grupo}</span>
        {tarea.fecha_limite && (
          <span className={`flex items-center gap-1 text-[10px] ${vencida ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
            <Clock size={10} /> {fmtDate(tarea.fecha_limite)}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Form field wrapper ─────────────────────────────────────────────────────
const FL = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);
const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

// ── Main component ─────────────────────────────────────────────────────────
const TareasSection = ({ currentUser }) => {
  // Permisos:
  // Trabajador (nivel 1) → solo puede cambiar estado de tareas asignadas a él
  // Admin (nivel 2+)     → gestión completa de todas las tareas
  const isAdmin  = currentUser.nivel >= 2;
  const canEdit  = currentUser.nivel >= 2;
  const canAdd   = currentUser.nivel >= 2;
  const canDelete = currentUser.nivel >= 2;
  // Devuelve true si el usuario puede cambiar el estado de esta tarea
  const canEditTareaState = (tarea) =>
    isAdmin ||
    tarea.asignado_a === currentUser.name ||
    tarea.asignado_a === currentUser.email;

  // ── Data ──────────────────────────────────────────────────────────────────
  const [tareas, setTareas]     = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState('');
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  // Cargar lista de usuarios para el selector "Asignado a"
  useEffect(() => {
    fetch('/api/users', { headers: authHeaders(false) })
      .then(r => r.json())
      .then(d => setUsuarios(d.users || []))
      .catch(() => {});
  }, []);

  const fetchTareas = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await apiGetTareas(currentUser.id);
      setTareas(data.tareas || []);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => { fetchTareas(); }, [fetchTareas]);

  // ── View state ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode]         = useState('kanban');
  const [quickFilter, setQuickFilter]   = useState('all');
  const [selectedGrupo, setSelectedGrupo] = useState('all');

  // ── Detail ────────────────────────────────────────────────────────────────
  const [detailId, setDetailId] = useState(null);
  const detailTarea = useMemo(() => tareas.find(t => t.id === detailId) ?? null, [tareas, detailId]);

  // ── Edit / create ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew]     = useState(false);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const [draggingId, setDraggingId]   = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const touchDragRef = useRef(null);

  // ── Filtered tareas ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let base = [...tareas];
    if (selectedGrupo !== 'all') base = base.filter(t => t.grupo === selectedGrupo);
    if (quickFilter === 'mine')       base = base.filter(t => t.asignado_a === currentUser.email);
    if (quickFilter === 'unassigned') base = base.filter(t => !t.asignado_a);
    if (quickFilter === 'high')       base = base.filter(t => ['critica','urgente','alta'].includes(t.prioridad));
    return base;
  }, [tareas, quickFilter, selectedGrupo, currentUser.email]);

  const forCol = (col) => filtered.filter(t => t.estado === col);

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const onDragStart = (tarea) => { if (canEditTareaState(tarea) && !isTareaVencida(tarea)) setDraggingId(tarea.id); };
  const onDragEnd   = () => { setDraggingId(null); setDragOverCol(null); };
  const onDragOver  = (e, col) => { e.preventDefault(); setDragOverCol(col); };

  const moveTarea = async (id, col) => {
    setDraggingId(null); setDragOverCol(null);
    if (!id) return;
    const tarea = tareas.find(t => t.id === id);
    if (!tarea || tarea.estado === col) return;
    if (isTareaVencida(tarea)) return;
    setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: col } : t));
    try {
      await apiUpdateTarea(currentUser.id, id, { estado: col });
    } catch {
      fetchTareas();
    }
  };

  const onDrop = (col) => moveTarea(draggingId, col);

  // ── Touch drag & drop (mobile) ────────────────────────────────────────────
  const getColFromPoint = (x, y) => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      const col = el.getAttribute?.('data-col');
      if (col) return col;
    }
    return null;
  };

  const onTouchStart = (tarea) => {
    touchDragRef.current = tarea.id;
    setDraggingId(tarea.id);
  };

  const onTouchMove = (e) => {
    if (!touchDragRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const col = getColFromPoint(t.clientX, t.clientY);
    setDragOverCol(col || null);
  };

  const onTouchEnd = (e) => {
    if (!touchDragRef.current) return;
    const t = e.changedTouches[0];
    const col = getColFromPoint(t.clientX, t.clientY);
    const id = touchDragRef.current;
    touchDragRef.current = null;
    if (col) moveTarea(id, col);
    else { setDraggingId(null); setDragOverCol(null); }
  };

  // ── Estado change (dropdown en lista) ────────────────────────────────────
  const handleEstadoChange = async (tareaId, newEstado) => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: newEstado } : t));
    try {
      await apiUpdateTarea(currentUser.id, tareaId, { estado: newEstado });
    } catch {
      fetchTareas();
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setIsNew(true);
    setFormError('');
    setEditing({ titulo: '', descripcion: '', prioridad: 'media', estado: 'pendiente', grupo: GRUPOS[0], asignado_a: '', fecha_limite: '' });
    setDetailId(null);
  };

  const openEdit = (tarea) => {
    setIsNew(false);
    setFormError('');
    setEditing({ ...tarea, fecha_limite: toDateStr(tarea.fecha_limite) });
    setDetailId(null);
  };

  const cancelEdit = () => { setEditing(null); setIsNew(false); setFormError(''); };

  const saveEdit = async () => {
    if (!editing?.titulo?.trim()) { setFormError('El título es requerido.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = {
        titulo:       editing.titulo.trim(),
        descripcion:  editing.descripcion || '',
        prioridad:    editing.prioridad,
        estado:       editing.estado,
        grupo:        editing.grupo,
        asignado_a:   editing.asignado_a || null,
        fecha_limite: editing.fecha_limite || null,
      };
      if (isNew) {
        await apiCreateTarea(currentUser.id, payload);
      } else {
        await apiUpdateTarea(currentUser.id, editing.id, payload);
      }
      await fetchTareas();
      setEditing(null); setIsNew(false);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTarea = async (id) => {
    try {
      await apiDeleteTarea(currentUser.id, id);
      setTareas(prev => prev.filter(t => t.id !== id));
      if (detailId === id) setDetailId(null);
    } catch (e) {
      setApiError(e.message);
    }
  };

  const setField = (k, v) => setEditing(e => ({ ...e, [k]: v }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tareas</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {currentUser.nivel >= 2 ? 'Gestión completa de tareas' : 'Vista y control de estado de tareas'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode('list')}  className={`p-2 rounded-lg transition-all ${viewMode === 'list'   ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
          </div>
          {canAdd && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all">
              <Plus size={16} /> Nueva Tarea
            </button>
          )}
        </div>
      </div>

      {/* ── Error global ── */}
      {apiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
          <AlertTriangle size={15} className="flex-shrink-0" /> {apiError}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { id: 'all',        label: 'Todas'          },
          { id: 'mine',       label: 'Mis tareas'     },
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
          {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
          Cargando tareas…
        </div>
      ) : (
        <>
          {/* ── KANBAN ── */}
          {viewMode === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
              {KANBAN_COLS.map(col => {
                const colTareas = forCol(col.value);
                const isOver = dragOverCol === col.value;
                return (
                  <div key={col.value}
                    data-col={col.value}
                    className={`flex-shrink-0 min-w-[260px] max-w-[280px] rounded-2xl p-3 transition-all ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : 'bg-slate-100/60'}`}
                    onDragOver={e => onDragOver(e, col.value)}
                    onDrop={() => onDrop(col.value)}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
                        <span className="text-xs font-extrabold text-slate-700">{col.label}</span>
                      </div>
                      <span className="text-xs bg-white text-slate-500 font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">{colTareas.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {colTareas.map(tarea => (
                        <TareaCard key={tarea.id} tarea={tarea}
                          isDragging={draggingId === tarea.id}
                          canEditState={canEditTareaState(tarea)}
                          locked={!isAdmin && !canEditTareaState(tarea)}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          onTouchStart={onTouchStart}
                          onTouchMove={onTouchMove}
                          onTouchEnd={onTouchEnd}
                          onOpen={t => { setDetailId(t.id); setEditing(null); }}
                        />
                      ))}
                      {colTareas.length === 0 && (
                        <div className="text-center py-8 text-slate-300 text-xs font-medium">Sin tareas</div>
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
                  <p className="font-medium">No hay tareas con estos filtros.</p>
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
                      {filtered.map(tarea => {
                        const prio    = getPrio(tarea.prioridad);
                        const col     = getCol(tarea.estado);
                        const vencida = isTareaVencida(tarea);
                        return (
                          <tr key={tarea.id} className={`hover:bg-slate-50/50 transition-colors ${vencida ? 'bg-red-50/20' : ''}`}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setDetailId(tarea.id); setEditing(null); }}
                                  className="font-semibold text-slate-800 text-sm hover:text-blue-600 text-left line-clamp-1 max-w-[180px]">{tarea.titulo}</button>
                                {vencida && <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 flex-shrink-0"><Lock size={8} /> Vencido</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: prio.color, background: prio.bg }}>{prio.label}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              {canEditTareaState(tarea) && !vencida ? (
                                <select value={tarea.estado} onChange={e => handleEstadoChange(tarea.id, e.target.value)}
                                  className="text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none"
                                  style={{ background: (col?.color ?? '#94a3b8') + '20', color: col?.color ?? '#94a3b8' }}>
                                  {KANBAN_COLS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                              ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: (col?.color ?? '#94a3b8') + '20', color: col?.color ?? '#94a3b8' }}>{col?.label}</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-500">{tarea.grupo}</td>
                            <td className={`px-5 py-3.5 text-sm ${vencida ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>{fmtDate(tarea.fecha_limite)}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => { setDetailId(tarea.id); setEditing(null); }} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Eye size={15} /></button>
                                {canEdit   && !vencida && <button onClick={() => openEdit(tarea)} className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"><Edit2 size={15} /></button>}
                                {canDelete && !vencida && <button onClick={() => deleteTarea(tarea.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>}
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
        </>
      )}

      {/* ── DETAIL PANEL ── */}
      {detailTarea && (
        <div className="fixed inset-0 z-[400] flex">
          <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDetailId(null)} />
          <div className="w-full md:w-[440px] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarea</span>
                  <h3 className="font-extrabold text-slate-800 mt-0.5 leading-snug">{detailTarea.titulo}</h3>
                </div>
                <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0"><X size={16} className="text-slate-500" /></button>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(() => { const p = getPrio(detailTarea.prioridad); return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: p.color, background: p.bg }}>{p.label}</span>; })()}
                {canEditTareaState(detailTarea) ? (
                  <select value={detailTarea.estado} onChange={e => handleEstadoChange(detailTarea.id, e.target.value)}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none"
                    style={{ background: (getCol(detailTarea.estado)?.color ?? '#94a3b8') + '20', color: getCol(detailTarea.estado)?.color ?? '#94a3b8' }}>
                    {KANBAN_COLS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                ) : (
                  (() => { const c = getCol(detailTarea.estado); return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: (c?.color ?? '#94a3b8') + '20', color: c?.color ?? '#94a3b8' }}>{c?.label}</span>; })()
                )}
                <span className="text-[11px] bg-slate-100 text-slate-500 font-semibold px-2.5 py-0.5 rounded-full">{detailTarea.grupo}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                <p className="text-sm text-slate-600 leading-relaxed">{detailTarea.descripcion || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Asignado a',   v: detailTarea.asignado_a || '—' },
                  { l: 'Creado',       v: fmtDate(detailTarea.created_at) },
                  { l: 'Actualizado',  v: fmtDate(detailTarea.updated_at) },
                  { l: 'Fecha límite', v: fmtDate(detailTarea.fecha_limite) },
                ].map(m => (
                  <div key={m.l} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.l}</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{m.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {(canEdit || canDelete) && (
              <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                {canEdit && (
                  <button onClick={() => openEdit(detailTarea)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 transition-all">
                    <Edit2 size={14} /> Editar
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => deleteTarea(detailTarea.id)}
                    className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT / CREATE MODAL (solo superadmin) ── */}
      {editing && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={cancelEdit} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg z-10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800">{isNew ? 'Nueva Tarea' : 'Editar Tarea'}</h3>
              <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-500" /></button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
                  <AlertTriangle size={14} className="flex-shrink-0" /> {formError}
                </div>
              )}

              <FL label="Título">
                <input value={editing.titulo} onChange={e => setField('titulo', e.target.value)} placeholder="Título de la tarea" className={inputCls} />
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
                  <select value={editing.asignado_a || ''} onChange={e => setField('asignado_a', e.target.value)} className={inputCls}>
                    <option value="">Sin asignar</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </FL>
              </div>

              <FL label="Fecha límite">
                <input type="date" value={editing.fecha_limite || ''} onChange={e => setField('fecha_limite', e.target.value)} className={inputCls} />
              </FL>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end border-t border-slate-100 pt-4">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
              <button onClick={saveEdit} disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center gap-2">
                {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TareasSection;
