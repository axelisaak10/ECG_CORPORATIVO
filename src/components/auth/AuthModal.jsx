import React, { useState, useMemo } from 'react';
import {
  X, Eye, EyeOff, AlertCircle, CheckCircle, LogIn, UserPlus,
  Mail, Lock, User, KeyRound, ArrowLeft, Zap, Shield, Globe,
  Phone, Building2, CreditCard, Check,
} from 'lucide-react';
import { apiLogin, apiRegister, apiResetPassword } from '../../utils/api';

// ── Validaciones ───────────────────────────────────────────────────────────
const RFC_RE  = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i;
const CURP_RE = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/i;
const TEL_RE  = /^(\+?52\s?)?(\d[\s.-]?){10}$/;

const validateRfcCurp = (v) => {
  if (!v) return null;
  const clean = v.replace(/\s/g, '').toUpperCase();
  if (RFC_RE.test(clean))  return 'RFC válido';
  if (CURP_RE.test(clean)) return 'CURP válido';
  return 'Formato inválido (RFC: 12-13 chars · CURP: 18 chars)';
};

const pwdRules = (pwd) => [
  { label: 'Mínimo 6 caracteres',    ok: pwd.length >= 6           },
  { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(pwd)         },
  { label: 'Al menos un número',     ok: /\d/.test(pwd)            },
  { label: 'Al menos un símbolo',    ok: /[^A-Za-z0-9]/.test(pwd) },
];

const pwdStrength = (pwd) => {
  const score = pwdRules(pwd).filter(r => r.ok).length;
  if (!pwd)        return null;
  if (score <= 1)  return { label: 'Muy débil', color: 'bg-red-500',    w: 'w-1/4'  };
  if (score === 2) return { label: 'Débil',     color: 'bg-orange-400', w: 'w-2/4'  };
  if (score === 3) return { label: 'Buena',     color: 'bg-yellow-400', w: 'w-3/4'  };
  return             { label: 'Fuerte',     color: 'bg-green-500',  w: 'w-full' };
};

/* ── Input con icono integrado ──────────────────────────────── */
const InputIcon = ({ icon: Icon, type = 'text', value, onChange, placeholder, required, children, error }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 bg-slate-50 transition-all duration-200 focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-200'}`}>
    <Icon size={16} className="text-slate-400 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      {children ? (
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none pr-8"
          />
          {children}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none"
        />
      )}
    </div>
  </div>
);

/* ── Botón toggle contraseña ─────────────────────────────────── */
const PwdToggle = ({ show, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
  >
    {show ? <EyeOff size={15} /> : <Eye size={15} />}
  </button>
);

/* ── Main component ─────────────────────────────────────────── */
const AuthModal = ({ onClose, onLogin }) => {
  const [tab, setTab] = useState('login');

  const [loginForm, setLoginForm]       = useState({ email: '', password: '' });
  const [loginError, setLoginError]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [sessionLimit, setSessionLimit] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const [regForm, setRegForm]       = useState({ name: '', email: '', password: '', confirm: '', telefono: '', rfc_curp: '', empresa: '' });
  const [regError, setRegError]     = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const regStrength = useMemo(() => pwdStrength(regForm.password), [regForm.password]);
  const regRules    = useMemo(() => pwdRules(regForm.password),    [regForm.password]);
  const rfcStatus   = useMemo(() => validateRfcCurp(regForm.rfc_curp), [regForm.rfc_curp]);

  const [recForm, setRecForm]       = useState({ email: '', password: '', confirm: '' });
  const [recError, setRecError]     = useState('');
  const [recSuccess, setRecSuccess] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [showRecPwd, setShowRecPwd] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    setSessionLimit(false);
    try {
      const user = await apiLogin(loginForm.email, loginForm.password);
      onLogin(user);
      onClose();
    } catch (err) {
      if (err.activeSessions) setSessionLimit(true);
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setRecError('');
    if (recForm.password.length < 6)         { setRecError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (recForm.password !== recForm.confirm) { setRecError('Las contraseñas no coinciden.'); return; }
    setRecLoading(true);
    try {
      await apiResetPassword(recForm.email, recForm.password);
      setRecSuccess(true);
    } catch (err) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password.length < 6)                          { setRegError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (regForm.password !== regForm.confirm)                 { setRegError('Las contraseñas no coinciden.'); return; }
    if (regForm.telefono && !TEL_RE.test(regForm.telefono))   { setRegError('Número de teléfono inválido (10 dígitos).'); return; }
    if (regForm.rfc_curp && rfcStatus === 'Formato inválido (RFC: 12-13 chars · CURP: 18 chars)') {
      setRegError('El RFC o CURP ingresado no tiene un formato válido.'); return;
    }
    setRegLoading(true);
    try {
      await apiRegister(regForm.name, regForm.email, regForm.password, {
        telefono: regForm.telefono || undefined,
        rfc_curp: regForm.rfc_curp || undefined,
        empresa:  regForm.empresa  || undefined,
      });
      setRegSuccess(true);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const switchTab = (id) => {
    setTab(id);
    setLoginError(''); setRegError(''); setRegSuccess(false);
  };

  /* ── Mensaje de error ── */
  const ErrorBanner = ({ msg, warn }) => (
    <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border ${warn ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );

  /* ── Botón primario ── */
  const PrimaryBtn = ({ loading, loadingLabel, label, disabled }) => (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
      style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {loadingLabel}
        </span>
      ) : label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/75" />

      {/* Centering wrapper — scrollable */}
      <div className="flex items-center justify-center min-h-full p-4">
      <div className="relative w-full max-w-[800px] z-10" onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-all hover:rotate-90 duration-200"
        >
          <X size={15} className="text-slate-500" />
        </button>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/30 flex flex-col md:flex-row md:min-h-[520px]">

          {/* ── Panel izquierdo (decorativo) ─────────────────── */}
          <div
            className="hidden md:flex flex-col justify-between p-8 w-[280px] flex-shrink-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}
          >
            {/* Círculos decorativos */}
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-blue-400/10" />
            <div className="absolute top-1/2 -right-8 w-24 h-24 rounded-full bg-blue-300/10" />

            {/* Logo */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400/30 flex items-center justify-center">
                  <span className="text-white font-black text-sm">ECG</span>
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">ECG</p>
                  <p className="text-blue-300 text-xs font-medium">Corporativo</p>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white leading-tight mb-3">
                Portal<br />Empresarial
              </h2>
              <p className="text-blue-200 text-sm leading-relaxed font-medium opacity-80">
                Gestión integral de servicios de ingeniería y consultoría.
              </p>
            </div>

            {/* Features */}
            <div className="relative space-y-3">
              {[
                { icon: Shield,  text: 'Acceso seguro y protegido' },
                { icon: Zap,     text: 'Gestión en tiempo real'    },
                { icon: Globe,   text: 'Portal empresarial ECG'    },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-blue-300" />
                  </div>
                  <span className="text-blue-200 text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panel derecho (formulario) ────────────────────── */}
          <div className="flex-1 flex flex-col">

            {/* Header móvil */}
            <div
              className="md:hidden px-6 pt-7 pb-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)' }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
              <span className="text-[10px] font-black tracking-[0.25em] uppercase text-blue-300">Portal Empresarial</span>
              <h1 className="text-xl font-black text-white mt-1">ECG <span className="text-blue-300 font-light">Corporativo</span></h1>
            </div>

            {/* Tabs — oculto en recover */}
            {tab !== 'recover' && (
              <div className="px-6 pt-6 md:pt-8">
                <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
                  {[
                    { id: 'login',    icon: LogIn,    label: 'Iniciar sesión' },
                    { id: 'register', icon: UserPlus, label: 'Registrarse'    },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => switchTab(id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                        tab === id
                          ? 'bg-white text-slate-800 shadow-sm shadow-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formularios */}
            <div className="flex-1 overflow-y-auto px-6 py-6">

              {/* ── LOGIN ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto md:max-w-none">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Bienvenido de nuevo</h3>
                    <p className="text-slate-400 text-sm mt-0.5">Ingresa tus credenciales para continuar.</p>
                  </div>

                  {loginError && (
                    <ErrorBanner msg={loginError} warn={sessionLimit} />
                  )}
                  {sessionLimit && (
                    <p className="text-[12px] text-amber-600 font-medium -mt-2 pl-1">
                      Cierra sesión en otro dispositivo e intenta de nuevo.
                    </p>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Correo electrónico</label>
                      <InputIcon
                        icon={Mail}
                        type="email"
                        value={loginForm.email}
                        onChange={e => { setLoginForm({ ...loginForm, email: e.target.value.replace(/\s/g, '') }); setLoginError(''); }}
                        placeholder="correo@empresa.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Contraseña</label>
                      <InputIcon
                        icon={Lock}
                        type={showLoginPwd ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={e => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(''); }}
                        placeholder="••••••••••"
                        required
                      >
                        <PwdToggle show={showLoginPwd} onToggle={() => setShowLoginPwd(p => !p)} />
                      </InputIcon>
                    </div>
                  </div>

                  <PrimaryBtn loading={loginLoading} loadingLabel="Verificando…" label="Ingresar al Portal" />

                  <button
                    type="button"
                    onClick={() => { setTab('recover'); setLoginError(''); setRecError(''); setRecSuccess(false); setRecForm({ email: '', password: '', confirm: '' }); }}
                    className="w-full text-center text-[12px] text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </form>
              )}

              {/* ── REGISTER ── */}
              {tab === 'register' && !regSuccess && (
                <form onSubmit={handleRegister} className="space-y-3 max-w-sm mx-auto md:max-w-none">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Crear cuenta</h3>
                    <p className="text-slate-400 text-sm mt-0.5">Completa el formulario para registrarte.</p>
                  </div>

                  {regError && <ErrorBanner msg={regError} />}

                  {/* Nombre + Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre completo *</label>
                      <InputIcon icon={User} value={regForm.name}
                        onChange={e => { setRegForm({ ...regForm, name: e.target.value }); setRegError(''); }}
                        placeholder="Tu nombre" required />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Teléfono *</label>
                      <InputIcon icon={Phone} type="tel" value={regForm.telefono}
                        onChange={e => { setRegForm({ ...regForm, telefono: e.target.value }); setRegError(''); }}
                        placeholder="10 dígitos" required />
                    </div>
                  </div>

                  {/* Correo */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Correo electrónico *</label>
                    <InputIcon icon={Mail} type="email" value={regForm.email}
                      onChange={e => { setRegForm({ ...regForm, email: e.target.value.replace(/\s/g, '') }); setRegError(''); }}
                      placeholder="correo@empresa.com" required />
                  </div>

                  {/* RFC/CURP + Empresa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">RFC o CURP</label>
                      <InputIcon icon={CreditCard} value={regForm.rfc_curp}
                        onChange={e => { setRegForm({ ...regForm, rfc_curp: e.target.value.toUpperCase() }); setRegError(''); }}
                        placeholder="RFC o CURP" />
                      {regForm.rfc_curp && (
                        <p className={`text-[11px] font-semibold mt-1 pl-1 ${rfcStatus?.includes('válido') ? 'text-green-500' : 'text-red-400'}`}>
                          {rfcStatus}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Empresa <span className="normal-case font-normal">(opcional)</span></label>
                      <InputIcon icon={Building2} value={regForm.empresa}
                        onChange={e => { setRegForm({ ...regForm, empresa: e.target.value }); setRegError(''); }}
                        placeholder="Nombre de empresa" />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Contraseña *</label>
                    <InputIcon icon={Lock} type={showRegPwd ? 'text' : 'password'} value={regForm.password}
                      onChange={e => { setRegForm({ ...regForm, password: e.target.value }); setRegError(''); }}
                      placeholder="Mínimo 6 caracteres" required>
                      <PwdToggle show={showRegPwd} onToggle={() => setShowRegPwd(p => !p)} />
                    </InputIcon>
                    {/* Barra de fuerza */}
                    {regForm.password && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${regStrength?.color} ${regStrength?.w}`} />
                          </div>
                          <span className={`text-[11px] font-bold ml-3 w-16 text-right ${regStrength?.color?.replace('bg-', 'text-')}`}>
                            {regStrength?.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {regRules.map(r => (
                            <div key={r.label} className={`flex items-center gap-1.5 text-[11px] font-medium ${r.ok ? 'text-green-500' : 'text-slate-400'}`}>
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-100' : 'bg-slate-100'}`}>
                                {r.ok ? <Check size={8} strokeWidth={3} /> : <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />}
                              </div>
                              {r.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmar */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Confirmar contraseña *</label>
                    <InputIcon icon={Lock} type={showRegPwd ? 'text' : 'password'} value={regForm.confirm}
                      onChange={e => { setRegForm({ ...regForm, confirm: e.target.value }); setRegError(''); }}
                      placeholder="Repite tu contraseña" required />
                    {regForm.confirm && regForm.password && (
                      <p className={`text-[11px] font-semibold mt-1 pl-1 ${regForm.password === regForm.confirm ? 'text-green-500' : 'text-red-400'}`}>
                        {regForm.password === regForm.confirm ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                      </p>
                    )}
                  </div>

                  <PrimaryBtn loading={regLoading} loadingLabel="Creando cuenta…" label="Crear Cuenta" />
                </form>
              )}

              {/* ── RECOVER ── */}
              {tab === 'recover' && !recSuccess && (
                <form onSubmit={handleRecover} className="space-y-4 max-w-sm mx-auto md:max-w-none">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-blue-600 font-semibold transition-colors mb-1"
                  >
                    <ArrowLeft size={13} /> Volver al inicio de sesión
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <KeyRound size={22} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800 leading-tight">Recuperar acceso</h3>
                      <p className="text-slate-400 text-sm">Ingresa tu correo y nueva contraseña.</p>
                    </div>
                  </div>

                  {recError && <ErrorBanner msg={recError} />}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Correo electrónico</label>
                      <InputIcon
                        icon={Mail}
                        type="email"
                        value={recForm.email}
                        onChange={e => { setRecForm({ ...recForm, email: e.target.value.replace(/\s/g, '') }); setRecError(''); }}
                        placeholder="correo@empresa.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nueva contraseña</label>
                      <InputIcon
                        icon={Lock}
                        type={showRecPwd ? 'text' : 'password'}
                        value={recForm.password}
                        onChange={e => { setRecForm({ ...recForm, password: e.target.value }); setRecError(''); }}
                        placeholder="Mínimo 6 caracteres"
                        required
                      >
                        <PwdToggle show={showRecPwd} onToggle={() => setShowRecPwd(p => !p)} />
                      </InputIcon>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Confirmar contraseña</label>
                      <InputIcon
                        icon={Lock}
                        type={showRecPwd ? 'text' : 'password'}
                        value={recForm.confirm}
                        onChange={e => { setRecForm({ ...recForm, confirm: e.target.value }); setRecError(''); }}
                        placeholder="Repite tu contraseña"
                        required
                      />
                    </div>
                  </div>

                  <PrimaryBtn loading={recLoading} loadingLabel="Actualizando…" label="Restablecer Contraseña" />
                </form>
              )}

              {/* ── SUCCESS: contraseña ── */}
              {tab === 'recover' && recSuccess && (
                <div className="text-center py-8 max-w-sm mx-auto md:max-w-none">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                      <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">¡Contraseña actualizada!</h3>
                  <p className="text-sm text-slate-400 mb-7 leading-relaxed">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                  <button
                    onClick={() => { setTab('login'); setRecSuccess(false); setRecForm({ email: '', password: '', confirm: '' }); }}
                    className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}

              {/* ── SUCCESS: registro ── */}
              {tab === 'register' && regSuccess && (
                <div className="text-center py-8 max-w-sm mx-auto md:max-w-none">
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                      <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">¡Cuenta creada!</h3>
                  <p className="text-sm text-slate-400 mb-7 leading-relaxed">
                    Tu cuenta fue creada exitosamente.<br />Ya puedes iniciar sesión.
                  </p>
                  <button
                    onClick={() => { setTab('login'); setRegSuccess(false); setRegForm({ name: '', email: '', password: '', confirm: '', telefono: '', rfc_curp: '', empresa: '' }); }}
                    className="w-full py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AuthModal;
