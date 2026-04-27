import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Hammer, Paintbrush, Wrench, Sparkles, CheckCircle2,
  Clock, Plus, X, AlertTriangle, ChevronRight, Eye,
  ClipboardList, Copy, Check, Loader2, User,
} from 'lucide-react';
import { authHeaders } from '../../utils/api';

// ── Etapas ─────────────────────────────────────────────────────────────────
export const ETAPAS = [
  { value: 'recibido',    label: 'Recibido',    color: '#94a3b8', bg: '#f1f5f9', Icon: Clock        },
  { value: 'armado',      label: 'Armado',      color: '#3b82f6', bg: '#eff6ff', Icon: Hammer       },
  { value: 'pintura',     label: 'Pintura',     color: '#f59e0b', bg: '#fffbeb', Icon: Paintbrush   },
  { value: 'instalacion', label: 'Instalación', color: '#f97316', bg: '#fff7ed', Icon: Wrench       },
  { value: 'detallado',   label: 'Detallado',   color: '#8b5cf6', bg: '#f5f3ff', Icon: Sparkles     },
  { value: 'completado',  label: 'Completado',  color: '#10b981', bg: '#f0fdf4', Icon: CheckCircle2 },
];

const getEtapa = (v) => ETAPAS.find(e => e.value === v) ?? ETAPAS[0];

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};
const fmtDateShort = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// ── Stepper horizontal ─────────────────────────────────────────────────────
const Stepper = ({ etapaActual }) => {
  const idx = ETAPAS.findIndex(e => e.value === etapaActual);
  return (
    <div className="flex items-center w-full">
      {ETAPAS.map((e, i) => {
        const done    = i < idx;
        const current = i === idx;
        return (
          <div key={e.value} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  current ? 'ring-2 ring-offset-1' : ''
                }`}
                style={{
                  background: done || current ? e.color : '#e2e8f0',
                  ringColor:  current ? e.color : 'transparent',
                }}
              >
                {done
                  ? <Check size={12} className="text-white" strokeWidth={3} />
                  : <e.Icon size={12} className={done || current ? 'text-white' : 'text-slate-400'} />
                }
              </div>
              <span className={`text-[9px] font-bold mt-0.5 whitespace-nowrap ${current ? 'text-slate-700' : done ? 'text-slate-400' : 'text-slate-300'}`}>
                {e.label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < idx ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Tarjeta de trabajo ─────────────────────────────────────────────────────
const TrabajoCard = ({ trabajo, onClick }) => {
  const etapa = getEtapa(trabajo.etapa_actual);
  const [copied, setCopied] = useState(false);
  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trabajo.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-extrabold text-slate-800 truncate text-sm">{trabajo.cliente}</p>
          {trabajo.folio && <p className="text-[11px] text-slate-400 font-medium mt-0.5">Folio: {trabajo.folio}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl"
            style={{ background: etapa.bg, color: etapa.color }}>
            {trabajo.codigo}
          </span>
          <button onClick={copyCode}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto">
        <Stepper etapaActual={trabajo.etapa_actual} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">
          Iniciado {fmtDateShort(trabajo.created_at)}
        </span>
        <span className="text-[10px] font-bold text-blue-500 group-hover:underline flex items-center gap-0.5">
          Ver detalle <ChevronRight size={11} />
        </span>
      </div>
    </div>
  );
};

// ── Input de formulario ────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300';
const FL = ({ label, req, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
      {label}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

// ── Panel de detalle ───────────────────────────────────────────────────────
const DetallePanel = ({ trabajo, currentUser, onClose, onUpdated }) => {
  const etapa       = getEtapa(trabajo.etapa_actual);
  const isAdmin     = currentUser.nivel >= 2;
  const [form, setForm]     = useState({ etapa: trabajo.etapa_actual, descripcion: '', inconveniente: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(trabajo.codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) { setErr('La descripción es requerida.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/trabajos/${trabajo.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          etapa:          form.etapa,
          descripcion:    form.descripcion,
          inconveniente:  form.inconveniente,
          usuario_nombre: currentUser.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar.');
      onUpdated(data.trabajo, data.actualizacion);
      setForm(f => ({ ...f, descripcion: '', inconveniente: '' }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const acts = useMemo(() =>
    [...(trabajo.trabajo_actualizaciones || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [trabajo.trabajo_actualizaciones]
  );

  return (
    <div className="fixed inset-0 z-[400] flex">
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full md:w-[520px] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-slate-100">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trabajo</p>
              <h3 className="font-extrabold text-slate-800 text-lg leading-tight mt-0.5">{trabajo.cliente}</h3>
              {trabajo.folio && <p className="text-xs text-slate-400 mt-0.5">Folio: {trabajo.folio}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 flex-shrink-0">
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          {/* Código */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-dashed"
              style={{ borderColor: etapa.color + '60', background: etapa.bg }}>
              <span className="font-mono font-black text-sm tracking-widest" style={{ color: etapa.color }}>
                {trabajo.codigo}
              </span>
              <button onClick={copyCode} className="transition-colors" style={{ color: etapa.color }}>
                {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
              </button>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl"
              style={{ background: etapa.bg, color: etapa.color }}>
              {etapa.label}
            </span>
          </div>

          {/* Stepper */}
          <div className="mt-4 overflow-x-auto">
            <Stepper etapaActual={trabajo.etapa_actual} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Formulario de actualización */}
          <form onSubmit={handleSubmit} className="px-6 py-5 border-b border-slate-50 space-y-3 flex-shrink-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registrar avance</p>

            {err && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold">
                <AlertTriangle size={13} /> {err}
              </div>
            )}

            <FL label="Etapa actual" req>
              <select value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))} className={inputCls}>
                {ETAPAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </FL>

            <FL label="Descripción del avance" req>
              <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2} placeholder="¿Qué se realizó en esta etapa?" className={inputCls + ' resize-none'} />
            </FL>

            <FL label="Inconveniente o atraso">
              <textarea value={form.inconveniente} onChange={e => setForm(f => ({ ...f, inconveniente: e.target.value }))}
                rows={2} placeholder="¿Hubo algún problema? (opcional)" className={inputCls + ' resize-none'} />
            </FL>

            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : <><Plus size={14} /> Registrar avance</>}
            </button>
          </form>

          {/* Historial */}
          <div className="px-6 py-5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historial</p>
            {acts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Sin actualizaciones aún.</p>
            ) : (
              acts.map((a, i) => {
                const ae = getEtapa(a.etapa);
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: ae.bg }}>
                        <ae.Icon size={13} style={{ color: ae.color }} />
                      </div>
                      {i < acts.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                    </div>
                    <div className={`flex-1 pb-3 ${i < acts.length - 1 ? '' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black" style={{ color: ae.color }}>{ae.label}</span>
                        <span className="text-[10px] text-slate-400">{fmtDate(a.created_at)}</span>
                      </div>
                      {a.usuario_nombre && (
                        <div className="flex items-center gap-1 mb-1">
                          <User size={10} className="text-slate-300" />
                          <span className="text-[10px] text-slate-400 font-medium">{a.usuario_nombre}</span>
                        </div>
                      )}
                      {a.descripcion && (
                        <p className="text-sm text-slate-600 leading-relaxed">{a.descripcion}</p>
                      )}
                      {a.inconveniente && (
                        <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                          <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 font-medium">{a.inconveniente}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────
const TrabajosSection = ({ currentUser }) => {
  const [trabajos, setTrabajos]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState('');
  const [filtroEtapa, setFiltro]  = useState('todos');
  const [detalle, setDetalle]     = useState(null);

  const fetchTrabajos = useCallback(async () => {
    setLoading(true); setApiError('');
    try {
      const res  = await fetch('/api/trabajos', { headers: authHeaders(false) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrabajos(data.trabajos || []);
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrabajos(); }, [fetchTrabajos]);

  const filtered = useMemo(() =>
    filtroEtapa === 'todos' ? trabajos : trabajos.filter(t => t.etapa_actual === filtroEtapa),
    [trabajos, filtroEtapa]
  );

  const counts = useMemo(() => {
    const c = { todos: trabajos.length };
    ETAPAS.forEach(e => { c[e.value] = trabajos.filter(t => t.etapa_actual === e.value).length; });
    return c;
  }, [trabajos]);

  const handleUpdated = (updatedTrabajo, newAct) => {
    setTrabajos(prev => prev.map(t =>
      t.id === updatedTrabajo.id
        ? { ...updatedTrabajo, trabajo_actualizaciones: [...(t.trabajo_actualizaciones || []), newAct] }
        : t
    ));
    setDetalle(prev => prev
      ? { ...updatedTrabajo, trabajo_actualizaciones: [...(prev.trabajo_actualizaciones || []), newAct] }
      : null
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trabajos en Proceso</h1>
          <p className="text-slate-500 text-sm mt-0.5">Seguimiento de trabajos activos por etapa</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-medium">{trabajos.length} trabajos</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="text-green-600 font-bold">
            {counts['completado'] || 0} completados
          </span>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
          <AlertTriangle size={15} /> {apiError}
        </div>
      )}

      {/* Filtros por etapa */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFiltro('todos')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filtroEtapa === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Todos ({counts.todos})
        </button>
        {ETAPAS.map(e => (
          <button key={e.value} onClick={() => setFiltro(e.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filtroEtapa === e.value ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            style={filtroEtapa === e.value ? { background: e.color } : {}}>
            {e.label} {counts[e.value] > 0 && `(${counts[e.value]})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3" />
          Cargando trabajos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <ClipboardList size={40} className="text-slate-200" />
          <p className="font-medium">
            {filtroEtapa === 'todos' ? 'No hay trabajos registrados.' : `No hay trabajos en etapa "${getEtapa(filtroEtapa).label}".`}
          </p>
          <p className="text-xs">Los trabajos se crean automáticamente al aprobar una cotización.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TrabajoCard key={t.id} trabajo={t} onClick={() => setDetalle(t)} />
          ))}
        </div>
      )}

      {/* Panel de detalle */}
      {detalle && (
        <DetallePanel
          trabajo={detalle}
          currentUser={currentUser}
          onClose={() => setDetalle(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default TrabajosSection;
