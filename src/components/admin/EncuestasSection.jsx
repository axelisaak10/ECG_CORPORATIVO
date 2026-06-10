import { useState, useEffect } from 'react';
import {
  Star, ClipboardCheck, BarChart3, Key, ListChecks,
  Plus, Trash2, Pencil, X, AlertCircle, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, Copy, Check,
  MessageSquare, Users, TrendingUp,
} from 'lucide-react';
import {
  apiEncuestaGetPreguntas, apiEncuestaCreatePregunta, apiEncuestaUpdatePregunta,
  apiEncuestaDeletePregunta, apiEncuestaGetCodigos, apiEncuestaCreateCodigo,
  apiEncuestaDeleteCodigo, apiEncuestaGetEstadisticas,
} from '../../utils/api';

/* ─── Sub-tabs ─── */
const TABS = [
  { id: 'estadisticas', label: 'Estadísticas',  icon: <BarChart3 size={15} />   },
  { id: 'codigos',      label: 'Códigos',        icon: <Key size={15} />         },
  { id: 'preguntas',    label: 'Preguntas',      icon: <ListChecks size={15} />  },
];

/* ─── Modal genérico ─── */
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg z-10">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X size={16} className="text-slate-500" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/* ─── Notificación inline ─── */
const Alert = ({ msg, type = 'error' }) => {
  if (!msg) return null;
  const styles = type === 'error'
    ? 'bg-red-50 border-red-100 text-red-600'
    : 'bg-green-50 border-green-100 text-green-600';
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm border ${styles}`}>
      <Icon size={15} className="flex-shrink-0 mt-0.5" />
      {msg}
    </div>
  );
};

/* ─── Copiar al portapapeles ─── */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handle}
      title="Copiar código"
      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
   PESTAÑA: ESTADÍSTICAS
────────────────────────────────────────────────────────────────────────────── */
const EstadisticasTab = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    apiEncuestaGetEstadisticas()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-20 flex flex-col items-center text-slate-400 gap-3">
      <Loader2 size={32} className="animate-spin" />
      <p className="text-sm">Cargando estadísticas...</p>
    </div>
  );
  if (!stats) return <div className="py-16 text-center text-slate-400">Error al cargar estadísticas.</div>;

  const pct = stats.total_codigos > 0 ? Math.round((stats.total_completados / stats.total_codigos) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <Key size={18} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{stats.total_codigos}</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Códigos generados</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={18} className="text-green-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{stats.total_completados}</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Encuestas completadas</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-800">{pct}%</p>
          <p className="text-xs text-slate-400 font-semibold mt-1">Tasa de respuesta</p>
        </div>
      </div>

      {/* Barra de progreso general */}
      {stats.total_codigos > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-extrabold text-slate-700">Tasa de respuesta global</p>
            <span className="text-sm font-black text-indigo-600">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {stats.total_completados} de {stats.total_codigos} códigos fueron respondidos
          </p>
        </div>
      )}

      {/* Por pregunta */}
      {stats.stats_por_pregunta?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Respuestas por pregunta</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.stats_por_pregunta.map((p, i) => (
              <div key={p.pregunta_id} className="p-5">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-start justify-between gap-4 text-left"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${p.tipo === 'multiple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 leading-snug">{p.texto}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.tipo === 'multiple' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {p.tipo === 'multiple' ? 'Opción múltiple' : 'Abierta'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{p.total} respuesta{p.total !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  {expanded === i ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0 mt-1" />}
                </button>

                {expanded === i && p.total > 0 && (
                  <div className="mt-4 ml-10">
                    {p.tipo === 'multiple' ? (
                      <div className="space-y-2.5">
                        {Object.entries(p.conteo || {}).sort((a, b) => b[1] - a[1]).map(([opcion, count]) => {
                          const barPct = p.total > 0 ? Math.round((count / p.total) * 100) : 0;
                          return (
                            <div key={opcion}>
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                                <span className="truncate">{opcion}</span>
                                <span className="ml-2 flex-shrink-0 text-slate-400">{count} ({barPct}%)</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full" style={{ width: `${barPct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(p.comentarios || []).map((c, ci) => (
                          <div key={ci} className="flex items-start gap-2.5 bg-slate-50 rounded-xl px-3.5 py-2.5">
                            <MessageSquare size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{c}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {expanded === i && p.total === 0 && (
                  <p className="mt-3 ml-10 text-xs text-slate-400 italic">Sin respuestas aún.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.stats_por_pregunta?.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 text-center">
          <BarChart3 size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-sm">Aún no hay preguntas o respuestas registradas.</p>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
   PESTAÑA: CÓDIGOS
────────────────────────────────────────────────────────────────────────────── */
const CodigosTab = ({ currentUser }) => {
  const [codigos, setCodigos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ cliente: '', descripcion: '' });
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState({ text: '', type: '' });
  const [confirmDel, setConfirmDel] = useState(null);
  const [newCode, setNewCode]     = useState(null);

  const isAdmin = (currentUser?.nivel ?? 0) >= 2;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchCodigos = () => {
    setLoading(true);
    apiEncuestaGetCodigos()
      .then(setCodigos)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCodigos(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    if (!form.cliente.trim()) return setMsg({ text: 'El nombre del cliente es requerido.', type: 'error' });
    setSaving(true);
    try {
      const created = await apiEncuestaCreateCodigo(form);
      setNewCode(created.codigo);
      setMsg({ text: '¡Código generado exitosamente!', type: 'success' });
      setForm({ cliente: '', descripcion: '' });
      fetchCodigos();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await apiEncuestaDeleteCodigo(id).catch(console.error);
    setConfirmDel(null);
    fetchCodigos();
  };

  return (
    <div className="space-y-5">
      {/* Nueva código modal */}
      {showModal && (
        <Modal title="Generar Código de Encuesta" onClose={() => { setShowModal(false); setMsg({ text: '', type: '' }); setNewCode(null); }}>
          {newCode ? (
            <div className="px-6 py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <h4 className="font-black text-slate-800 mb-2">Código generado</h4>
              <p className="text-slate-400 text-sm mb-6">Comparte este código con el cliente para que pueda acceder a la encuesta.</p>
              <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-2xl px-6 py-4 border-2 border-dashed border-slate-200 mb-6">
                <span className="text-2xl font-black tracking-widest text-blue-700 font-mono">{newCode}</span>
                <CopyButton text={newCode} />
              </div>
              <button
                onClick={() => { setShowModal(false); setNewCode(null); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {msg.text && <Alert msg={msg.text} type={msg.type} />}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre del cliente *</label>
                <input
                  value={form.cliente}
                  onChange={e => set('cliente', e.target.value)}
                  placeholder="Ej. Juan Pérez / Empresa ABC"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción / Nota (opcional)</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  placeholder="Ej. Dictamen eléctrico instalaciones norte"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                  {saving ? 'Generando...' : 'Generar código'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">
            <span className="text-slate-800 font-black">{codigos.length}</span> código{codigos.length !== 1 ? 's' : ''} generado{codigos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          id="generar-codigo-encuesta-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
        >
          <Plus size={15} />
          Generar código
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center text-slate-400 gap-3">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Cargando códigos...</p>
          </div>
        ) : codigos.length === 0 ? (
          <div className="py-16 text-center">
            <Key size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No hay códigos generados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Código</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Generado por</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {codigos.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-blue-700 text-sm tracking-wide">{c.codigo}</span>
                        <CopyButton text={c.codigo} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800 text-sm">{c.cliente}</p>
                      {c.descripcion && <p className="text-xs text-slate-400 truncate max-w-[140px]">{c.descripcion}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 font-medium">{c.generado_por}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.usado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.usado ? '✓ Usado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isAdmin && (confirmDel === c.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDelete(c.id)} className="text-xs bg-red-600 text-white font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-700">Eliminar</button>
                          <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1.5 rounded-lg">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDel(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
   PESTAÑA: PREGUNTAS
────────────────────────────────────────────────────────────────────────────── */
const TIPOS = [
  { value: 'abierta',   label: 'Respuesta abierta',   icon: <MessageSquare size={14} /> },
  { value: 'multiple',  label: 'Opción múltiple',      icon: <ListChecks size={14} />   },
];

const PreguntaForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm]     = useState(initial || { texto: '', tipo: 'abierta', opciones: ['', ''], orden: 0, activa: true });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setOpcion = (i, v) => setForm(f => { const o = [...f.opciones]; o[i] = v; return { ...f, opciones: o }; });
  const addOpcion = () => setForm(f => ({ ...f, opciones: [...f.opciones, ''] }));
  const removeOpcion = (i) => setForm(f => ({ ...f, opciones: f.opciones.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.texto.trim()) return setError('El texto de la pregunta es requerido.');
    if (form.tipo === 'multiple') {
      const opts = form.opciones.filter(o => o.trim());
      if (opts.length < 2) return setError('Agrega al menos 2 opciones para pregunta de opción múltiple.');
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        opciones: form.opciones.filter(o => o.trim()),
        orden: Number(form.orden) || 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
      {error && <Alert msg={error} type="error" />}

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pregunta *</label>
        <textarea
          value={form.texto}
          onChange={e => set('texto', e.target.value)}
          placeholder="¿Cómo calificarías la atención recibida?"
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none placeholder-slate-300"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de respuesta</label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('tipo', t.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.tipo === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-200'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {form.tipo === 'multiple' && (
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Opciones</label>
          <div className="space-y-2">
            {form.opciones.map((op, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5 text-center">{i + 1}.</span>
                <input
                  value={op}
                  onChange={e => setOpcion(i, e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {form.opciones.length > 2 && (
                  <button type="button" onClick={() => removeOpcion(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOpcion} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-1">
              <Plus size={13} /> Agregar opción
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Orden</label>
          <input
            type="number"
            min={0}
            value={form.orden}
            onChange={e => set('orden', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado</label>
          <select
            value={form.activa ? 'true' : 'false'}
            onChange={e => set('activa', e.target.value === 'true')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          {saving ? 'Guardando...' : 'Guardar pregunta'}
        </button>
      </div>
    </form>
  );
};

const PreguntasTab = () => {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPreguntas = () => {
    setLoading(true);
    apiEncuestaGetPreguntas()
      .then(setPreguntas)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPreguntas(); }, []);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleCreate = async (fields) => {
    await apiEncuestaCreatePregunta(fields);
    setShowNew(false);
    fetchPreguntas();
    showSuccess('Pregunta creada correctamente.');
  };

  const handleUpdate = async (fields) => {
    await apiEncuestaUpdatePregunta(editItem.id, fields);
    setEditItem(null);
    fetchPreguntas();
    showSuccess('Pregunta actualizada correctamente.');
  };

  const handleDelete = async (id) => {
    await apiEncuestaDeletePregunta(id).catch(console.error);
    setConfirmDel(null);
    fetchPreguntas();
  };

  return (
    <div className="space-y-5">
      {showNew && (
        <Modal title="Nueva pregunta" onClose={() => setShowNew(false)}>
          <PreguntaForm onSave={handleCreate} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
      {editItem && (
        <Modal title="Editar pregunta" onClose={() => setEditItem(null)}>
          <PreguntaForm initial={editItem} onSave={handleUpdate} onCancel={() => setEditItem(null)} />
        </Modal>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">
          <span className="text-slate-800 font-black">{preguntas.filter(p => p.activa).length}</span> pregunta{preguntas.filter(p => p.activa).length !== 1 ? 's' : ''} activa{preguntas.filter(p => p.activa).length !== 1 ? 's' : ''}
          {preguntas.filter(p => !p.activa).length > 0 && <span className="text-slate-400 font-medium"> / {preguntas.filter(p => !p.activa).length} inactiva{preguntas.filter(p => !p.activa).length !== 1 ? 's' : ''}</span>}
        </p>
        <button
          onClick={() => setShowNew(true)}
          id="nueva-pregunta-encuesta-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
        >
          <Plus size={15} />
          Nueva pregunta
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center text-slate-400 gap-3">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Cargando preguntas...</p>
          </div>
        ) : preguntas.length === 0 ? (
          <div className="py-16 text-center">
            <ListChecks size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No hay preguntas creadas.</p>
            <p className="text-slate-300 text-xs mt-1">Agrega preguntas para comenzar a recopilar opiniones.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {preguntas.map((p, i) => (
              <div key={p.id} className={`flex items-start gap-4 px-5 py-4 ${!p.activa ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black ${p.tipo === 'multiple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm leading-snug">{p.texto}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.tipo === 'multiple' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {p.tipo === 'multiple' ? 'Opción múltiple' : 'Abierta'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.activa ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      {p.activa ? 'Activa' : 'Inactiva'}
                    </span>
                    {p.tipo === 'multiple' && p.opciones?.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">{p.opciones.length} opciones</span>
                    )}
                  </div>
                  {p.tipo === 'multiple' && p.opciones?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.opciones.slice(0, 4).map((op, oi) => (
                        <span key={oi} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{op}</span>
                      ))}
                      {p.opciones.length > 4 && <span className="text-[11px] text-slate-400 font-medium">+{p.opciones.length - 4} más</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditItem(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Pencil size={14} />
                  </button>
                  {confirmDel === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-600 text-white font-bold px-2 py-1 rounded-lg">Eliminar</button>
                      <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
   SECCIÓN PRINCIPAL
────────────────────────────────────────────────────────────────────────────── */
const EncuestasSection = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('estadisticas');
  const isAdmin = (currentUser?.nivel ?? 0) >= 2;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Encuestas de Satisfacción</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Gestiona preguntas, códigos y consulta estadísticas de satisfacción.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl mb-6 w-fit">
        {TABS.filter(t => t.id !== 'preguntas' || isAdmin).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === t.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'estadisticas' && <EstadisticasTab />}
      {activeTab === 'codigos'      && <CodigosTab currentUser={currentUser} />}
      {activeTab === 'preguntas' && isAdmin && <PreguntasTab />}
    </div>
  );
};

export default EncuestasSection;
