import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { apiLogin, apiRegister } from '../../utils/api';

/* ── Tiny field wrapper ─────────────────────────────────────── */
const Field = ({ label, icon: Icon, error, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
      {Icon && <Icon size={11} />}
      {label}
    </label>
    {children}
  </div>
);

const inputBase =
  'w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm font-medium placeholder-slate-300 transition-all duration-200 focus:outline-none focus:ring-2';
const inputNormal = `${inputBase} border-slate-200 focus:border-blue-400 focus:ring-blue-100`;

/* ── Main component ─────────────────────────────────────────── */
const AuthModal = ({ onClose, onLogin }) => {
  const [tab, setTab] = useState('login');

  const [loginForm, setLoginForm]     = useState({ email: '', password: '' });
  const [loginError, setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regForm, setRegForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [regError, setRegError]     = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const user = await apiLogin(loginForm.email, loginForm.password);
      localStorage.setItem('ecg_session', JSON.stringify(user));
      onLogin(user);
      onClose();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password.length < 6)         { setRegError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (regForm.password !== regForm.confirm) { setRegError('Las contraseñas no coinciden.'); return; }
    setRegLoading(true);
    try {
      await apiRegister(regForm.name, regForm.email, regForm.password);
      setRegSuccess(true);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm z-10 animate-fade-in">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <X size={14} className="text-slate-500" />
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">

          {/* ── Header ───────────────────────────────────────── */}
          <div className="relative px-8 pt-8 pb-7 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)' }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-white/5" />

            <div className="relative">
              <span className="inline-block text-[10px] font-black tracking-[0.25em] uppercase text-blue-300 mb-2">
                Portal Empresarial
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                ECG <span className="text-blue-200 font-light">Corporativo</span>
              </h1>
            </div>

            {/* Tab switcher */}
            <div className="relative mt-6 flex bg-blue-950/40 rounded-2xl p-1 gap-1">
              {[
                { id: 'login',    icon: LogIn,    label: 'Ingresar' },
                { id: 'register', icon: UserPlus, label: 'Registrarse' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setLoginError(''); setRegError(''); setRegSuccess(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                    tab === id
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────── */}
          <div className="px-8 py-7">

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px] font-semibold">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {loginError}
                  </div>
                )}

                <Field label="Correo electrónico" icon={Mail}>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={e => { setLoginForm({ ...loginForm, email: e.target.value.replace(/\s/g, '') }); setLoginError(''); }}
                    placeholder="correo@ejemplo.com"
                    required
                    className={inputNormal}
                  />
                </Field>

                <Field label="Contraseña" icon={Lock}>
                  <div className="relative">
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={e => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(''); }}
                      placeholder="••••••••"
                      required
                      className={inputNormal + ' pr-11'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 mt-1 rounded-xl text-white text-sm font-bold tracking-wide transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                >
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verificando…
                    </span>
                  ) : 'Ingresar al Portal'}
                </button>

              </form>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && !regSuccess && (
              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-[13px] font-semibold">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {regError}
                  </div>
                )}

                <Field label="Nombre completo" icon={User}>
                  <input type="text" value={regForm.name} onChange={e => { setRegForm({ ...regForm, name: e.target.value }); setRegError(''); }} placeholder="Tu nombre" required className={inputNormal} />
                </Field>

                <Field label="Correo electrónico" icon={Mail}>
                  <input type="email" value={regForm.email} onChange={e => { setRegForm({ ...regForm, email: e.target.value.replace(/\s/g, '') }); setRegError(''); }} placeholder="correo@ejemplo.com" required className={inputNormal} />
                </Field>

                <Field label="Contraseña" icon={Lock}>
                  <div className="relative">
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      value={regForm.password}
                      onChange={e => { setRegForm({ ...regForm, password: e.target.value }); setRegError(''); }}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className={inputNormal + ' pr-11'}
                    />
                    <button type="button" onClick={() => setShowRegPwd(!showRegPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                      {showRegPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirmar contraseña" icon={Lock}>
                  <input
                    type={showRegPwd ? 'text' : 'password'}
                    value={regForm.confirm}
                    onChange={e => { setRegForm({ ...regForm, confirm: e.target.value }); setRegError(''); }}
                    placeholder="Repite tu contraseña"
                    required
                    className={inputNormal}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 mt-1 rounded-xl text-white text-sm font-bold tracking-wide transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                >
                  {regLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creando cuenta…
                    </span>
                  ) : 'Crear Cuenta'}
                </button>
              </form>
            )}

            {/* ── SUCCESS ── */}
            {tab === 'register' && regSuccess && (
              <div className="text-center py-6">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                    <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-1">¡Listo!</h3>
                <p className="text-sm text-slate-400 mb-7 leading-relaxed">
                  Tu cuenta fue creada exitosamente.<br />Ya puedes iniciar sesión.
                </p>
                <button
                  onClick={() => { setTab('login'); setRegSuccess(false); setRegForm({ name: '', email: '', password: '', confirm: '' }); }}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
                >
                  Iniciar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;