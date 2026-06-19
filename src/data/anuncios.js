// ─────────────────────────────────────────────────────────────────────────────
// ANUNCIOS Y OFERTAS — edita aquí los anuncios del portal y de cada empresa
// ─────────────────────────────────────────────────────────────────────────────
//
// Tipos disponibles: 'oferta' | 'novedad' | 'evento' | 'aviso' | 'promocion'
// Íconos disponibles: 'Tag' | 'Zap' | 'Gift' | 'Bell' | 'Sparkles'
//
// Para desactivar el popup de un contexto, deja el array vacío [].
//
// Estructura de cada anuncio:
// {
//   type     : 'oferta',          // tipo visual
//   icon     : 'Zap',             // ícono (opcional)
//   badge    : '¡NUEVO!',         // etiqueta extra destacada (opcional)
//   title    : 'Título del anuncio',
//   subtitle : 'Subtítulo breve', // (opcional)
//   body     : 'Descripción completa del anuncio...',
//   image    : '/assets/foto.jpg',// URL de imagen (opcional)
//   cta      : 'Ver más',         // texto del botón (opcional)
//   ctaLink  : 'https://...',     // URL del botón (opcional, si omites abre el popup)
//   expiry   : '2026-12-31T23:59:59', // fecha de vencimiento ISO (opcional, muestra countdown)
// }
// ─────────────────────────────────────────────────────────────────────────────

// ── Portal principal (página de inicio) ──────────────────────────────────────
export const anunciosPortal = [
  {
    type: 'novedad',
    icon: 'Sparkles',
    badge: '¡NUEVO!',
    title: 'Portal ECG Corporativo',
    subtitle: 'Tu ventana a todas nuestras empresas',
    body: 'Explora los servicios de nuestras tres empresas: Centro de Ingeniería, Gestoría y Dictaminación. Contáctanos directamente desde cada perfil o solicita una cotización en línea.',
    cta: 'Conocer empresas',
    ctaLink: '',
  },
];

// ── Empresa 1: Centro de Ingeniería y Abastecimiento ECG (id: 1) ──────────────
export const anunciosEmpresa1 = [
  {
    type: 'oferta',
    icon: 'Zap',
    badge: '¡TIEMPO LIMITADO!',
    title: 'Diagnóstico Eléctrico GRATIS',
    subtitle: 'Centro de Ingeniería y Abastecimiento ECG',
    body: 'Solicita tu diagnóstico eléctrico sin costo para proyectos industriales o comerciales este mes. Incluye análisis de carga, revisión de tableros y reporte de riesgos.',
    cta: 'Solicitar diagnóstico',
    ctaLink: 'https://wa.me/5214427734562?text=Hola%2C%20me%20interesa%20el%20diagn%C3%B3stico%20el%C3%A9ctrico%20gratuito',
    expiry: '2026-07-31T23:59:59',
  },
];

// ── Empresa 2: Gestoría ECG (id: 2) ──────────────────────────────────────────
export const anunciosEmpresa2 = [
  {
    type: 'promocion',
    icon: 'Gift',
    badge: '20% OFF',
    title: 'Gestión de Trámites con Descuento',
    subtitle: 'Gestoría ECG',
    body: 'Obtén un 20% de descuento en tu primer trámite de gestión documental o regularización. Válido para nuevos clientes que contraten antes del 31 de julio.',
    cta: 'Contactar asesor',
    ctaLink: '',
    expiry: '2026-07-31T23:59:59',
  },
];

// ── Empresa 3: Dictaminación ECG (id: 3) ─────────────────────────────────────
export const anunciosEmpresa3 = [
  {
    type: 'evento',
    icon: 'Bell',
    title: 'Taller de Normativas 2026',
    subtitle: 'Dictaminación ECG',
    body: 'Participa en nuestro taller virtual sobre las últimas actualizaciones en normativas de seguridad eléctrica (NOM-001-SEDE). Cupo limitado — regístrate pronto.',
    cta: 'Registrarme al taller',
    ctaLink: '',
    expiry: '2026-08-15T00:00:00',
  },
  {
    type: 'oferta',
    icon: 'Tag',
    badge: 'PAQUETE',
    title: 'Dictamen + Planos por un solo precio',
    subtitle: 'Dictaminación ECG',
    body: 'Contrata nuestro paquete integral: dictamen técnico y elaboración de planos eléctricos certificados, con un ahorro del 15% vs. servicios por separado.',
    cta: 'Ver paquete',
    ctaLink: '',
  },
];

// ── Mapa de anuncios por ID de empresa ───────────────────────────────────────
// Agrega aquí nuevas empresas cuando las necesites
export const anunciosPorEmpresa = {
  1: anunciosEmpresa1,
  2: anunciosEmpresa2,
  3: anunciosEmpresa3,
};
