import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Phone, Building2, FileText, Save, X, Edit3,
  CheckCircle, AlertCircle, KeyRound, Lock, Eye, EyeOff, Check, Loader2, Trash2, Image as ImageIcon,
} from 'lucide-react';
import { apiGetProfile, apiUpdateProfile, apiChangeOwnPassword, apiDeleteOwnAccount } from '../../utils/api';

/* ── Nivel labels ── */
const NIVEL_LABELS = {
  0: { label: 'Usuario',    cls: 'bg-slate-100  text-slate-600', accent: 'from-slate-500 to-slate-600'  },
  1: { label: 'Trabajador', cls: 'bg-green-100  text-green-700', accent: 'from-green-500 to-emerald-600' },
  2: { label: 'Admin',      cls: 'bg-blue-100   text-blue-700',  accent: 'from-blue-500 to-blue-600'    },
  3: { label: 'Superadmin', cls: 'bg-purple-100 text-purple-700', accent: 'from-purple-500 to-purple-600' },
};

/* ── Password helpers ── */
const pwdRulesCheck = (pwd) => [
  { label: 'Mínimo 6 caracteres',    ok: pwd.length >= 6           },
  { label: 'Al menos una mayúscula', ok: /[A-Z]/.test(pwd)         },
  { label: 'Al menos un número',     ok: /\d/.test(pwd)            },
  { label: 'Al menos un símbolo',    ok: /[^A-Za-z0-9]/.test(pwd) },
];

const pwdStrengthCalc = (pwd) => {
  const score = pwdRulesCheck(pwd).filter(r => r.ok).length;
  if (!pwd)        return null;
  if (score <= 1)  return { label: 'Muy débil', color: 'bg-red-500',    w: 'w-1/4'  };
  if (score === 2) return { label: 'Débil',     color: 'bg-orange-400', w: 'w-2/4'  };
  if (score === 3) return { label: 'Buena',     color: 'bg-yellow-400', w: 'w-3/4'  };
  return             { label: 'Fuerte',     color: 'bg-green-500',  w: 'w-full' };
};

const ProfileSection = ({ currentUser, onProfileUpdate }) => {
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');

  // Editable form state
  const [form, setForm] = useState({ name: '', telefono: '', rfc_curp: '', empresa: '', avatar_url: '' });

  // Password change state
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdForm, setPwdForm]         = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd]         = useState(false);
  const [pwdLoading, setPwdLoading]   = useState(false);
  const [pwdError, setPwdError]       = useState('');
  const [pwdSuccess, setPwdSuccess]   = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteError, setDeleteError]         = useState('');

  const pwdRules    = useMemo(() => pwdRulesCheck(pwdForm.newPwd),    [pwdForm.newPwd]);
  const pwdStrength = useMemo(() => pwdStrengthCalc(pwdForm.newPwd), [pwdForm.newPwd]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const p = await apiGetProfile();
      setProfile(p);
      setForm({ name: p.name || '', telefono: p.telefono || '', rfc_curp: p.rfc_curp || '', empresa: p.empresa || '', avatar_url: p.avatar_url || '' });
    } catch (err) {
      setErrorMsg(err.message);
      // Fallback to currentUser data
      setProfile({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        nivel: currentUser.nivel,
        telefono: currentUser.telefono || '',
        rfc_curp: currentUser.rfc_curp || '',
        empresa:  currentUser.empresa  || '',
        avatar_url: currentUser.avatar_url || '',
      });
      setForm({
        name:     currentUser.name || '',
        telefono: currentUser.telefono || '',
        rfc_curp: currentUser.rfc_curp || '',
        empresa:  currentUser.empresa  || '',
        avatar_url: currentUser.avatar_url || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { setErrorMsg('El nombre es requerido.'); return; }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiUpdateProfile(form);
      setSuccessMsg('Perfil actualizado correctamente.');
      setEditing(false);
      // Update profile state
      setProfile(p => ({ ...p, name: form.name, telefono: form.telefono, rfc_curp: form.rfc_curp, empresa: form.empresa, avatar_url: form.avatar_url }));
      // Notify parent to update session
      if (onProfileUpdate) {
        onProfileUpdate({ name: form.name.trim(), telefono: form.telefono, rfc_curp: form.rfc_curp, empresa: form.empresa, avatar_url: form.avatar_url });
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setErrorMsg('');
    if (profile) {
      setForm({ name: profile.name, telefono: profile.telefono, rfc_curp: profile.rfc_curp, empresa: profile.empresa, avatar_url: profile.avatar_url });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPwd.length < 6) { setPwdError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdError('Las contraseñas no coinciden.'); return; }
    setPwdLoading(true);
    try {
      await apiChangeOwnPassword(pwdForm.current, pwdForm.newPwd);
      setPwdSuccess(true);
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await apiDeleteOwnAccount();
      localStorage.removeItem('ecg_session');
      window.location.reload();
    } catch (err) {
      setDeleteError(err.message);
      setDeleteLoading(false);
    }
  };

  const nv = NIVEL_LABELS[profile?.nivel ?? currentUser.nivel ?? 0] ?? NIVEL_LABELS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Cargando perfil…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${nv.accent} flex items-center justify-center shadow-lg`}>
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
            <p className="text-slate-500 text-sm">Administra tu información personal</p>
          </div>
        </div>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border bg-green-50 border-green-100 text-green-700 animate-fadeIn">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto p-0.5 hover:bg-green-100 rounded transition-colors"><X size={14} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold border bg-red-50 border-red-100 text-red-600 animate-fadeIn">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto p-0.5 hover:bg-red-100 rounded transition-colors"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile info card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Avatar banner */}
            <div className={`bg-gradient-to-br ${nv.accent} px-6 py-8 text-center relative overflow-hidden`}>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full" />
              <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-white/30 overflow-hidden">
                  {(profile?.avatar_url || currentUser?.avatar_url) ? (
                    <img src={profile?.avatar_url || currentUser?.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                  ) : null}
                  <span className="text-white font-black text-3xl" style={{ display: (profile?.avatar_url || currentUser?.avatar_url) ? 'none' : 'block' }}>
                    {(profile?.name || currentUser.name)?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-extrabold text-lg">{profile?.name || currentUser.name}</p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block bg-white/20 text-white/90 uppercase tracking-wider`}>
                  {nv.label}
                </span>
              </div>
            </div>

            {/* Profile fields */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-slate-800 text-sm">Información Personal</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                  >
                    <Edit3 size={13} />
                    Editar
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                    >
                      <X size={13} />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all disabled:opacity-50 shadow-sm"
                    >
                      {saving ? (
                        <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" />Guardando…</span>
                      ) : (
                        <><Save size={13} />Guardar</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre completo</p>
                    {editing ? (
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                        placeholder="Tu nombre completo"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-700">{profile?.name || '—'}</p>
                    )}
                  </div>
                </div>

                {/* Avatar URL */}
                {editing && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ImageIcon size={16} className="text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">URL de Avatar</p>
                      <input
                        type="url"
                        value={form.avatar_url}
                        onChange={e => setForm({ ...form, avatar_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                        placeholder="https://ejemplo.com/mifoto.jpg"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">Pega un enlace a la imagen que deseas usar como foto de perfil</p>
                    </div>
                  </div>
                )}

                {/* Email (read-only) */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo electrónico</p>
                    <p className="text-sm font-semibold text-slate-700">{profile?.email || currentUser.email}</p>
                    {editing && <p className="text-[10px] text-slate-400 mt-0.5">El correo no se puede modificar</p>}
                  </div>
                </div>

                {/* Teléfono */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone size={16} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono</p>
                    {editing ? (
                      <input
                        type="tel"
                        value={form.telefono}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                        placeholder="Ej. 55 1234 5678"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-700">{profile?.telefono || <span className="text-slate-300 italic">No registrado</span>}</p>
                    )}
                  </div>
                </div>

                {/* RFC / CURP */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={16} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">RFC / CURP</p>
                    {editing ? (
                      <input
                        type="text"
                        value={form.rfc_curp}
                        onChange={e => setForm({ ...form, rfc_curp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all uppercase"
                        placeholder="Ej. XAXX010101000"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-700 font-mono">{profile?.rfc_curp || <span className="text-slate-300 italic font-sans">No registrado</span>}</p>
                    )}
                  </div>
                </div>

                {/* Empresa */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 size={16} className="text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Empresa</p>
                    {editing ? (
                      <input
                        type="text"
                        value={form.empresa}
                        onChange={e => setForm({ ...form, empresa: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                        placeholder="Nombre de tu empresa"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-700">{profile?.empresa || <span className="text-slate-300 italic">No registrado</span>}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security */}
        <div className="space-y-6">
          {/* Account type card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tipo de Cuenta</h3>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${nv.accent} flex items-center justify-center shadow-md`}>
                  <span className="text-white font-black text-sm">{(profile?.name || currentUser.name)?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{profile?.name || currentUser.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nv.cls} uppercase tracking-wider`}>{nv.label}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 mt-3">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {profile?.nivel >= 3 ? 'Tienes acceso completo al sistema, incluyendo gestión de usuarios y recuperación de cuentas.' :
                   profile?.nivel >= 2 ? 'Puedes administrar cotizaciones, dictámenes, trabajos y tareas.' :
                   profile?.nivel >= 1 ? 'Tienes acceso a tareas y trabajos asignados.' :
                   'Puedes consultar información de las empresas del grupo.'}
                </p>
              </div>
            </div>
          </div>

          {/* Change password card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Seguridad</h3>
            </div>
            <div className="px-5 py-4">
              {pwdSuccess ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-green-200">
                    <CheckCircle size={22} className="text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-1">¡Contraseña actualizada!</p>
                  <p className="text-xs text-slate-400 mb-4">Tu contraseña fue cambiada exitosamente.</p>
                  <button
                    onClick={() => { setPwdSuccess(false); setShowPwdForm(false); }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-bold transition-colors"
                  >Cerrar</button>
                </div>
              ) : !showPwdForm ? (
                <button
                  onClick={() => setShowPwdForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all font-bold text-sm"
                >
                  <KeyRound size={15} />
                  Cambiar contraseña
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cambiar contraseña</p>
                    <button
                      type="button"
                      onClick={() => { setShowPwdForm(false); setPwdError(''); setPwdForm({ current: '', newPwd: '', confirm: '' }); }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold transition-colors"
                    >Cancelar</button>
                  </div>

                  {pwdError && (
                    <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold bg-red-50 border border-red-100 text-red-600">
                      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>{pwdError}</span>
                    </div>
                  )}

                  {/* Current password */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña actual</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                      <Lock size={13} className="text-slate-400 flex-shrink-0" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={pwdForm.current}
                        onChange={e => { setPwdForm({ ...pwdForm, current: e.target.value }); setPwdError(''); }}
                        placeholder="Tu contraseña actual"
                        required
                        className="w-full bg-transparent text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nueva contraseña</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                      <Lock size={13} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0 relative">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={pwdForm.newPwd}
                          onChange={e => { setPwdForm({ ...pwdForm, newPwd: e.target.value }); setPwdError(''); }}
                          placeholder="Mínimo 6 caracteres"
                          required
                          className="w-full bg-transparent text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none pr-6"
                        />
                        <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    {pwdForm.newPwd && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${pwdStrength?.color} ${pwdStrength?.w}`} />
                          </div>
                          <span className={`text-[10px] font-bold ml-2 ${pwdStrength?.color?.replace('bg-', 'text-')}`}>{pwdStrength?.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                          {pwdRules.map(r => (
                            <div key={r.label} className={`flex items-center gap-1 text-[10px] font-medium ${r.ok ? 'text-green-500' : 'text-slate-400'}`}>
                              <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-100' : 'bg-slate-100'}`}>
                                {r.ok ? <Check size={7} strokeWidth={3} /> : <span className="w-0.5 h-0.5 rounded-full bg-slate-300 inline-block" />}
                              </div>
                              {r.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirmar nueva contraseña</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                      <Lock size={13} className="text-slate-400 flex-shrink-0" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={pwdForm.confirm}
                        onChange={e => { setPwdForm({ ...pwdForm, confirm: e.target.value }); setPwdError(''); }}
                        placeholder="Repite tu contraseña"
                        required
                        className="w-full bg-transparent text-slate-800 text-xs font-medium placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    {pwdForm.confirm && pwdForm.newPwd && (
                      <p className={`text-[10px] font-semibold mt-0.5 pl-1 ${pwdForm.newPwd === pwdForm.confirm ? 'text-green-500' : 'text-red-400'}`}>
                        {pwdForm.newPwd === pwdForm.confirm ? '✓ Coinciden' : '✗ No coinciden'}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                  >
                    {pwdLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Actualizando…
                      </span>
                    ) : 'Actualizar Contraseña'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Zona de peligro */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-red-50 bg-red-50/30">
              <h3 className="font-extrabold text-red-600 text-sm">Zona de Peligro</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">
                Eliminar tu cuenta es una acción permanente y no se puede deshacer. Se borrarán tus datos y perderás el acceso.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all font-bold text-sm"
              >
                <Trash2 size={15} />
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 text-center mb-2">¿Eliminar tu cuenta?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Esta acción te desconectará del sistema y eliminará tu perfil. ¿Estás seguro de que deseas continuar?
              </p>

              {deleteError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold bg-red-50 border border-red-100 text-red-600">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-all shadow-md shadow-red-200 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
