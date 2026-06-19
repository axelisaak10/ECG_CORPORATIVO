import { useState } from 'react';
import {
  X, ClipboardCheck, ChevronRight, ChevronLeft, CheckCircle2,
  AlertCircle, Star, MessageSquare, ListChecks, UserPlus, Loader2,
} from 'lucide-react';
import { apiEncuestaValidar, apiEncuestaResponder, apiRegister, apiEncuestaResponderPublico } from '../../utils/api';

/* ─── Helpers ─── */
const STEP = { CODE: 'code', QUESTIONS: 'questions', SUCCESS: 'success' };

/* ─── Indicador de progreso ─── */
const ProgressBar = ({ current, total }) => (
  <div className="px-6 pt-4 pb-2">
    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
      <span>Pregunta {current} de {total}</span>
      <span>{Math.round((current / total) * 100)}%</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  </div>
);

/* ─── Registro opcional al final ─── */
const RegisterStep = ({ clienteNombre, onSkip, onDone }) => {
  const [form, setForm]     = useState({ name: clienteNombre || '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim())
      return setError('Todos los campos son requeridos.');
    if (form.password.length < 6)
      return setError('La contraseña debe tener al menos 6 caracteres.');
    setLoading(true);
    try {
      await apiRegister(form.name.trim(), form.email.trim(), form.password.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="px-8 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
          <CheckCircle2 size={30} className="text-white" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">¡Cuenta creada!</h3>
        <p className="text-slate-500 text-sm mb-6">Ya puedes iniciar sesión con tu correo y contraseña.</p>
        <button onClick={onDone} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all">
          Finalizar
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
          <UserPlus size={22} className="text-indigo-600" />
        </div>
        <h3 className="text-lg font-black text-slate-800">¿Quieres crear una cuenta?</h3>
        <p className="text-sm text-slate-400 mt-1">Accede al portal ECG Corporativo para dar seguimiento a tus trabajos.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm bg-red-50 border border-red-100 text-red-600">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre completo</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo electrónico</label>
          <input
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="correo@empresa.com"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            No, gracias
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── Modal principal ─── */
const EncuestaModal = ({ onClose }) => {
  const [step, setStep]           = useState(STEP.CODE);
  const [code, setCode]           = useState('');
  const [codigoData, setCodigoData] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [qIndex, setQIndex]       = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showRegister, setShowRegister] = useState(false);

  /* ── Validar código ── */
  const handleValidate = async (e) => {
    e.preventDefault();
    if (!code.trim()) return setError('Ingresa tu código.');
    setLoading(true);
    setError('');
    try {
      const res = await apiEncuestaValidar(code.trim().toUpperCase());
      setCodigoData(res.codigo);
      setPreguntas(res.preguntas);
      if (res.preguntas.length === 0) {
        setError('No hay preguntas activas en este momento. Por favor contacta a ECG Corporativo.');
        setLoading(false);
        return;
      }
      setStep(STEP.QUESTIONS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Responder como público general ── */
  const handlePublicSurvey = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiEncuestaResponderPublico();
      setCodigoData(res.codigo);
      setPreguntas(res.preguntas);
      if (res.preguntas.length === 0) {
        setError('No hay preguntas activas en este momento. Por favor contacta a ECG Corporativo.');
        setLoading(false);
        return;
      }
      setStep(STEP.QUESTIONS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Guardar respuesta actual ── */
  const currentQ = preguntas[qIndex];
  const currentAnswer = respuestas[currentQ?.id];

  const setAnswer = (preguntaId, value, isOpcion = false) => {
    setRespuestas(r => ({
      ...r,
      [preguntaId]: isOpcion
        ? { respuesta_opcion: value, respuesta_texto: null }
        : { respuesta_texto: value, respuesta_opcion: null },
    }));
  };

  const canProceed = () => {
    if (!currentQ) return false;
    const ans = respuestas[currentQ.id];
    if (!ans) return false;
    if (currentQ.tipo === 'abierta') return ans.respuesta_texto?.trim().length > 0;
    return !!ans.respuesta_opcion;
  };

  /* ── Enviar todas las respuestas ── */
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = preguntas.map(p => ({
        pregunta_id: p.id,
        respuesta_texto:  respuestas[p.id]?.respuesta_texto  || null,
        respuesta_opcion: respuestas[p.id]?.respuesta_opcion || null,
      }));
      await apiEncuestaResponder(codigoData.id, rows);
      setStep(STEP.SUCCESS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md z-10 overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight">Encuesta de Satisfacción</p>
              <p className="text-blue-200 text-[11px] font-medium">ECG Corporativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── PASO 1: Ingresar código ── */}
        {step === STEP.CODE && (
          <form onSubmit={handleValidate} className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Star size={28} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Tu opinión nos importa</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ingresa el código que te proporcionó nuestro equipo para acceder a la encuesta.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm bg-red-50 border border-red-100 text-red-600">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Código de encuesta
              </label>
              <input
                id="encuesta-codigo-input"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="ENC-XXXXXX"
                maxLength={10}
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-800 text-lg font-black text-center tracking-widest focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              id="encuesta-validar-btn"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <ChevronRight size={17} />}
              {loading ? 'Verificando...' : 'Continuar con encuesta'}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold">O también</span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handlePublicSurvey}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-extrabold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} className="text-amber-500 fill-amber-500" />}
              Responder como público general
            </button>
          </form>
        )}

        {/* ── PASO 2: Preguntas ── */}
        {step === STEP.QUESTIONS && currentQ && (
          <div>
            <ProgressBar current={qIndex + 1} total={preguntas.length} />

            <div className="px-6 py-5 min-h-[260px]">
              {/* Tipo badge */}
              <div className="flex items-center gap-2 mb-4">
                {currentQ.tipo === 'multiple'
                  ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full"><ListChecks size={11} />Opción múltiple</span>
                  : <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full"><MessageSquare size={11} />Respuesta abierta</span>
                }
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-5 leading-snug">{currentQ.texto}</h3>

              {currentQ.tipo === 'multiple' ? (
                <div className="space-y-2.5">
                  {(currentQ.opciones || []).map((opcion, i) => {
                    const selected = respuestas[currentQ.id]?.respuesta_opcion === opcion;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswer(currentQ.id, opcion, true)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 transition-colors ${selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        {opcion}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={respuestas[currentQ.id]?.respuesta_texto || ''}
                  onChange={e => setAnswer(currentQ.id, e.target.value, false)}
                  placeholder="Escribe tu respuesta aquí..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-300"
                />
              )}

              {error && (
                <div className="flex items-start gap-2 mt-3 text-sm text-red-500">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>

            {/* Navegación */}
            <div className="px-6 pb-6 flex items-center gap-3">
              {qIndex > 0 && (
                <button
                  onClick={() => { setQIndex(q => q - 1); setError(''); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={15} />
                  Anterior
                </button>
              )}
              <button
                disabled={!canProceed() || loading}
                onClick={() => {
                  setError('');
                  if (qIndex < preguntas.length - 1) {
                    setQIndex(q => q + 1);
                  } else {
                    handleSubmit();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-sm shadow-blue-200"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : qIndex < preguntas.length - 1 ? <ChevronRight size={15} /> : <CheckCircle2 size={15} />}
                {loading ? 'Enviando...' : qIndex < preguntas.length - 1 ? 'Siguiente' : 'Finalizar encuesta'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Éxito ── */}
        {step === STEP.SUCCESS && !showRegister && (
          <div className="px-6 py-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle2 size={36} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">¡Gracias por tu opinión!</h2>
            <p className="text-slate-400 text-sm mb-2">
              Tu encuesta ha sido registrada exitosamente.
            </p>
            <p className="text-slate-500 text-sm font-semibold mb-8">
              En <span className="text-blue-600">ECG Corporativo</span> tu experiencia nos ayuda a mejorar.
            </p>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 mb-6 border border-indigo-100 text-left">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={16} className="text-indigo-600" />
                <p className="text-sm font-black text-indigo-800">¿Quieres acceder al portal?</p>
              </div>
              <p className="text-xs text-indigo-600 mb-3">
                Crea una cuenta gratis para dar seguimiento a tus trabajos y cotizaciones con ECG Corporativo.
              </p>
              <button
                onClick={() => setShowRegister(true)}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-black hover:from-indigo-700 hover:to-blue-700 transition-all"
              >
                Crear cuenta gratuita
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 text-sm font-semibold hover:text-slate-600 transition-colors"
            >
              No, cerrar
            </button>
          </div>
        )}

        {/* ── Registro opcional ── */}
        {step === STEP.SUCCESS && showRegister && (
          <RegisterStep
            clienteNombre={codigoData?.cliente || ''}
            onSkip={onClose}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default EncuestaModal;
