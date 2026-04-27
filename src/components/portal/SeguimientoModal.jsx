import { useState } from 'react';
import {
  X, Search, AlertTriangle, CheckCircle2, Clock, Hammer,
  Paintbrush, Wrench, Sparkles, Check, AlertCircle,
} from 'lucide-react';

const ETAPAS = [
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

const Stepper = ({ etapaActual }) => {
  const idx = ETAPAS.findIndex(e => e.value === etapaActual);
  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {ETAPAS.map((e, i) => (
        <div key={e.value} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${i === idx ? 'ring-2 ring-offset-2' : ''}`}
              style={{
                background:  i <= idx ? e.color : '#e2e8f0',
                ringColor:   i === idx ? e.color : 'transparent',
              }}>
              {i < idx
                ? <Check size={14} className="text-white" strokeWidth={3} />
                : <e.Icon size={14} className={i <= idx ? 'text-white' : 'text-slate-400'} />
              }
            </div>
            <span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${i === idx ? 'text-slate-800' : i < idx ? 'text-slate-400' : 'text-slate-300'}`}>
              {e.label}
            </span>
          </div>
          {i < ETAPAS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${i < idx ? 'bg-green-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const SeguimientoModal = ({ onClose }) => {
  const [codigo, setCodigo]   = useState('');
  const [loading, setLoading] = useState(false);
  const [trabajo, setTrabajo] = useState(null);
  const [error, setError]     = useState('');

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true); setError(''); setTrabajo(null);
    try {
      const res  = await fetch(`/api/trabajo-publico?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se encontró el trabajo.');
      setTrabajo(data.trabajo);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const etapaActual = trabajo ? getEtapa(trabajo.etapa_actual) : null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl z-10">
        <button onClick={onClose}
          className="absolute -top-3 -right-3 z-20 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-all hover:rotate-90 duration-200">
          <X size={15} className="text-slate-500" />
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="px-8 pt-8 pb-7 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-400/10" />
            <div className="relative">
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-blue-300 mb-2">ECG Corporativo</p>
              <h2 className="text-2xl font-black text-white">Seguimiento de Trabajo</h2>
              <p className="text-blue-200 text-sm mt-1 font-medium">Ingresa el código de tu trabajo para ver el progreso.</p>

              {/* Campo de búsqueda */}
              <form onSubmit={handleBuscar} className="mt-5 flex gap-2">
                <div className="flex-1 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 focus-within:bg-white/15 transition-colors">
                  <Search size={16} className="text-blue-300 flex-shrink-0" />
                  <input
                    value={codigo}
                    onChange={e => { setCodigo(e.target.value.toUpperCase()); setError(''); setTrabajo(null); }}
                    placeholder="ECG-XXXXXX"
                    maxLength={10}
                    className="flex-1 bg-transparent text-white font-mono font-bold text-sm placeholder-blue-300/60 focus:outline-none tracking-wider"
                  />
                </div>
                <button type="submit" disabled={loading || !codigo.trim()}
                  className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0">
                  {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search size={15} />}
                  Buscar
                </button>
              </form>
            </div>
          </div>

          {/* Resultado */}
          <div className="px-8 py-6 min-h-[200px]">
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-4 py-3.5 font-semibold text-sm">
                <AlertCircle size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            {!trabajo && !error && !loading && (
              <div className="text-center py-8 text-slate-400">
                <Search size={36} className="mx-auto mb-3 text-slate-200" />
                <p className="font-medium">Ingresa tu código de trabajo para rastrear el progreso.</p>
                <p className="text-xs mt-1">El código tiene el formato ECG-XXXXXX</p>
              </div>
            )}

            {trabajo && etapaActual && (
              <div className="space-y-6">
                {/* Info del trabajo */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</p>
                    <p className="font-extrabold text-slate-800 text-lg leading-tight">{trabajo.cliente}</p>
                    {trabajo.folio && <p className="text-xs text-slate-400 mt-0.5">Folio: {trabajo.folio}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-black text-sm px-3 py-1.5 rounded-xl"
                      style={{ background: etapaActual.bg, color: etapaActual.color }}>
                      {trabajo.codigo}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Iniciado: {fmtDate(trabajo.created_at).split(',')[0]}
                    </span>
                  </div>
                </div>

                {/* Etapa actual destacada */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2"
                  style={{ borderColor: etapaActual.color + '40', background: etapaActual.bg }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: etapaActual.color }}>
                    <etapaActual.Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Etapa actual</p>
                    <p className="font-extrabold text-lg leading-tight" style={{ color: etapaActual.color }}>
                      {etapaActual.label}
                    </p>
                  </div>
                  {trabajo.etapa_actual === 'completado' && (
                    <CheckCircle2 size={24} className="ml-auto text-green-500" />
                  )}
                </div>

                {/* Stepper */}
                <Stepper etapaActual={trabajo.etapa_actual} />

                {/* Historial */}
                {trabajo.trabajo_actualizaciones?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Historial de avances</p>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {[...trabajo.trabajo_actualizaciones].reverse().map((a, i) => {
                        const ae = getEtapa(a.etapa);
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: ae.bg }}>
                              <ae.Icon size={13} style={{ color: ae.color }} />
                            </div>
                            <div className="flex-1 pb-3 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-black" style={{ color: ae.color }}>{ae.label}</span>
                                <span className="text-[10px] text-slate-400">{fmtDate(a.created_at)}</span>
                              </div>
                              {a.descripcion && <p className="text-sm text-slate-600">{a.descripcion}</p>}
                              {a.inconveniente && (
                                <div className="mt-1 flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                                  <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-700 font-medium">{a.inconveniente}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoModal;
