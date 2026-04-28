import { useState, useRef, useEffect } from 'react';
import {
  X, Search, CheckCircle2, Clock, Hammer, Paintbrush, Wrench,
  Sparkles, Check, AlertTriangle, GanttChartSquare, ChevronDown,
  ChevronUp, Settings, Package, Zap, Shield, Star, User,
} from 'lucide-react';

const ICON_MAP = {
  Clock, Hammer, Paintbrush, Wrench, Sparkles, CheckCircle2,
  Settings, Package, Zap, Shield, Star,
};
const getIcon = (name) => ICON_MAP[name] ?? Clock;

const DEFAULT_ETAPAS = [
  { value: 'recibido',    label: 'Recibido',    color: '#94a3b8', bg: '#f1f5f9', icon_name: 'Clock'        },
  { value: 'armado',      label: 'Armado',      color: '#3b82f6', bg: '#eff6ff', icon_name: 'Hammer'       },
  { value: 'pintura',     label: 'Pintura',     color: '#f59e0b', bg: '#fffbeb', icon_name: 'Paintbrush'   },
  { value: 'instalacion', label: 'Instalación', color: '#f97316', bg: '#fff7ed', icon_name: 'Wrench'       },
  { value: 'detallado',   label: 'Detallado',   color: '#8b5cf6', bg: '#f5f3ff', icon_name: 'Sparkles'     },
  { value: 'completado',  label: 'Completado',  color: '#10b981', bg: '#f0fdf4', icon_name: 'CheckCircle2' },
];

const getEtapa  = (etapas, v) => etapas.find(e => e.value === v) ?? etapas[0] ?? DEFAULT_ETAPAS[0];

const fmtDateTime = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};

// ── Gantt helpers ─────────────────────────────────────────────────────────────
const parseDate  = (d) => new Date(d + 'T00:00:00');
const fmtDateShort = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '';

function computeTimeline(tareas) {
  if (!tareas.length) return null;
  const starts = tareas.map(t => parseDate(t.fecha_inicio).getTime());
  const ends   = tareas.map(t => parseDate(t.fecha_fin).getTime());
  const min = Math.min(...starts), max = Math.max(...ends);
  return { min, max, total: Math.max(max - min, 86400000) };
}

function getMonthCols(tl) {
  const { min, max } = tl;
  const months = [];
  let cur = new Date(new Date(min).getFullYear(), new Date(min).getMonth(), 1);
  while (cur.getTime() <= max) {
    const s = Math.max(cur.getTime(), min);
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const e = Math.min(next.getTime(), max + 86400000);
    months.push({
      label: cur.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      left:  ((s - min) / tl.total) * 100,
      width: ((e - s) / tl.total) * 100,
    });
    cur = next;
  }
  return months;
}

function barProps(t, tl) {
  const s = parseDate(t.fecha_inicio).getTime();
  const e = parseDate(t.fecha_fin).getTime();
  return {
    left:  `${((s - tl.min) / tl.total) * 100}%`,
    width: `${((e - s) / tl.total) * 100}%`,
  };
}

// ── Gantt solo lectura ────────────────────────────────────────────────────────
const GanttReadOnly = ({ tareas }) => {
  const sorted = [...tareas].sort((a, b) => a.orden - b.orden || a.fecha_inicio.localeCompare(b.fecha_inicio));
  const tl = computeTimeline(sorted);
  if (!tl) return null;
  const months = getMonthCols(tl);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <div style={{ minWidth: 560 }}>
        {/* Encabezado meses */}
        <div className="flex bg-slate-50 border-b border-slate-100">
          <div className="w-40 flex-shrink-0 px-3 py-2 border-r border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Actividad</div>
          <div className="flex-1 relative h-8">
            {months.map((m, i) => (
              <div key={i} className="absolute top-0 h-full flex items-center border-r border-slate-100 last:border-0"
                style={{ left: `${m.left}%`, width: `${m.width}%` }}>
                <span className="px-2 text-[9px] font-bold text-slate-400 truncate">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="w-9 flex-shrink-0 border-l border-slate-100 text-center py-2 text-[9px] font-bold text-slate-400 uppercase">%</div>
        </div>

        {/* Filas */}
        {sorted.map((t, idx) => {
          const bp = barProps(t, tl);
          return (
            <div key={t.id} className={`flex items-center border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
              <div className="w-40 flex-shrink-0 px-3 py-2.5 border-r border-slate-50">
                <p className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-2">{t.nombre}</p>
                {t.responsable && (
                  <p className="text-[9px] text-slate-400 truncate mt-0.5 flex items-center gap-0.5">
                    <User size={8} />{t.responsable}
                  </p>
                )}
              </div>
              <div className="flex-1 relative h-10">
                {months.map((m, i) => (
                  <div key={i} className="absolute top-0 h-full border-r border-slate-50 last:border-0"
                    style={{ left: `${m.left}%`, width: `${m.width}%` }} />
                ))}
                <div className="absolute top-2 bottom-2 rounded-md overflow-hidden"
                  style={{ left: bp.left, width: bp.width, background: t.color + '30' }}>
                  <div className="h-full rounded-md" style={{ width: `${t.porcentaje}%`, background: t.color }} />
                </div>
              </div>
              <div className="w-9 flex-shrink-0 border-l border-slate-50 text-center py-2.5">
                <span className="text-[10px] font-black" style={{ color: t.color }}>{t.porcentaje}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Stepper ───────────────────────────────────────────────────────────────────
const Stepper = ({ etapaActual, etapas }) => {
  const idx = etapas.findIndex(e => e.value === etapaActual);
  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {etapas.map((e, i) => {
        const IconComp = getIcon(e.icon_name);
        return (
          <div key={e.value} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i === idx ? 'ring-2 ring-offset-1' : ''}`}
                style={{ background: i <= idx ? e.color : '#e2e8f0', ringColor: e.color }}>
                {i < idx
                  ? <Check size={12} className="text-white" strokeWidth={3} />
                  : <IconComp size={12} className={i <= idx ? 'text-white' : 'text-slate-400'} />}
              </div>
              <span className={`text-[8px] font-bold mt-1 whitespace-nowrap ${i === idx ? 'text-slate-800' : i < idx ? 'text-slate-400' : 'text-slate-300'}`}>
                {e.label}
              </span>
            </div>
            {i < etapas.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${i < idx ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────
const SeguimientoModal = ({ onClose }) => {
  const inputRef = useRef(null);
  const [query,       setQuery]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [trabajo,     setTrabajo]     = useState(null);
  const [notFound,    setNotFound]    = useState(false);
  const [connError,   setConnError]   = useState(false);
  const [etapas,      setEtapas]      = useState(DEFAULT_ETAPAS);
  const [gantt,       setGantt]       = useState(null);
  const [showGantt,   setShowGantt]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch('/api/catalogo?r=etapas')
      .then(r => r.json())
      .then(d => { if (d.etapas?.length) setEtapas(d.etapas); })
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSearch = async () => {
    const code = query.trim().toUpperCase();
    if (!code || loading) return;

    setLoading(true);
    setNotFound(false);
    setConnError(false);
    setTrabajo(null);
    setGantt(null);
    setShowGantt(false);
    setShowHistory(false);

    try {
      const res  = await fetch(`/api/trabajos?codigo=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        setNotFound(true);
      } else {
        setTrabajo(data.trabajo);
        if (data.trabajo?.cliente) {
          fetch(`/api/catalogo?r=gantt_publico&cliente=${encodeURIComponent(data.trabajo.cliente)}`)
            .then(r => r.json())
            .then(g => { if (g.proyecto && g.tareas?.length) setGantt(g); })
            .catch(() => {});
        }
      }
    } catch {
      setConnError(true);
    } finally {
      setLoading(false);
    }
  };

  const etapa     = trabajo ? getEtapa(etapas, trabajo.etapa_actual) : null;
  const EtapaIcon = etapa   ? getIcon(etapa.icon_name) : null;
  const isLast    = etapa   ? etapa.value === etapas[etapas.length - 1]?.value : false;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-xl z-10 flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Search size={17} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-white text-sm leading-tight">Rastrear trabajo</p>
            <p className="text-blue-200 text-xs">ECG Corporativo</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* Búsqueda */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Código de trabajo</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                <Search size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="ECG-XXXXXX"
                  maxLength={12}
                  className="flex-1 bg-transparent text-slate-800 font-mono font-bold text-sm placeholder-slate-300 focus:outline-none tracking-wider"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setTrabajo(null); setNotFound(false); setConnError(false); setGantt(null); }}
                    className="text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
              <button onClick={handleSearch} disabled={!query.trim() || loading}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold transition-all shadow-sm flex-shrink-0 min-w-[80px]">
                {loading
                  ? <span className="flex gap-1 items-center justify-center">{[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
                  : 'Buscar'}
              </button>
            </div>

            {notFound && (
              <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <X size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 font-medium">No se encontró el código <span className="font-mono font-black">{query}</span>. Verifica que sea correcto.</p>
              </div>
            )}
            {connError && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-600 font-medium">Problema de conexión. Intenta de nuevo.</p>
              </div>
            )}
          </div>

          {/* Estado vacío */}
          {!trabajo && !notFound && !connError && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search size={44} className="mb-4 text-slate-200" strokeWidth={1.5} />
              <p className="font-semibold text-slate-500">Consulta el estado de tu trabajo</p>
              <p className="text-sm text-slate-400 mt-1">Ingresa el código ECG que te proporcionamos</p>
            </div>
          )}

          {/* Resultado */}
          {trabajo && etapa && EtapaIcon && (
            <div className="px-5 pb-6 space-y-3">

              {/* Tarjeta estado */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: etapa.bg, borderBottom: `2px solid ${etapa.color}20` }}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente</p>
                    <p className="font-extrabold text-slate-800 text-base leading-tight">{trabajo.cliente}</p>
                    {trabajo.folio && <p className="text-xs text-slate-400 mt-0.5">Folio: {trabajo.folio}</p>}
                  </div>
                  <span className="font-mono font-black text-sm px-3 py-1.5 rounded-xl"
                    style={{ background: etapa.color + '22', color: etapa.color }}>
                    {trabajo.codigo}
                  </span>
                </div>

                <div className="px-5 py-4 flex items-center gap-4 border-b border-slate-100">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: etapa.color }}>
                    <EtapaIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa actual</p>
                    <p className="font-extrabold text-lg leading-tight" style={{ color: etapa.color }}>{etapa.label}</p>
                  </div>
                  {isLast && <CheckCircle2 size={22} className="ml-auto text-green-500" />}
                </div>

                <div className="px-5 py-4">
                  <Stepper etapaActual={trabajo.etapa_actual} etapas={etapas} />
                </div>

                {isLast && (
                  <div className="mx-5 mb-4 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-semibold">¡Tu trabajo está completado! Gracias por confiar en ECG Corporativo.</p>
                  </div>
                )}
              </div>

              {/* Historial */}
              {trabajo.trabajo_actualizaciones?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowHistory(h => !h)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <span>Historial de actualizaciones</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {trabajo.trabajo_actualizaciones.length}
                      </span>
                      {showHistory ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                    </div>
                  </button>
                  {showHistory && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-3 max-h-60 overflow-y-auto">
                      {[...trabajo.trabajo_actualizaciones].reverse().map((a, i) => {
                        const ae    = getEtapa(etapas, a.etapa);
                        const AeIcon = getIcon(ae.icon_name);
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: ae.bg }}>
                              <AeIcon size={12} style={{ color: ae.color }} />
                            </div>
                            <div className="flex-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-black" style={{ color: ae.color }}>{ae.label}</span>
                                <span className="text-[10px] text-slate-400">{fmtDateTime(a.created_at)}</span>
                              </div>
                              {a.descripcion && <p className="text-xs text-slate-600">{a.descripcion}</p>}
                              {a.inconveniente && (
                                <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                                  <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-700 font-medium">{a.inconveniente}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Cronograma Gantt */}
              {gantt && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowGantt(g => !g)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <GanttChartSquare size={15} className="text-blue-500" />
                      <span>Cronograma del proyecto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        {gantt.tareas.length} actividades
                      </span>
                      {showGantt ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                    </div>
                  </button>
                  {showGantt && (
                    <div className="border-t border-slate-100 p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{gantt.proyecto.nombre}</p>
                      <GanttReadOnly tareas={gantt.tareas} />
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeguimientoModal;
