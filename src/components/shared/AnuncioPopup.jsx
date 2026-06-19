import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Tag, Zap, Gift, Bell, ArrowRight, Sparkles } from 'lucide-react';

// ── Iconos disponibles ────────────────────────────────────────────────────────
const ICONS = { Tag, Zap, Gift, Bell, Sparkles };

// ── Colores de tipo ───────────────────────────────────────────────────────────
const typeStyles = {
  oferta:    { bg: 'from-rose-500 to-pink-600',    badge: 'bg-rose-100 text-rose-700',    label: '🔥 Oferta especial' },
  novedad:   { bg: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700', label: '✨ Novedad' },
  evento:    { bg: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700',   label: '📅 Evento' },
  aviso:     { bg: 'from-blue-500 to-blue-700',    badge: 'bg-blue-100 text-blue-700',    label: '📢 Aviso importante' },
  promocion: { bg: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700', label: '🎁 Promoción' },
};

// ── Helper: convierte un anuncio de la API al formato interno del popup ────────
const normalizeApiAnuncio = (a) => ({
  type:     a.tipo       || 'aviso',
  icon:     a.icono      || 'Bell',
  badge:    a.badge      || '',
  title:    a.titulo     || '',
  subtitle: a.subtitulo  || '',
  body:     a.cuerpo     || '',
  cta:      a.cta_texto  || '',
  ctaLink:  a.cta_link   || '',
  image:    a.imagen_url || '',
  expiry:   a.fecha_fin  ? (a.fecha_fin.includes('T') ? a.fecha_fin : a.fecha_fin + 'T23:59:59') : undefined,
});

// ── Dot de navegación ─────────────────────────────────────────────────────────
const NavDot = ({ active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full transition-all duration-300 ${
      active ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
    }`}
  />
);

/**
 * AnuncioPopup — popup de anuncios/ofertas
 *
 * Props:
 *   destino      : 'portal' | 'empresa_1' | 'empresa_2' | 'empresa_3'
 *   popupId      : string único para evitar mostrarlo 2x por sesión
 *   delay        : ms antes de mostrarse (default 900)
 *   anunciosExtra: Array<anuncio> (formato interno) — anuncios estáticos adicionales
 */
const AnuncioPopup = ({
  destino   = 'portal',
  popupId   = 'general',
  delay     = 900,
  anunciosExtra = [],   // anuncios estáticos (fallback / legado)
}) => {
  const [anuncios, setAnuncios] = useState([]);
  const [visible,  setVisible]  = useState(false);
  const [current,  setCurrent]  = useState(0);
  const [closing,  setClosing]  = useState(false);
  const [countdown, setCountdown] = useState(null);

  // ── Cargar anuncios desde la API ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const key = `ecg_popup_seen_${popupId}`;
    if (sessionStorage.getItem(key)) return; // ya se vio en esta sesión

    const fetchAndShow = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const url   = `/api/users?resource=anuncios&destino=${encodeURIComponent(destino)}`;
        const res   = await fetch(url);
        const data  = res.ok ? await res.json() : { anuncios: [] };

        const fromApi = (data.anuncios || [])
          .filter(a => a.activo && (!a.fecha_fin || a.fecha_fin >= today))
          .map(normalizeApiAnuncio);

        const combined = [...fromApi, ...anunciosExtra];
        if (cancelled || combined.length === 0) return;

        setAnuncios(combined);
        setTimeout(() => { if (!cancelled) setVisible(true); }, delay);
      } catch {
        // Si la API falla, mostrar anuncios estáticos si existen
        if (anunciosExtra.length > 0) {
          setAnuncios(anunciosExtra);
          setTimeout(() => { if (!cancelled) setVisible(true); }, delay);
        }
      }
    };

    fetchAndShow();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino, popupId, delay]);

  // ── Countdown para anuncio con expiry ───────────────────────────────────────
  useEffect(() => {
    const anuncio = anuncios[current];
    if (!anuncio?.expiry) { setCountdown(null); return; }

    const calc = () => {
      const diff = new Date(anuncio.expiry) - new Date();
      if (diff <= 0) return null;
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    };
    setCountdown(calc());
    const t = setInterval(() => setCountdown(calc()), 1000);
    return () => clearInterval(t);
  }, [anuncios, current]);

  const close = useCallback(() => {
    setClosing(true);
    sessionStorage.setItem(`ecg_popup_seen_${popupId}`, '1');
    setTimeout(() => { setVisible(false); setClosing(false); }, 350);
  }, [popupId]);

  const prev = () => setCurrent(c => (c - 1 + anuncios.length) % anuncios.length);
  const next = () => setCurrent(c => (c + 1) % anuncios.length);

  if (!visible || anuncios.length === 0) return null;

  const anuncio  = anuncios[current];
  const style    = typeStyles[anuncio.type] || typeStyles.aviso;
  const IconComp = ICONS[anuncio.icon] || Bell;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[900] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[901] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`relative w-full max-w-md pointer-events-auto rounded-3xl overflow-hidden shadow-2xl transition-all duration-350 ${
            closing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
          }`}
          style={{ animation: closing ? '' : 'popupIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          {/* Header */}
          <div className={`relative bg-gradient-to-br ${style.bg} p-6 pb-8 text-white overflow-hidden`}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />

            <button
              onClick={close}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors z-10"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                {style.label}
              </span>
              {anuncio.badge && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-2.5 py-1 rounded-full">
                  {anuncio.badge}
                </span>
              )}
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-white/20 rounded-2xl p-3 flex-shrink-0">
                <IconComp size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black leading-snug">{anuncio.title}</h2>
                {anuncio.subtitle && (
                  <p className="text-white/80 text-sm mt-0.5 font-medium">{anuncio.subtitle}</p>
                )}
              </div>
            </div>

            {anuncio.image && (
              <div className="mt-4 rounded-2xl overflow-hidden h-36 relative z-10">
                <img src={anuncio.image} alt={anuncio.title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Cuerpo */}
          <div className="bg-white p-6">
            <p className="text-gray-600 text-sm leading-relaxed">{anuncio.body}</p>

            {/* Countdown */}
            {countdown && (
              <div className="mt-4 bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">⏱ Tiempo restante</p>
                <div className="flex justify-center gap-3">
                  {[{ val: countdown.d, label: 'días' }, { val: countdown.h, label: 'hrs' }, { val: countdown.m, label: 'min' }, { val: countdown.s, label: 'seg' }].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-800 tabular-nums w-10 text-center">{String(val).padStart(2, '0')}</span>
                      <span className="text-xs text-gray-400 font-bold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {anuncio.cta && (
              <a
                href={anuncio.ctaLink || '#'}
                target={anuncio.ctaLink ? '_blank' : '_self'}
                rel="noreferrer"
                onClick={close}
                className={`mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r ${style.bg} text-white font-bold text-sm py-3 px-6 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md`}
              >
                {anuncio.cta}
                <ArrowRight size={15} />
              </a>
            )}

            <button
              onClick={close}
              className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Cerrar
            </button>
          </div>

          {/* Navegación multi-anuncio */}
          {anuncios.length > 1 && (
            <div className={`bg-gradient-to-r ${style.bg} px-4 py-3 flex items-center justify-between`}>
              <button onClick={prev} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                {anuncios.map((_, i) => (
                  <NavDot key={i} active={i === current} onClick={() => setCurrent(i)} />
                ))}
              </div>
              <button onClick={next} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};

export default AnuncioPopup;
