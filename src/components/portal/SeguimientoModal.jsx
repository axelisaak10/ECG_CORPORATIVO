import { useState, useRef, useEffect } from 'react';
import {
  X, Send, Bot, CheckCircle2, Clock, Hammer,
  Paintbrush, Wrench, Sparkles, Check, AlertTriangle, Search,
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
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};

// ── Stepper compacto ──────────────────────────────────────────────────────────
const Stepper = ({ etapaActual }) => {
  const idx = ETAPAS.findIndex(e => e.value === etapaActual);
  return (
    <div className="flex items-start w-full overflow-x-auto pb-1 mt-3">
      {ETAPAS.map((e, i) => (
        <div key={e.value} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i === idx ? 'ring-2 ring-offset-1' : ''}`}
              style={{ background: i <= idx ? e.color : '#e2e8f0', ringColor: i === idx ? e.color : 'transparent' }}>
              {i < idx
                ? <Check size={12} className="text-white" strokeWidth={3} />
                : <e.Icon size={12} className={i <= idx ? 'text-white' : 'text-slate-400'} />}
            </div>
            <span className={`text-[8px] font-bold mt-1 whitespace-nowrap ${i === idx ? 'text-slate-800' : i < idx ? 'text-slate-400' : 'text-slate-300'}`}>
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

// ── Tarjeta de trabajo (mensaje del bot) ──────────────────────────────────────
const TrabajoCard = ({ trabajo }) => {
  const [showHistory, setShowHistory] = useState(false);
  const etapa = getEtapa(trabajo.etapa_actual);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-sm">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: etapa.bg, borderBottom: `2px solid ${etapa.color}20` }}>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente</p>
          <p className="font-extrabold text-slate-800 leading-tight">{trabajo.cliente}</p>
          {trabajo.folio && <p className="text-xs text-slate-400">Folio: {trabajo.folio}</p>}
        </div>
        <div className="text-right">
          <span className="font-mono font-black text-sm px-2 py-1 rounded-lg" style={{ background: etapa.color + '22', color: etapa.color }}>
            {trabajo.codigo}
          </span>
        </div>
      </div>
      {/* Etapa */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: etapa.color }}>
          <etapa.Icon size={17} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Etapa actual</p>
          <p className="font-extrabold text-base leading-tight" style={{ color: etapa.color }}>{etapa.label}</p>
        </div>
        {trabajo.etapa_actual === 'completado' && <CheckCircle2 size={20} className="ml-auto text-green-500" />}
      </div>
      {/* Stepper */}
      <div className="px-4 pb-2">
        <Stepper etapaActual={trabajo.etapa_actual} />
      </div>
      {/* Historial toggle */}
      {trabajo.trabajo_actualizaciones?.length > 0 && (
        <div className="px-4 pb-3">
          <button onClick={() => setShowHistory(h => !h)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {showHistory ? '▲ Ocultar historial' : `▼ Ver historial (${trabajo.trabajo_actualizaciones.length} actualización${trabajo.trabajo_actualizaciones.length !== 1 ? 'es' : ''})`}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {[...trabajo.trabajo_actualizaciones].reverse().map((a, i) => {
                const ae = getEtapa(a.etapa);
                return (
                  <div key={i} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: ae.bg }}>
                      <ae.Icon size={11} style={{ color: ae.color }} />
                    </div>
                    <div className="flex-1 pb-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black" style={{ color: ae.color }}>{ae.label}</span>
                        <span className="text-[9px] text-slate-400">{fmtDateTime(a.created_at)}</span>
                      </div>
                      {a.descripcion && <p className="text-xs text-slate-600">{a.descripcion}</p>}
                      {a.inconveniente && (
                        <div className="mt-1 flex items-start gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                          <AlertTriangle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-700 font-medium">{a.inconveniente}</p>
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
    </div>
  );
};

// ── Burbuja bot ───────────────────────────────────────────────────────────────
const BotMsg = ({ children, typing = false }) => (
  <div className="flex items-end gap-2 mb-3 animate-fadeIn">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow">
      <Bot size={15} className="text-white" />
    </div>
    <div className="max-w-[80%]">
      {typing ? (
        <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex gap-1 items-center h-4">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-800 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  </div>
);

// ── Burbuja usuario ───────────────────────────────────────────────────────────
const UserMsg = ({ text }) => (
  <div className="flex justify-end mb-3 animate-fadeIn">
    <div className="max-w-[75%] bg-blue-600 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white font-mono font-bold tracking-widest shadow">
      {text}
    </div>
  </div>
);

// ── Burbuja de tarjeta de trabajo ─────────────────────────────────────────────
const TrabajoMsg = ({ trabajo }) => (
  <div className="flex items-end gap-2 mb-3 animate-fadeIn">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow">
      <Bot size={15} className="text-white" />
    </div>
    <TrabajoCard trabajo={trabajo} />
  </div>
);

// ── Modal principal ───────────────────────────────────────────────────────────
const SeguimientoModal = ({ onClose }) => {
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot-text', text: '¡Hola! Soy el asistente de seguimiento de ECG Corporativo. 👋' },
    { id: 2, type: 'bot-text', text: 'Ingresa el código de tu trabajo (formato ECG-XXXXXX) y te mostraré el estado actual.' },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);

  const handleSend = async () => {
    const code = input.trim().toUpperCase();
    if (!code || loading) return;

    addMsg({ type: 'user', text: code });
    setInput('');
    setLoading(true);
    addMsg({ type: 'typing' });

    try {
      const res  = await fetch(`/api/trabajos?codigo=${encodeURIComponent(code)}`);
      const data = await res.json();

      setMessages(prev => prev.filter(m => m.type !== 'typing'));

      if (!res.ok) {
        addMsg({ type: 'bot-text', text: `❌ No encontré ningún trabajo con el código ${code}. Verifica que sea correcto (ej. ECG-A3BK72).` });
        addMsg({ type: 'bot-text', text: '¿Quieres intentar con otro código?' });
      } else {
        addMsg({ type: 'bot-text', text: `¡Encontré tu trabajo! 🎉 Aquí está el estado actual:` });
        addMsg({ type: 'bot-trabajo', trabajo: data.trabajo });
        if (data.trabajo.etapa_actual === 'completado') {
          addMsg({ type: 'bot-text', text: '✅ Tu trabajo está completado. ¡Gracias por confiar en ECG Corporativo!' });
        } else {
          addMsg({ type: 'bot-text', text: '¿Necesitas más información? Puedes consultar otro código en cualquier momento.' });
        }
      }
    } catch {
      setMessages(prev => prev.filter(m => m.type !== 'typing'));
      addMsg({ type: 'bot-text', text: '⚠️ Hubo un problema de conexión. Intenta de nuevo en un momento.' });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md z-10 flex flex-col h-[90vh] sm:h-[600px] sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-white text-sm leading-tight">Asistente ECG</p>
            <p className="text-blue-200 text-xs">Seguimiento de trabajos</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 space-y-0">
          {messages.map(m => {
            if (m.type === 'bot-text')    return <BotMsg key={m.id}>{m.text}</BotMsg>;
            if (m.type === 'typing')      return <BotMsg key={m.id} typing />;
            if (m.type === 'user')        return <UserMsg key={m.id} text={m.text} />;
            if (m.type === 'bot-trabajo') return <TrabajoMsg key={m.id} trabajo={m.trabajo} />;
            return null;
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="ECG-XXXXXX"
              maxLength={10}
              className="flex-1 bg-transparent text-slate-800 font-mono font-bold text-sm placeholder-slate-300 focus:outline-none tracking-wider"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center transition-all shadow-sm flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeguimientoModal;
