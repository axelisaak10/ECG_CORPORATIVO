import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Plus, X, Eye, EyeOff, Trash2, Edit2,
  CheckCircle, AlertCircle, Tag, Zap, Gift, Bell, Sparkles,
  Building2, LayoutGrid, Calendar, ToggleLeft, ToggleRight,
  Loader2, RefreshCw,
} from 'lucide-react';
import { companiesData } from '../../data/companies';
import {
  apiGetAnuncios, apiCreateAnuncio, apiUpdateAnuncio,
  apiToggleAnuncio, apiDeleteAnuncio,
} from '../../utils/api';
import { fmtDate } from '../../utils/formatters';

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'oferta',    label: '🔥 Oferta',    color: 'bg-rose-100 text-rose-700'     },
  { value: 'novedad',   label: '✨ Novedad',   color: 'bg-violet-100 text-violet-700'  },
  { value: 'evento',    label: '📅 Evento',    color: 'bg-amber-100 text-amber-700'    },
  { value: 'aviso',     label: '📢 Aviso',     color: 'bg-blue-100 text-blue-700'      },
  { value: 'promocion', label: '🎁 Promoción', color: 'bg-emerald-100 text-emerald-700'},
];

const ICONOS = ['Bell','Tag','Zap','Gift','Sparkles'];
const ICON_MAP = { Tag, Zap, Gift, Bell, Sparkles };

const DESTINOS = [
  { value: 'portal',    label: 'Portal Principal', icon: <LayoutGrid size={14} /> },
  { value: 'empresa_1', label: companiesData[0]?.shortName || 'Empresa 1', icon: <Building2 size={14} /> },
  { value: 'empresa_2', label: companiesData[1]?.shortName || 'Empresa 2', icon: <Building2 size={14} /> },
  { value: 'empresa_3', label: companiesData[2]?.shortName || 'Empresa 3', icon: <Building2 size={14} /> },
];

const TIPO_STYLES = {
  oferta:    { bg: 'from-rose-500 to-pink-600',     badge: 'bg-rose-100 text-rose-700'      },
  novedad:   { bg: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700'  },
  evento:    { bg: 'from-amber-500 to-orange-600',  badge: 'bg-amber-100 text-amber-700'    },
  aviso:     { bg: 'from-blue-500 to-blue-700',     badge: 'bg-blue-100 text-blue-700'      },
  promocion: { bg: 'from-emerald-500 to-teal-600',  badge: 'bg-emerald-100 text-emerald-700'},
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const tipoInfo  = (t) => TIPOS.find(x => x.value === t) || TIPOS[3];
const destLabel = (d) => DESTINOS.find(x => x.value === d)?.label || d;
const isExpired = (f) => f && new Date(f) < new Date(new Date().toDateString());

// ── Preview del popup ─────────────────────────────────────────────────────────
const PopupPreview = ({ anuncio, onClose }) => {
  const isSoloImagen = anuncio.solo_imagen || anuncio.soloImagen;
  const style = TIPO_STYLES[anuncio.tipo] || TIPO_STYLES.aviso;
  const IconComp = ICON_MAP[anuncio.icono] || Bell;
  const hasImage = !!anuncio.imagen_url || !!anuncio.image;
  const imageUrl = anuncio.imagen_url || anuncio.image;

  if (isSoloImagen) {
    return (
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm pointer-events-auto rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative overflow-hidden w-full bg-slate-950 flex items-center justify-center"
               style={{ minHeight: '260px' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Vista previa"
                className="w-full h-auto object-cover max-h-[60vh]"
              />
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">Sin URL de imagen configurada</div>
            )}

            <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 rounded-full p-1.5 z-10 text-white transition-colors">
              <X size={15} />
            </button>

            {anuncio.badge && (
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                  {anuncio.badge}
                </span>
              </div>
            )}

            {/* Simulación del timer */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-0 right-0 z-10 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
                ⏱️ Tiempo restante (Simulado)
              </span>
              <div className="flex gap-1.5 text-white/90 text-sm font-black bg-black/40 backdrop-blur-sm px-3 py-1 rounded-xl">
                <span>02d</span> : <span>14h</span> : <span>35m</span> : <span>18s</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 px-4 py-2.5 text-center text-xs text-slate-400 font-bold border-t border-slate-800">
            Vista previa — Modo Solo Imagen
          </div>
        </div>
      </div>
    );
  }

  // Modo Estándar
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm pointer-events-auto rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${style.bg} p-6 pb-8 text-white overflow-hidden`}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full bg-white/10" />
          <button onClick={onClose} className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-1.5 z-10">
            <X size={14} />
          </button>
          <div className="flex items-start gap-3 relative z-10">
            <div className="bg-white/20 rounded-2xl p-2.5 flex-shrink-0">
              <IconComp size={18} />
            </div>
            <div>
              {anuncio.badge && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full mr-2">
                  {anuncio.badge}
                </span>
              )}
              <h2 className="text-lg font-black leading-snug mt-1">{anuncio.titulo || 'Título del anuncio'}</h2>
              {anuncio.subtitulo && <p className="text-white/80 text-xs mt-0.5">{anuncio.subtitulo}</p>}
            </div>
          </div>
        </div>
        {/* Imagen si existe en modo estándar */}
        {imageUrl && (
          <div className="relative h-44 overflow-hidden bg-slate-900">
            <img src={imageUrl} alt="Anuncio" className="w-full h-full object-cover" />
          </div>
        )}
        {/* Body */}
        <div className="bg-white p-5">
          <p className="text-gray-600 text-sm leading-relaxed">{anuncio.cuerpo || 'Descripción del anuncio...'}</p>
          {anuncio.cta_texto && (
            <div className={`mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r ${style.bg} text-white font-bold text-sm py-2.5 px-5 rounded-2xl opacity-90`}>
              {anuncio.cta_texto}
            </div>
          )}
          <p className="mt-2 text-center text-xs text-gray-300">— Vista previa —</p>
        </div>
      </div>
    </div>
  );
};

// ── Formulario de creación/edición ────────────────────────────────────────────
const AnuncioForm = ({ initial = {}, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    titulo:    initial.titulo     || '',
    subtitulo: initial.subtitulo  || '',
    cuerpo:    initial.cuerpo     || '',
    tipo:      initial.tipo       || 'aviso',
    icono:     initial.icono      || 'Bell',
    badge:     initial.badge      || '',
    destino:   initial.destino    || 'portal',
    cta_texto: initial.cta_texto  || '',
    cta_link:  initial.cta_link   || '',
    imagen_url:initial.imagen_url || '',
    fecha_fin: initial.fecha_fin  ? initial.fecha_fin.split('T')[0] : '',
    activo:    initial.activo !== undefined ? initial.activo : true,
    solo_imagen: initial.solo_imagen || false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const style = TIPO_STYLES[form.tipo] || TIPO_STYLES.aviso;
  const IconComp = ICON_MAP[form.icono] || Bell;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.solo_imagen) {
      if (!form.titulo.trim()) return;
      if (!form.cuerpo.trim()) return;
    } else {
      if (!form.imagen_url.trim()) return;
    }
    onSave({
      ...form,
      fecha_fin: form.fecha_fin || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center text-white shadow-md`}>
              <IconComp size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                {initial.id ? 'Editar Anuncio' : 'Nuevo Anuncio'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Completa los campos del pop-up</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

            {/* Tipo + Destino (2 columnas) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => set('tipo', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destino</label>
                <select
                  value={form.destino}
                  onChange={e => set('destino', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {DESTINOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            {/* Modo Solo Imagen Toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-700">🖼️ Modo Solo Imagen</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Muestra únicamente la imagen y el contador de tiempo</p>
              </div>
              <button
                type="button"
                onClick={() => set('solo_imagen', !form.solo_imagen)}
                className={`transition-colors ${form.solo_imagen ? 'text-indigo-600' : 'text-slate-300'}`}
              >
                {form.solo_imagen ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            {/* URL Imagen (Destacada si es Solo Imagen) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                URL de la Imagen {form.solo_imagen && <span className="text-red-400">*</span>}
              </label>
              <input
                type="url"
                required={form.solo_imagen}
                value={form.imagen_url}
                onChange={e => set('imagen_url', e.target.value)}
                placeholder="https://ejemplo.com/anuncio-oferta.png"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
              />
              {form.imagen_url && (
                <div className="mt-2.5 relative rounded-2xl overflow-hidden border border-slate-100 max-h-36 bg-slate-950 flex items-center justify-center">
                  <img
                    src={form.imagen_url}
                    alt="Vista previa de imagen"
                    className="max-h-32 object-contain w-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Campos condicionales si no es modo Solo Imagen */}
            {!form.solo_imagen ? (
              <>
                {/* Ícono + Badge (2 columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ícono</label>
                    <div className="flex gap-2 flex-wrap">
                      {ICONOS.map(ic => {
                        const Ic = ICON_MAP[ic];
                        return (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => set('icono', ic)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border-2 ${
                              form.icono === ic
                                ? `bg-gradient-to-br ${style.bg} text-white border-transparent shadow-md`
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                            title={ic}
                          >
                            <Ic size={15} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Badge <span className="text-slate-300 normal-case">(etiqueta)</span></label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={e => set('badge', e.target.value)}
                      placeholder="Ej: ¡NUEVO!, 20% OFF"
                      maxLength={20}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                    />
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Título <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.titulo}
                    onChange={e => set('titulo', e.target.value)}
                    placeholder="Título principal del anuncio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subtítulo <span className="text-slate-300 normal-case">(opcional)</span></label>
                  <input
                    type="text"
                    value={form.subtitulo}
                    onChange={e => set('subtitulo', e.target.value)}
                    placeholder="Subtítulo o nombre de la empresa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                  />
                </div>

                {/* Cuerpo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción <span className="text-red-400">*</span></label>
                  <textarea
                    required
                    value={form.cuerpo}
                    onChange={e => set('cuerpo', e.target.value)}
                    placeholder="Descripción completa del anuncio u oferta..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300 resize-none"
                  />
                </div>

                {/* CTA Texto + Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Texto del botón CTA <span className="text-slate-300 normal-case">(opcional)</span></label>
                    <input
                      type="text"
                      value={form.cta_texto}
                      onChange={e => set('cta_texto', e.target.value)}
                      placeholder="Ej: Ver más, Contactar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Link del botón / clic <span className="text-slate-300 normal-case">(opcional)</span></label>
                    <input
                      type="url"
                      value={form.cta_link}
                      onChange={e => set('cta_link', e.target.value)}
                      placeholder="https://wa.me/... o https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Opciones simplificadas para Solo Imagen */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Badge <span className="text-slate-300 normal-case">(opcional)</span></label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={e => set('badge', e.target.value)}
                      placeholder="Ej: ¡LIMITADO!, 30% OFF"
                      maxLength={20}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Link al hacer clic <span className="text-slate-300 normal-case">(opcional)</span></label>
                    <input
                      type="url"
                      value={form.cta_link}
                      onChange={e => set('cta_link', e.target.value)}
                      placeholder="https://wa.me/... o https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder-slate-300"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Fecha de vencimiento y Activo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de vencimiento <span className="text-red-400 font-black">*</span> <span className="text-slate-300 normal-case">(requerido para cuenta atrás)</span></label>
                <input
                  type="date"
                  required
                  value={form.fecha_fin}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('fecha_fin', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 h-[48px]">
                  <span className="text-xs font-bold text-slate-700">Publicar ya</span>
                  <button
                    type="button"
                    onClick={() => set('activo', !form.activo)}
                    className={`transition-colors ${form.activo ? 'text-blue-600' : 'text-slate-300'}`}
                  >
                    {form.activo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-md shadow-blue-200"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {initial.id ? 'Guardar cambios' : 'Crear anuncio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const AnunciosSection = ({ currentUser }) => {
  const nivel      = currentUser?.nivel ?? 0;
  const isAdmin    = nivel >= 2;

  const [anuncios, setAnuncios]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast]           = useState(null);
  const [filterDest, setFilterDest] = useState('todos');

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetAnuncios();
      setAnuncios(data);
    } catch (err) {
      showToast(err.message, 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const created = await apiCreateAnuncio({ ...form, creado_por: currentUser?.name });
      setAnuncios(prev => [created, ...prev]);
      setShowForm(false);
      showToast('Anuncio creado exitosamente ✓');
    } catch (err) {
      showToast(err.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      const updated = await apiUpdateAnuncio(editItem.id, form);
      setAnuncios(prev => prev.map(a => a.id === updated.id ? updated : a));
      setEditItem(null);
      showToast('Anuncio actualizado ✓');
    } catch (err) {
      showToast(err.message, 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (anuncio) => {
    const newVal = !anuncio.activo;
    // Optimistic update
    setAnuncios(prev => prev.map(a => a.id === anuncio.id ? { ...a, activo: newVal } : a));
    try {
      await apiToggleAnuncio(anuncio.id, newVal);
      showToast(newVal ? 'Anuncio activado ✓' : 'Anuncio desactivado');
    } catch (err) {
      // Revert
      setAnuncios(prev => prev.map(a => a.id === anuncio.id ? { ...a, activo: anuncio.activo } : a));
      showToast(err.message, 'err');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDeleteAnuncio(id);
      setAnuncios(prev => prev.filter(a => a.id !== id));
      setConfirmDel(null);
      showToast('Anuncio eliminado');
    } catch (err) {
      showToast(err.message, 'err');
    }
  };

  // Filtrado
  const filtered = filterDest === 'todos'
    ? anuncios
    : anuncios.filter(a => a.destino === filterDest);

  // Estadísticas
  const stats = {
    total:    anuncios.length,
    activos:  anuncios.filter(a => a.activo && !isExpired(a.fecha_fin)).length,
    inactivos:anuncios.filter(a => !a.activo).length,
    vencidos: anuncios.filter(a => isExpired(a.fecha_fin)).length,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[999] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl animate-fadeIn ${
          toast.type === 'err'
            ? 'bg-red-50 border border-red-100 text-red-700'
            : 'bg-green-50 border border-green-100 text-green-700'
        }`}>
          {toast.type === 'err' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Modales */}
      {showForm && (
        <AnuncioForm onSave={handleCreate} onClose={() => setShowForm(false)} saving={saving} />
      )}
      {editItem && (
        <AnuncioForm initial={editItem} onSave={handleEdit} onClose={() => setEditItem(null)} saving={saving} />
      )}
      {previewItem && (
        <PopupPreview anuncio={previewItem} onClose={() => setPreviewItem(null)} />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Anuncios</h1>
            <p className="text-slate-500 text-sm mt-0.5">Administra los pop-ups del portal y de cada empresa</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
              title="Recargar"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
            >
              <Plus size={16} />
              Nuevo anuncio
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    val: stats.total,     color: 'bg-slate-100  text-slate-700'   },
          { label: 'Activos',  val: stats.activos,   color: 'bg-green-100  text-green-700'   },
          { label: 'Inactivos',val: stats.inactivos, color: 'bg-slate-100  text-slate-500'   },
          { label: 'Vencidos', val: stats.vencidos,  color: 'bg-red-100    text-red-600'     },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
            <p className="text-3xl font-black text-slate-800 mt-2">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filtro de destino */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[{ value: 'todos', label: 'Todos' }, ...DESTINOS].map(d => (
          <button
            key={d.value}
            onClick={() => setFilterDest(d.value)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              filterDest === d.value
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {d.icon && <span>{d.icon}</span>}
            {d.label}
          </button>
        ))}
      </div>

      {/* Tabla / Lista */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Listado de anuncios</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full">{filtered.length} anuncios</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
            <p className="text-sm font-medium">Cargando anuncios…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Megaphone size={40} className="text-slate-200" />
            <p className="text-slate-400 font-medium">No hay anuncios aún.</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              <Plus size={15} /> Crear el primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(anuncio => {
              const tipo    = tipoInfo(anuncio.tipo);
              const expired = isExpired(anuncio.fecha_fin);
              const active  = anuncio.activo && !expired;

              return (
                <div key={anuncio.id} className={`px-6 py-4 flex items-start gap-4 hover:bg-slate-50/60 transition-colors ${!active ? 'opacity-60' : ''}`}>

                  {/* Ícono tipo */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-br ${TIPO_STYLES[anuncio.tipo]?.bg || TIPO_STYLES.aviso.bg} shadow-sm mt-0.5`}>
                    {React.createElement(ICON_MAP[anuncio.icono] || Bell, { size: 16 })}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-slate-800 text-sm">{anuncio.titulo}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipo.color}`}>{tipo.label}</span>
                      {anuncio.solo_imagen && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">🖼️ Solo Imagen</span>
                      )}
                      {anuncio.badge && (
                        <span className="text-[10px] font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{anuncio.badge}</span>
                      )}
                      {expired && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⏰ Vencido</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-1 mb-2">
                      {anuncio.solo_imagen ? `[Imagen URL] ${anuncio.imagen_url}` : anuncio.cuerpo}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        {DESTINOS.find(d => d.value === anuncio.destino)?.icon}
                        {destLabel(anuncio.destino)}
                      </span>
                      {anuncio.fecha_fin && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          Hasta: {fmtDate(anuncio.fecha_fin)}
                        </span>
                      )}
                      <span>Por: {anuncio.creado_por}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Preview */}
                    <button
                      onClick={() => setPreviewItem(anuncio)}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Vista previa"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => setEditItem(anuncio)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>

                    {/* Toggle activo */}
                    <button
                      onClick={() => handleToggle(anuncio)}
                      className={`p-2 rounded-lg transition-all ${
                        anuncio.activo
                          ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                      }`}
                      title={anuncio.activo ? 'Desactivar' : 'Activar'}
                    >
                      {anuncio.activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    {/* Eliminar — solo admin */}
                    {isAdmin && (
                      confirmDel === anuncio.id ? (
                        <>
                          <button onClick={() => handleDelete(anuncio.id)} className="text-xs bg-red-600 text-white font-bold px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                            Eliminar
                          </button>
                          <button onClick={() => setConfirmDel(null)} className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-1.5 rounded-lg hover:bg-slate-200">
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDel(anuncio.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info de permisos */}
      {!isAdmin && (
        <div className="mt-4 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 font-medium">
            Como <strong>Trabajador</strong> puedes crear y activar/desactivar anuncios. Solo los <strong>Administradores</strong> pueden eliminarlos.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnunciosSection;
