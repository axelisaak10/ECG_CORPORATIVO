import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, GanttChartSquare, User, CalendarRange, ChevronDown } from 'lucide-react';
import {
  apiGetGanttProyectos, apiCreateGanttProyecto, apiUpdateGanttProyecto, apiDeleteGanttProyecto,
  apiGetGanttTareas, apiCreateGanttTarea, apiUpdateGanttTarea, apiDeleteGanttTarea,
  apiCreateTarea, apiGetUsers,
} from '../../utils/api';

const PALETTE   = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#f97316','#06b6d4','#ec4899','#14b8a6','#84cc16'];
const AREAS     = ['Operaciones','IT','Administración','Comercial','Producción','Mantenimiento','Diseño','Otro'];
const PRIORIDADES = [
  { value: 'baja',    label: 'Baja',    color: '#94a3b8' },
  { value: 'media',   label: 'Media',   color: '#3b82f6' },
  { value: 'alta',    label: 'Alta',    color: '#f97316' },
  { value: 'urgente', label: 'Urgente', color: '#ef4444' },
];

const getPrioridad = (v) => PRIORIDADES.find(p => p.value === v) ?? PRIORIDADES[1];

const parseDate  = (d) => new Date(d + 'T00:00:00');
const today      = () => new Date().toISOString().split('T')[0];
const addDays    = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split('T')[0]; };
const fmtDate    = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function computeTimeline(tareas) {
  if (!tareas.length) return null;
  const starts = tareas.map(t => parseDate(t.fecha_inicio).getTime());
  const ends   = tareas.map(t => parseDate(t.fecha_fin).getTime());
  const min = Math.min(...starts), max = Math.max(...ends);
  return { min, max, total: Math.max(max - min, 86400000) };
}

function getMonthCols(tl) {
  const { min, max, total } = tl;
  const months = [];
  let cur = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1);
  while (cur.getTime() <= max) {
    const s = Math.max(cur.getTime(), min);
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const e = Math.min(next.getTime(), max + 86400000);
    months.push({ label: cur.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), left: ((s - min) / total) * 100, width: ((e - s) / total) * 100 });
    cur = next;
  }
  return months;
}

function barProps(t, tl) {
  const s = parseDate(t.fecha_inicio).getTime(), e = parseDate(t.fecha_fin).getTime();
  return { left: `${((s - tl.min) / tl.total) * 100}%`, width: `${((e - s) / tl.total) * 100}%` };
}

// ── Color picker ──────────────────────────────────────────────────────────────
const ColorPicker = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {PALETTE.map(c => (
      <button key={c} type="button" onClick={() => onChange(c)}
        className="w-7 h-7 rounded-full border-2 transition-all"
        style={{ background: c, borderColor: value === c ? '#0f172a' : 'transparent' }} />
    ))}
  </div>
);

// ── Modal base ────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-500" /></button>
      </div>
      {children}
    </div>
  </div>
);

// ── Modal proyecto ────────────────────────────────────────────────────────────
const ProyectoModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: PALETTE[0], ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => { if (!form.nombre.trim()) return; onSave(form); onClose(); };
  return (
    <Modal title={initial ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Construcción Edificio"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} placeholder="Descripción del proyecto..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color</label>
          <ColorPicker value={form.color} onChange={v => set('color', v)} />
        </div>
      </div>
      <div className="px-6 pb-5 flex gap-3 justify-end border-t border-slate-100 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">Guardar</button>
      </div>
    </Modal>
  );
};

// ── Modal tarea (mejorado) ────────────────────────────────────────────────────
const TareaModal = ({ initial, proyectoColor, proyectoNombre, usuarios, onSave, onClose }) => {
  const t0 = today();
  const [form, setForm] = useState({
    nombre: '', descripcion: '', responsable: '', area: 'Operaciones', prioridad: 'media',
    fecha_inicio: t0, fecha_fin: addDays(t0, 7), porcentaje: 0,
    color: proyectoColor || PALETTE[0], orden: 0,
    ...initial,
  });
  const [crearTarea, setCrearTarea] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.nombre.trim()) return;
    onSave(form, crearTarea && !initial);
    onClose();
  };

  const prio = getPrioridad(form.prioridad);

  return (
    <Modal title={initial ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose}>
      <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
        {/* Nombre */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Diseño de planos"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        {/* Descripción */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2} placeholder="Detalles de la tarea..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
        </div>
        {/* Responsable — selector de usuarios */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Responsable</label>
          <select value={form.responsable} onChange={e => set('responsable', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="">— Sin asignar —</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        {/* Área y Prioridad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Área</label>
            <select value={form.area} onChange={e => set('area', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prioridad</label>
            <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              style={{ color: prio.color }}>
              {PRIORIDADES.map(p => <option key={p.value} value={p.value} style={{ color: p.color }}>{p.label}</option>)}
            </select>
          </div>
        </div>
        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Inicio *</label>
            <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fin *</label>
            <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} min={form.fecha_inicio}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        {/* Progreso */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Progreso: {form.porcentaje}%</label>
          <input type="range" min={0} max={100} value={form.porcentaje} onChange={e => set('porcentaje', Number(e.target.value))}
            className="w-full accent-blue-600" />
        </div>
        {/* Color */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Color de barra</label>
          <ColorPicker value={form.color} onChange={v => set('color', v)} />
        </div>
        {/* Sync a Tareas — solo en creación */}
        {!initial && (
          <label className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
            <input type="checkbox" checked={crearTarea} onChange={e => setCrearTarea(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <div>
              <p className="text-sm font-bold text-blue-800">Crear también como Tarea</p>
              <p className="text-xs text-blue-600">Se generará una tarea asignada al responsable en el módulo de Tareas</p>
            </div>
          </label>
        )}
      </div>
      <div className="px-6 pb-5 flex gap-3 justify-end border-t border-slate-100 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
        <button onClick={save} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">Guardar</button>
      </div>
    </Modal>
  );
};

// ── Gráfica Gantt ─────────────────────────────────────────────────────────────
const GanttChart = ({ tareas, onEdit, onDelete }) => {
  const sorted   = [...tareas].sort((a, b) => a.orden - b.orden || a.fecha_inicio.localeCompare(b.fecha_inicio));
  const timeline = computeTimeline(sorted);
  if (!timeline) return null;
  const months   = getMonthCols(timeline);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <div style={{ minWidth: 720 }}>
        {/* Encabezado meses */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <div className="w-56 flex-shrink-0 px-4 py-2.5 border-r border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarea</div>
          <div className="flex-1 relative h-9">
            {months.map((m, i) => (
              <div key={i} className="absolute top-0 h-full flex items-center border-r border-slate-200 last:border-0"
                style={{ left: `${m.left}%`, width: `${m.width}%` }}>
                <span className="px-2 text-[10px] font-bold text-slate-500 truncate">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="w-14 flex-shrink-0 px-2 py-2.5 border-l border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">%</div>
        </div>

        {/* Filas */}
        {sorted.map((t, idx) => {
          const bp   = barProps(t, timeline);
          const prio = getPrioridad(t.prioridad);
          return (
            <div key={t.id} className={`flex items-center group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 transition-colors border-b border-slate-100 last:border-0`}>
              {/* Info tarea */}
              <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-slate-100">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold text-slate-800 truncate leading-tight flex-1">{t.nombre}</p>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: prio.color + '22', color: prio.color }}>{prio.label}</span>
                </div>
                {t.responsable && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                    <User size={9} /> {t.responsable}
                  </p>
                )}
                {t.area && <p className="text-[9px] text-slate-300 mt-0.5">{t.area}</p>}
                <p className="text-[9px] text-slate-300">{fmtDate(t.fecha_inicio)} → {fmtDate(t.fecha_fin)}</p>
              </div>

              {/* Barra */}
              <div className="flex-1 relative h-14">
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 h-full border-r border-slate-100 last:border-0"
                    style={{ left: `${m.left}%`, width: `${m.width}%` }} />
                ))}
                <div className="absolute top-3 bottom-3 rounded-lg overflow-hidden shadow-sm"
                  style={{ left: bp.left, width: bp.width, background: t.color + '33' }}>
                  <div className="h-full rounded-lg transition-all" style={{ width: `${t.porcentaje}%`, background: t.color }} />
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => onEdit(t)} className="w-6 h-6 rounded-md bg-white shadow border border-slate-200 flex items-center justify-center hover:border-blue-300">
                    <Edit2 size={11} className="text-slate-500" />
                  </button>
                  <button onClick={() => onDelete(t.id)} className="w-6 h-6 rounded-md bg-white shadow border border-slate-200 flex items-center justify-center hover:border-red-300">
                    <Trash2 size={11} className="text-slate-500" />
                  </button>
                </div>
              </div>

              {/* % */}
              <div className="w-14 flex-shrink-0 px-2 py-3 border-l border-slate-100 text-center">
                <span className="text-xs font-black" style={{ color: t.color }}>{t.porcentaje}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function GanttSection({ currentUser }) {
  const [proyectos,    setProyectos]    = useState([]);
  const [selectedId,   setSelectedId]  = useState(null);
  const [tareas,       setTareas]       = useState([]);
  const [usuarios,     setUsuarios]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingTareas,setLoadingTareas]= useState(false);
  const [error,        setError]        = useState('');
  const [proyectoModal,setProyectoModal]= useState(null);
  const [tareaModal,   setTareaModal]   = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);

  const isAdmin = (currentUser?.nivel ?? 0) >= 2;

  useEffect(() => {
    Promise.all([
      apiGetGanttProyectos(),
      isAdmin ? apiGetUsers().catch(() => []) : Promise.resolve([]),
    ]).then(([projs, users]) => {
      setProyectos(projs);
      if (projs.length) setSelectedId(projs[0].id);
      setUsuarios(users || []);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setTareas([]); return; }
    setLoadingTareas(true);
    apiGetGanttTareas(selectedId)
      .then(setTareas)
      .catch(e => setError(e.message))
      .finally(() => setLoadingTareas(false));
  }, [selectedId]);

  const selectedProyecto = proyectos.find(p => p.id === selectedId);

  // CRUD proyectos
  const handleSaveProyecto = async (form) => {
    try {
      if (proyectoModal === 'new') {
        const p = await apiCreateGanttProyecto(form);
        setProyectos(prev => [...prev, p]);
        setSelectedId(p.id);
      } else {
        const p = await apiUpdateGanttProyecto(proyectoModal.id, form);
        setProyectos(prev => prev.map(x => x.id === p.id ? p : x));
      }
    } catch (e) { setError(e.message); }
  };

  const handleDeleteProyecto = async (id) => {
    try {
      await apiDeleteGanttProyecto(id);
      const next = proyectos.filter(p => p.id !== id);
      setProyectos(next);
      setSelectedId(next[0]?.id ?? null);
    } catch (e) { setError(e.message); }
    setConfirmDel(null);
  };

  // CRUD tareas + sync a Tareas
  const handleSaveTarea = async (form, crearTarea) => {
    try {
      if (tareaModal === 'new') {
        const t = await apiCreateGanttTarea({ ...form, proyecto_id: selectedId, orden: tareas.length });
        setTareas(prev => [...prev, t]);
        if (crearTarea) {
          await apiCreateTarea(null, {
            titulo:       form.nombre,
            descripcion:  `${form.descripcion || ''}${form.descripcion ? '\n' : ''}[Gantt: ${selectedProyecto?.nombre || ''}]`,
            prioridad:    form.prioridad || 'media',
            estado:       'pendiente',
            grupo:        form.area || 'Operaciones',
            asignado_a:   form.responsable || null,
            fecha_limite: form.fecha_fin || null,
          }).catch(e => setError('Tarea creada en Gantt, pero no se pudo crear en Tareas: ' + e.message));
        }
      } else {
        const t = await apiUpdateGanttTarea(tareaModal.id, form);
        setTareas(prev => prev.map(x => x.id === t.id ? t : x));
      }
    } catch (e) { setError(e.message); }
  };

  const handleDeleteTarea = async (id) => {
    try {
      await apiDeleteGanttTarea(id);
      setTareas(prev => prev.filter(t => t.id !== id));
    } catch (e) { setError(e.message); }
    setConfirmDel(null);
  };

  return (
    <div>
      {proyectoModal && (
        <ProyectoModal initial={proyectoModal === 'new' ? null : proyectoModal}
          onSave={handleSaveProyecto} onClose={() => setProyectoModal(null)} />
      )}
      {tareaModal && (
        <TareaModal
          initial={tareaModal === 'new' ? null : tareaModal}
          proyectoColor={selectedProyecto?.color}
          proyectoNombre={selectedProyecto?.nombre}
          usuarios={usuarios}
          onSave={handleSaveTarea}
          onClose={() => setTareaModal(null)}
        />
      )}
      {confirmDel && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDel(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 text-center">
            <Trash2 size={32} className="mx-auto text-red-400 mb-3" />
            <p className="font-bold text-slate-800 mb-1">¿Eliminar {confirmDel.type === 'proyecto' ? 'proyecto' : 'tarea'}?</p>
            <p className="text-sm text-slate-500 mb-5">{confirmDel.type === 'proyecto' ? 'Se eliminarán todas las tareas del proyecto.' : 'Esta acción no se puede deshacer.'}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => confirmDel.type === 'proyecto' ? handleDeleteProyecto(confirmDel.id) : handleDeleteTarea(confirmDel.id)}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Diagramas de Gantt</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión visual de proyectos y cronogramas</p>
        </div>
        {isAdmin && (
          <button onClick={() => setProyectoModal('new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-blue-800 transition-all">
            <Plus size={16} /> Nuevo Diagrama
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}<button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mr-3" />
          Cargando proyectos...
        </div>
      ) : proyectos.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <GanttChartSquare size={48} className="mx-auto mb-4 text-slate-200" strokeWidth={1.5} />
          <p className="font-semibold text-slate-500">No hay diagramas de Gantt</p>
          <p className="text-sm mt-1">Crea el primero con el botón superior</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {proyectos.map(p => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedId === p.id ? 'text-white shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                style={selectedId === p.id ? { background: p.color, borderColor: p.color } : {}}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selectedId === p.id ? 'white' : p.color }} />
                {p.nombre}
              </button>
            ))}
          </div>

          {selectedProyecto && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header proyecto */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                style={{ borderLeftWidth: 4, borderLeftColor: selectedProyecto.color }}>
                <div>
                  <h2 className="font-extrabold text-slate-800 text-lg">{selectedProyecto.nombre}</h2>
                  {selectedProyecto.descripcion && <p className="text-sm text-slate-500 mt-0.5">{selectedProyecto.descripcion}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button onClick={() => setTareaModal('new')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: selectedProyecto.color }}>
                        <Plus size={14} /> Nueva tarea
                      </button>
                      <button onClick={() => setProyectoModal(selectedProyecto)}
                        className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                        <Edit2 size={15} className="text-slate-500" />
                      </button>
                      <button onClick={() => setConfirmDel({ type: 'proyecto', id: selectedProyecto.id })}
                        className="p-2 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all">
                        <Trash2 size={15} className="text-slate-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Gráfica */}
              <div className="p-6">
                {loadingTareas ? (
                  <div className="flex items-center justify-center h-32 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mr-2" />
                    Cargando tareas...
                  </div>
                ) : tareas.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <CalendarRange size={36} className="mx-auto mb-3 text-slate-200" strokeWidth={1.5} />
                    <p className="font-semibold text-slate-500">Sin tareas en este diagrama</p>
                    {isAdmin && <p className="text-sm mt-1">Usa "Nueva tarea" para agregar actividades</p>}
                  </div>
                ) : (
                  <GanttChart tareas={tareas} onEdit={t => setTareaModal(t)} onDelete={id => setConfirmDel({ type: 'tarea', id })} />
                )}
              </div>

              {/* Resumen */}
              {tareas.length > 0 && (
                <div className="px-6 pb-5 flex items-center gap-6 flex-wrap border-t border-slate-50 pt-4">
                  <div className="text-xs text-slate-500 font-medium">{tareas.length} tarea{tareas.length !== 1 ? 's' : ''}</div>
                  <div className="text-xs text-slate-500 font-medium">
                    Progreso promedio: <span className="font-bold text-slate-700">{Math.round(tareas.reduce((s, t) => s + t.porcentaje, 0) / tareas.length)}%</span>
                  </div>
                  {tareas.some(t => t.responsable) && (
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <User size={11} />
                      {[...new Set(tareas.map(t => t.responsable).filter(Boolean))].join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
