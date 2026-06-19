import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowRight, Clock } from 'lucide-react';

// ── Colores de tipo ───────────────────────────────────────────────────────────
const typeStyles = {
  oferta:    { bg: 'from-rose-600 to-pink-700',     badge: '🔥 Oferta especial' },
  novedad:   { bg: 'from-violet-600 to-purple-700', badge: '✨ Novedad'          },
  evento:    { bg: 'from-amber-500 to-orange-600',  badge: '📅 Evento'           },
  aviso:     { bg: 'from-blue-600 to-blue-800',     badge: '📢 Aviso importante' },
  promocion: { bg: 'from-emerald-500 to-teal-700',  badge: '🎁 Promoción'        },
};

// ── Normaliza anuncio de API al formato interno ───────────────────────────────
const normalizeApiAnuncio = (a) => ({
  type:     a.tipo       || 'aviso',
  badge:    a.badge      || '',
  title:    a.titulo     || '',
  subtitle: a.subtitulo  || '',
  body:     a.cuerpo     || '',
  cta:      a.cta_texto  || '',
  ctaLink:  a.cta_link   || '',
  image:    a.imagen_url || '',
  expiry:   a.fecha_fin
    ? (a.fecha_fin.includes('T') ? a.fecha_fin : a.fecha_fin + 'T23:59:59')
    : undefined,
  soloImagen: a.solo_imagen || false,
});

// ── Bloque de dígito del countdown ───────────────────────────────────────────
const DigitBlock = ({ val, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-black/50 backdrop-blur-md rounded-xl px-3 py-1.5 min-w-[48px] text-center">
      <span className="text-2xl font-black text-white tabular-nums leading-none">
        {String(val).padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] font-bold text-white/70 mt-1 uppercase tracking-wider">{label}</span>
  </div>
);

// ── Dot de navegación ─────────────────────────────────────────────────────────
const NavDot = ({ active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full transition-all duration-300 ${
      active ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
    }`}
  />
);

/**
 * AnuncioPopup — popup centrado en imagen con countdown superpuesto
 *
 * Props:
 *   destino      : 'portal' | 'empresa_1' | 'empresa_2' | 'empresa_3'
 *   popupId      : string único para evitar mostrarlo 2x por sesión
 *   delay        : ms antes de mostrarse (default 900)
 *   anunciosExtra: fallback estático
 */
const AnuncioPopup = ({
  destino       = 'portal',
  popupId       = 'general',
  delay         = 900,
  anunciosExtra = [],
}) => {
  const [anuncios,  setAnuncios]  = useState([]);
  const [visible,   setVisible]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [closing,   setClosing]   = useState(false);
  const [countdown, setCountdown] = useState(null);

  // ── Carga desde API ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const key = `ecg_popup_seen_${popupId}`;
    if (sessionStorage.getItem(key)) return;

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

  // ── Countdown ───────────────────────────────────────────────────────────────
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

  const anuncio = anuncios[current];
  const style   = typeStyles[anuncio.type] || typeStyles.aviso;
  const hasImage = !!anuncio.image;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[900] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={close}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[901] flex items-center justify-center p-4 pointer-events-none animate-fadeIn">
        <div
          className={`relative w-full pointer-events-auto rounded-3xl overflow-hidden shadow-2xl transition-all duration-355 ${
            anuncio.soloImagen ? 'max-w-xl' : 'max-w-sm'
          } ${
            closing ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
          }`}
          style={{ animation: closing ? '' : 'popupIn 0.42s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          {anuncio.soloImagen ? (
            /* ── MODO SOLO IMAGEN ── */
            <div className="flex flex-col w-full bg-slate-950">
              <div className="relative w-full overflow-hidden flex items-center justify-center">
                {anuncio.ctaLink ? (
                  <a
                    href={anuncio.ctaLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={close}
                    className="w-full h-full block cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <img
                      src={anuncio.image}
                      alt={anuncio.title || "Anuncio"}
                      className="w-full h-auto object-cover max-h-[75vh]"
                    />
                  </a>
                ) : (
                  <img
                    src={anuncio.image}
                    alt={anuncio.title || "Anuncio"}
                    className="w-full h-auto object-cover max-h-[75vh]"
                  />
                )}

                {/* Botón cerrar */}
                <button
                  onClick={close}
                  className="absolute top-3 right-3 z-30 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors shadow-lg"
                >
                  <X size={15} />
                </button>

                {/* Badges sobre la imagen */}
                {anuncio.badge && (
                  <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                    <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                      {anuncio.badge}
                    </span>
                  </div>
                )}
              </div>

              {/* Countdown EN UN CONTENEDOR SEPARADO INFERIOR (no tapa la foto) */}
              {countdown && (
                <div className="bg-slate-900 py-3.5 px-6 border-t border-slate-800 flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-slate-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Tiempo restante de la oferta
                    </span>
                  </div>
                  <div className="flex items-end gap-2.5">
                    <DigitBlock val={countdown.d} label="días" />
                    <span className="text-slate-500 font-black text-xl mb-3">:</span>
                    <DigitBlock val={countdown.h} label="hrs"  />
                    <span className="text-slate-500 font-black text-xl mb-3">:</span>
                    <DigitBlock val={countdown.m} label="min"  />
                    <span className="text-slate-500 font-black text-xl mb-3">:</span>
                    <DigitBlock val={countdown.s} label="seg"  />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── MODO ESTÁNDAR (CON TEXTO) ── */
            <>
              {/* ── ZONA IMAGEN (o gradiente si no hay imagen) ── */}
              <div className={`relative ${hasImage ? '' : `bg-gradient-to-br ${style.bg}`} overflow-hidden`}
                   style={{ minHeight: hasImage ? '260px' : '160px' }}>

                {/* Imagen de fondo */}
                {hasImage && (
                  <img
                    src={anuncio.image}
                    alt={anuncio.title}
                    className="w-full object-cover"
                    style={{ minHeight: '260px', maxHeight: '340px' }}
                  />
                )}

                {/* Gradiente oscuro sobre la imagen (siempre, para legibilidad) */}
                <div className={`absolute inset-0 ${
                  hasImage
                    ? 'bg-gradient-to-t from-black/85 via-black/30 to-black/20'
                    : `bg-gradient-to-br ${style.bg} opacity-90`
                }`} />

                {/* Botón cerrar */}
                <button
                  onClick={close}
                  className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
                >
                  <X size={15} />
                </button>

                {/* Badge tipo + badge extra */}
                <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
                  <span className="bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    {style.badge}
                  </span>
                  {anuncio.badge && (
                    <span className="bg-yellow-400 text-yellow-900 text-[11px] font-black px-2.5 py-1 rounded-full">
                      {anuncio.badge}
                    </span>
                  )}
                </div>

                {/* ── COUNTDOWN superpuesto en la imagen ── */}
                {countdown && (
                  <div className="absolute bottom-16 left-0 right-0 z-20 flex flex-col items-center gap-1.5 px-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={11} className="text-white/70" />
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                        Tiempo restante
                      </span>
                    </div>
                    <div className="flex items-end gap-2.5">
                      <DigitBlock val={countdown.d} label="días" />
                      <span className="text-white/60 font-black text-xl mb-3">:</span>
                      <DigitBlock val={countdown.h} label="hrs"  />
                      <span className="text-white/60 font-black text-xl mb-3">:</span>
                      <DigitBlock val={countdown.m} label="min"  />
                      <span className="text-white/60 font-black text-xl mb-3">:</span>
                      <DigitBlock val={countdown.s} label="seg"  />
                    </div>
                  </div>
                )}

                {/* Título y subtítulo sobre la imagen */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-4 pt-8">
                  <h2 className="text-lg font-black text-white leading-snug drop-shadow-md">
                    {anuncio.title}
                  </h2>
                  {anuncio.subtitle && (
                    <p className="text-white/75 text-xs font-semibold mt-0.5">{anuncio.subtitle}</p>
                  )}
                </div>
              </div>

              {/* ── ZONA INFERIOR: descripción + CTA ── */}
              <div className="bg-white px-5 py-4 space-y-3">
                {anuncio.body && (
                  <p className="text-gray-600 text-sm leading-relaxed">{anuncio.body}</p>
                )}

                {anuncio.cta && (
                  <a
                    href={anuncio.ctaLink || '#'}
                    target={anuncio.ctaLink ? '_blank' : '_self'}
                    rel="noreferrer"
                    onClick={close}
                    className={`flex items-center justify-center gap-2 w-full bg-gradient-to-r ${style.bg} text-white font-bold text-sm py-3 rounded-2xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md`}
                  >
                    {anuncio.cta}
                    <ArrowRight size={14} />
                  </a>
                )}

                <button
                  onClick={close}
                  className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}

          {/* ── Navegación multi-anuncio ── */}
          {anuncios.length > 1 && (
            <div className={`bg-gradient-to-r ${style.bg} px-4 py-2.5 flex items-center justify-between`}>
              <button onClick={prev} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <div className="flex items-center gap-1.5">
                {anuncios.map((_, i) => (
                  <NavDot key={i} active={i === current} onClick={() => setCurrent(i)} />
                ))}
              </div>
              <button onClick={next} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.90) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  );
};

export default AnuncioPopup;
