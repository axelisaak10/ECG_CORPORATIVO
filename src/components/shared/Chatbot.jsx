import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, ChevronRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// BASE DE CONOCIMIENTO — edita aquí las preguntas y respuestas del chatbot
// ─────────────────────────────────────────────────────────────────────────────
const QA = [
  {
    id: 'bienvenida',
    question: '¿Qué es ECG Corporativo?',
    answer: 'ECG Corporativo es un grupo empresarial mexicano con sede en Querétaro, fundado por el Ing. Juan Erasmo Cuaya G. Agrupa tres empresas especializadas en capacitación industrial, sustentabilidad energética e ingeniería integral.',
    suggestions: ['¿Cuáles son sus empresas?', '¿Dónde están ubicados?', '¿Cómo los contacto?'],
  },
  {
    id: 'empresas',
    question: '¿Cuáles son sus empresas?',
    answer: 'El grupo está conformado por:\n\n🎓 Centro de Capacitación ECG — Formación profesional especializada en seguridad, medio ambiente y desarrollo organizacional.\n\n⚡ JECG Proyectos de Sustentabilidad — Eficiencia energética, energía renovable y proyectos de sustentabilidad.\n\n🔧 Centro de Ingeniería y Abastecimiento ECG — Ingeniería industrial, subestaciones eléctricas, mantenimiento y abastecimiento.',
    suggestions: ['Capacitación ECG', 'JECG Sustentabilidad', 'Ingeniería ECG'],
  },
  {
    id: 'capacitacion',
    question: 'Capacitación ECG',
    answer: 'El Centro de Capacitación ECG ofrece:\n• Sistemas de Gestión Ambiental (ISO 14001)\n• Seguridad e Higiene Industrial (NOMs)\n• Desarrollo Organizacional y Liderazgo\n• Mantenimiento Industrial (TPM)\n• Electricidad Industrial (NOM-029)\n• Cumplimiento de Código RED\n\nIdeal para empresas que necesitan cumplir con normativas laborales y ambientales.',
    suggestions: ['¿Cómo los contacto?', 'Ver otras empresas', '¿Dónde están ubicados?'],
  },
  {
    id: 'sustentabilidad',
    question: 'JECG Sustentabilidad',
    answer: 'JECG Proyectos de Sustentabilidad se especializa en:\n• Cambios de tarifas eléctricas\n• Corrección de factor de potencia\n• Motores eficientes y arranques suaves\n• Estudios de calidad de energía\n• Sistemas de cogeneración\n• Amparos para DAP (Derecho de Alumbrado Público)\n\nAhorra hasta un 40% en tu consumo energético.',
    suggestions: ['¿Cómo los contacto?', 'Ver otras empresas', '¿Cuánto puedo ahorrar?'],
  },
  {
    id: 'ingenieria',
    question: 'Ingeniería ECG',
    answer: 'El Centro de Ingeniería y Abastecimiento ECG ofrece desde el año 2000:\n• Diseño e instalación de subestaciones eléctricas\n• Optimización de layout industrial\n• Sistemas eléctricos, neumáticos e hidráulicos\n• Pailería especializada (MIG/TIG)\n• Mobiliario industrial a medida\n• Construcción de almacenes\n\n+20 años de experiencia en el sector.',
    suggestions: ['¿Cómo los contacto?', 'Ver otras empresas', '¿Dónde están ubicados?'],
  },
  {
    id: 'ubicacion',
    question: '¿Dónde están ubicados?',
    answer: 'ECG Corporativo tiene su sede en **Querétaro, Querétaro, México** y brinda cobertura en toda la Zona Centro y Bajío:\n\n📍 Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas.',
    suggestions: ['¿Cómo los contacto?', '¿Qué es ECG Corporativo?'],
  },
  {
    id: 'contacto',
    question: '¿Cómo los contacto?',
    answer: 'Puedes contactar a ECG Corporativo por los siguientes medios:\n\n📞 Teléfono / WhatsApp: +52 (442) 773-4562\n\n📧 Capacitación: centroecging@gmail.com\n📧 Ingeniería: facturacionecging@gmail.com\n\n📱 Redes sociales: @ecg_corporativo_qro en Instagram y TikTok',
    suggestions: ['¿Qué es ECG Corporativo?', '¿Cuáles son sus empresas?'],
  },
  {
    id: 'ahorro',
    question: '¿Cuánto puedo ahorrar?',
    answer: 'Con los proyectos de JECG Sustentabilidad, las empresas logran ahorros de energía eléctrica del **20% al 40%** dependiendo del diagnóstico inicial.\n\nLos servicios más demandados son:\n• Corrección de factor de potencia\n• Cambio de tarifa eléctrica\n• Estudios de calidad de energía\n\nContacta a JECG para un diagnóstico gratuito.',
    suggestions: ['¿Cómo los contacto?', 'JECG Sustentabilidad'],
  },
  {
    id: 'otras-empresas',
    question: 'Ver otras empresas',
    answer: 'Las tres empresas del Grupo ECG atienden diferentes necesidades:\n\n🎓 ¿Necesitas capacitar a tu personal? → Centro de Capacitación ECG\n\n⚡ ¿Quieres reducir tu factura de luz? → JECG Sustentabilidad\n\n🔧 ¿Tienes proyectos de ingeniería industrial? → Centro de Ingeniería ECG\n\n¿Sobre cuál quieres saber más?',
    suggestions: ['Capacitación ECG', 'JECG Sustentabilidad', 'Ingeniería ECG'],
  },
];

const INITIAL_SUGGESTIONS = [
  '¿Qué es ECG Corporativo?',
  '¿Cuáles son sus empresas?',
  '¿Cómo los contacto?',
  '¿Dónde están ubicados?',
];

const BOT_NAME = 'ECG Asistente';

// ─────────────────────────────────────────────────────────────────────────────

function getBotResponse(input) {
  const text = input.toLowerCase().trim();
  const match = QA.find(q =>
    q.question.toLowerCase().includes(text) ||
    text.includes(q.id) ||
    q.question.toLowerCase().split(' ').some(word => word.length > 4 && text.includes(word))
  );
  return match || {
    answer: 'No encontré una respuesta exacta para eso. Puedes contactarnos directamente al +52 (442) 773-4562 o por correo a centroecging@gmail.com y con gusto te ayudamos.',
    suggestions: ['¿Qué es ECG Corporativo?', '¿Cómo los contacto?', '¿Cuáles son sus empresas?'],
  };
}

// Convierte **texto** en negritas simples
function formatText(text) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/\*\*(.+?)\*\*/).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      )}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Chatbot({ userName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `¡Hola${userName ? `, ${userName.split(' ')[0]}` : ''}! 👋 Soy el asistente virtual de ECG Corporativo. ¿En qué puedo ayudarte hoy?`,
      suggestions: INITIAL_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');

    setMessages(prev => [...prev, { from: 'user', text: userText }]);
    setTyping(true);

    setTimeout(() => {
      const response = getBotResponse(userText);
      setMessages(prev => [...prev, {
        from: 'bot',
        text: response.answer,
        suggestions: response.suggestions || [],
      }]);
      setTyping(false);
    }, 700);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 left-6 z-[60] flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-sm"
        title="Chat de ayuda"
      >
        {open ? <X size={18} /> : <MessageSquare size={18} />}
        {!open && 'Asistente ECG'}
        {/* Ping cuando está cerrado */}
        {!open && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-ping" />}
        {!open && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />}
      </button>

      {/* ── Ventana de chat ── */}
      <div className={`fixed bottom-20 left-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-400 origin-bottom-left ${
        open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
      }`} style={{ height: '520px' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none">{BOT_NAME}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-blue-200 text-[11px] font-medium">En línea</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Burbuja */}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.from === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-slate-700 rounded-bl-md border border-slate-100'
              }`}>
                {msg.from === 'bot' ? formatText(msg.text) : msg.text}
              </div>

              {/* Sugerencias */}
              {msg.from === 'bot' && msg.suggestions?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-full">
                  {msg.suggestions.map((s, si) => (
                    <button
                      key={si}
                      onClick={() => sendMessage(s)}
                      className="flex items-center gap-1 bg-white border border-blue-100 text-blue-600 text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                    >
                      <ChevronRight size={10} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Indicador de escritura */}
          {typing && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1.5 items-center">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
