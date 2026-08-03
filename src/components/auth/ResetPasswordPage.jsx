import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { apiResetPassword } from '../../utils/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  // Si no hay token en la URL, redirigir al inicio
  useEffect(() => {
    if (!token) navigate('/', { replace: true });
  }, [token, navigate]);

  const pwdRules = [
    { label: 'Mínimo 8 caracteres',    ok: form.password.length >= 8 },
    { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(form.password) },
    { label: 'Al menos un número',     ok: /\d/.test(form.password) },
  ];
  const allRulesOk = pwdRules.every(r => r.ok);
  const passwordsMatch = form.password === form.confirm && form.confirm.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesOk)       { setError('La contraseña no cumple los requisitos mínimos.'); return; }
    if (!passwordsMatch)   { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    setError('');
    try {
      await apiResetPassword(token, form.password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}
    >
      {/* Círculos decorativos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-400/10" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-indigo-500/10" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/40 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
                <span className="text-white font-black text-sm">ECG</span>
              </div>
              <div>
                <p className="text-slate-800 font-black text-sm leading-tight">ECG Corporativo</p>
                <p className="text-slate-400 text-xs">Portal Empresarial</p>
              </div>
            </div>

            {!success ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <KeyRound size={20} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-slate-800 leading-tight">Nueva contraseña</h1>
                  <p className="text-slate-400 text-sm">Elige una contraseña segura para tu cuenta.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-slate-800 leading-tight">¡Listo!</h1>
                  <p className="text-slate-400 text-sm">Tu contraseña fue actualizada.</p>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Error banner */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border bg-red-50 border-red-100 text-red-600">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Nueva contraseña */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Nueva contraseña
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-slate-50 transition-all focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] ${error ? 'border-red-300' : 'border-slate-200'}`}>
                    <Lock size={16} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1 relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(''); }}
                        placeholder="Mínimo 8 caracteres"
                        required
                        className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none pr-8"
                      />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Reglas */}
                  {form.password && (
                    <div className="mt-2.5 space-y-1">
                      {pwdRules.map(r => (
                        <div key={r.label} className={`flex items-center gap-2 text-[12px] font-medium ${r.ok ? 'text-green-600' : 'text-slate-400'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-100' : 'bg-slate-100'}`}>
                            {r.ok
                              ? <span className="block w-1.5 h-1.5 rounded-full bg-green-500" />
                              : <span className="block w-1 h-1 rounded-full bg-slate-300" />}
                          </div>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Confirmar contraseña
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-slate-50 transition-all focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] border-slate-200`}>
                    <Lock size={16} className="text-slate-400 flex-shrink-0" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError(''); }}
                      placeholder="Repite tu contraseña"
                      required
                      className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  {form.confirm && form.password && (
                    <p className={`text-[11px] font-semibold mt-1.5 pl-1 ${passwordsMatch ? 'text-green-500' : 'text-red-400'}`}>
                      {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                    </p>
                  )}
                </div>

                {/* Botón */}
                <button
                  type="submit"
                  disabled={loading || !allRulesOk || !passwordsMatch}
                  className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                  style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
                >
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Guardando…
                      </span>
                    : 'Guardar nueva contraseña'}
                </button>

              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                    <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">¡Contraseña actualizada!</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Tu sesión anterior fue cerrada por seguridad.<br />
                    Inicia sesión con tu nueva contraseña.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
                >
                  Ir al Portal e Iniciar Sesión
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="px-8 pb-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 mx-auto text-[12px] text-slate-400 hover:text-blue-600 font-semibold transition-colors"
              >
                <ArrowLeft size={12} /> Volver al portal
              </button>
            </div>
          )}
        </div>

        {/* Nota de seguridad */}
        <p className="text-center text-blue-200/60 text-[11px] mt-5 font-medium">
          Este enlace es de un solo uso y expira en 1 hora.
        </p>
      </div>
    </div>
  );
}
