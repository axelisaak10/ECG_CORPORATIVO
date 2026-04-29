// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE LAS EMPRESAS — edita aquí toda la información de cada empresa
// ─────────────────────────────────────────────────────────────────────────────

export const companiesData = [

  // ── EMPRESA 1: Centro de Ingeniería y Abastecimiento ECG ───────────────────
  {
    id: 1,
    name: 'Centro de Ingeniería y Abastecimiento ECG',
    shortName: 'Ingeniería',
    // Logo: coloca tu imagen en /public/assets/logos/ y cambia el nombre aquí
    logo: '/assets/logos/centro.png',
    slogan: 'Soluciones Integrales de Ingeniería',
    color: 'from-gray-700 to-gray-500',
    accentColor: 'gray',

    // ── Contacto ──────────────────────────────────────────────────────────────
    phone: '5214427734562',
    email: 'facturacionecging@gmail.com',
    direccion: 'Querétaro, Querétaro, México',
    cobertura: 'Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)',
    socialMedia: {
      facebook: 'https://www.facebook.com/profile.php?id=100092558892899',
      instagram: 'https://www.instagram.com/ecg_corporativo_qro/',
      tiktok: 'https://www.tiktok.com/@ecg_corporativo_qro'
    },

    // ── Sección Inicio — Carrusel ──────────────────────────────────────────────
    carouselImages: [
      { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200', caption: 'Ingeniería Industrial' },
      { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200', caption: 'Instalaciones Eléctricas' },
      { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200', caption: 'Equipos Industriales' },
      { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200', caption: 'Mantenimiento Especializado' }
    ],

    // ── Sección Inicio — Features ─────────────────────────────────────────────
    features: [
      {
        name: 'Experiencia',
        desc: 'Más de 20 años ejecutando proyectos de ingeniería industrial, eléctrica y de abastecimiento con resultados comprobados.',
        images: [
          { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', caption: 'Proyectos Industriales' },
          { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', caption: 'Instalaciones Eléctricas' },
          { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', caption: 'Mantenimiento Especializado' }
        ]
      },
      {
        name: 'Precisión',
        desc: 'Cada proyecto se diseña con cálculos rigurosos y supervisión técnica para garantizar instalaciones seguras y de larga duración.',
        images: [
          { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', caption: 'Control de Calidad' },
          { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800', caption: 'Equipos Certificados' },
          { url: 'https://images.unsplash.com/photo-1581093458791-9d42e1db760e?w=800', caption: 'Procesos Auditados' }
        ]
      },
      {
        name: 'Confiabilidad',
        desc: 'Cumplimos tiempos, costos y especificaciones acordadas. Nuestros clientes confían en nosotros para proyectos críticos.',
        images: [
          { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', caption: 'Proyectos Terminados' },
          { url: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800', caption: 'Clientes Satisfechos' },
          { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', caption: 'Infraestructura Confiable' }
        ]
      }
    ],

    // ── Sección Nosotros ───────────────────────────────────────────────────────
    historia: 'Fundada en el año 2000 en Querétaro, México, por el Ing. Juan Erasmo Cuaya G., quien aporta más de 20 años de experiencia en el sector del mantenimiento eléctrico e industrial. Nos hemos consolidado como un socio confiable y experto en soluciones integrales de ingeniería para el sector industrial y comercial del Bajío.',
    mision: 'Ofrecer soluciones integrales e inteligentes en ingeniería, capacitación, mantenimiento y abastecimiento para los sectores industrial, comercial, institucional y gubernamental, impulsadas por la innovación y el compromiso con la sustentabilidad.',
    vision: 'Ser el socio estratégico de referencia en soluciones integrales de ingeniería, sustentabilidad, suministro y mantenimiento, destacando por nuestra experiencia, capacidad técnica y equipamiento de vanguardia.',

    // ── Sección Servicios ─────────────────────────────────────────────────────
    services: [
      { title: 'Diseño de Subestaciones', desc: 'Diseño, cálculo e instalación de subestaciones eléctricas en media tensión.' },
      { title: 'Optimización de Layout', desc: 'Rediseño de espacios industriales para mejorar la eficiencia operativa y maximizar espacio.' },
      { title: 'Energía Industrial Integral', desc: 'Sistemas eléctricos, neumáticos e hidráulicos optimizados para alto rendimiento.' },
      { title: 'Pailería Especializada', desc: 'Pailería industrial de precisión con técnicas MIG y TIG en acero inoxidable.' },
      { title: 'Mobiliario Industrial', desc: 'Diseño y fabricación de racks, estanterías y mesas de trabajo a medida.' },
      { title: 'Construcción de Almacenes', desc: 'Diseño y construcción de almacenes adaptados a necesidades industriales específicas.' }
    ],

    // ── Sección Miembros ──────────────────────────────────────────────────────
    team: [
      { name: 'Ing. Juan Erasmo Cuaya G.', role: 'Fundador y Director', specialty: 'Ingeniería Eléctrica Industrial' },
      { name: 'Gerencia de Ingeniería', role: 'Equipo Técnico', specialty: 'Proyectos Industriales y Subestaciones' },
      { name: 'Equipo de Mantenimiento', role: 'Técnicos Especializados', specialty: 'Mantenimiento Preventivo y Correctivo' }
    ],

    // ── Sección Políticas ──────────────────────────────────────────────────────
    politicas: [
      {
        title: 'Seguridad en Obra',
        desc: 'Todos nuestros trabajos se realizan bajo protocolos estrictos de seguridad industrial, cumpliendo con NOMs vigentes para proteger a nuestro personal y al cliente.'
      },
      {
        title: 'Calidad en Materiales y Ejecución',
        desc: 'Utilizamos únicamente materiales certificados de proveedores confiables, y cada trabajo es supervisado por ingenieros responsivos para garantizar la calidad.'
      },
      {
        title: 'Cumplimiento de Plazos',
        desc: 'Nos comprometemos a entregar cada proyecto en el tiempo acordado, con procesos de planeación y control que previenen retrasos.'
      },
      {
        title: 'Garantía de Trabajos',
        desc: 'Ofrecemos garantía en mano de obra e instalaciones. Cualquier falla atribuible a nuestra ejecución es atendida sin costo adicional para el cliente.'
      },
      {
        title: 'Transparencia y Ética',
        desc: 'Trabajamos con presupuestos detallados y transparentes, sin costos ocultos, manteniendo una comunicación honesta durante todo el proyecto.'
      }
    ]
  },

  // ── EMPRESA 2: Dictaminación y Gestoria ECG ────────────────────────────────
  {
    id: 2,
    name: 'Dictaminación y Gestoria ECG',
    shortName: 'Sustentabilidad',
    // Logo: coloca tu imagen en /public/assets/logos/ y cambia el nombre aquí
    logo: '/assets/logos/Dictaminacion.png',
    slogan: 'Innovación Energética Sostenible',
    color: 'from-red-600 to-red-500',
    accentColor: 'red',

    // ── Contacto ──────────────────────────────────────────────────────────────
    phone: '5214427734562',
    email: 'centroecging@gmail.com',
    direccion: 'Querétaro, Querétaro, México',
    cobertura: 'Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)',
    socialMedia: {
      facebook: 'https://www.facebook.com/profile.php?id=100092558892899',
      instagram: 'https://www.instagram.com/ecg_corporativo_qro/',
      tiktok: 'https://www.tiktok.com/@ecg_corporativo_qro'
    },

    // ── Sección Inicio — Carrusel ──────────────────────────────────────────────
    carouselImages: [
      { url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200', caption: 'Energía Sostenible' },
      { url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200', caption: 'Paneles Solares' },
      { url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1200', caption: 'Eficiencia Energética' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200', caption: 'Sustentabilidad Industrial' }
    ],

    // ── Sección Inicio — Features ─────────────────────────────────────────────
    features: [
      {
        name: 'Innovación',
        desc: 'Desarrollamos proyectos de energía limpia con tecnología de vanguardia para el sector industrial.',
        images: [
          { url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800', caption: 'Proyectos Solares' },
          { url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', caption: 'Instalación Fotovoltaica' },
          { url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800', caption: 'Energía Renovable' }
        ]
      },
      {
        name: 'Eficiencia',
        desc: 'Reducimos costos energéticos hasta un 40% mediante análisis de calidad de energía y optimización de sistemas eléctricos.',
        images: [
          { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', caption: 'Análisis Energético' },
          { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', caption: 'Sistemas de Control' },
          { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', caption: 'Monitoreo de Planta' }
        ]
      },
      {
        name: 'Sustentabilidad',
        desc: 'Comprometidos con la reducción de la huella de carbono y el cumplimiento de normativas ambientales internacionales.',
        images: [
          { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', caption: 'Impacto Ambiental' },
          { url: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800', caption: 'Responsabilidad Ambiental' },
          { url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', caption: 'Energía Limpia' }
        ]
      }
    ],

    // ── Sección Nosotros ───────────────────────────────────────────────────────
    historia: 'JECG Proyectos de Sustentabilidad nace de la visión del Ing. Juan Erasmo Cuaya G. por impulsar la transición energética en el sector industrial mexicano. Con sede en Querétaro, atendemos a empresas que buscan reducir su consumo energético y cumplir con estándares ambientales cada vez más exigentes.',
    mision: 'Desarrollar proyectos de eficiencia energética y sustentabilidad que permitan a nuestros clientes reducir costos, cumplir normativas ambientales y contribuir a un modelo energético más limpio y sostenible.',
    vision: 'Ser la empresa líder en soluciones de sustentabilidad energética en el Bajío, reconocida por la calidad técnica de sus proyectos y su impacto positivo en el medio ambiente.',

    // ── Sección Servicios ─────────────────────────────────────────────────────
    services: [
      { title: 'Cambios de Tarifas Eléctricas', desc: 'Ajuste tarifario que promueve la eficiencia energética e incentiva el consumo sostenible.' },
      { title: 'Corrección de Bajo Factor de Potencia', desc: 'Optimización del sistema eléctrico reduciendo corrientes reactivas y mejorando la eficiencia global.' },
      { title: 'Motores Eficientes', desc: 'Motores de alto rendimiento con arranques suaves que minimizan el consumo energético.' },
      { title: 'Estudios de Calidad de Energía', desc: 'Evaluación de distorsión armónica y tensiones para reducir pérdidas en el sistema.' },
      { title: 'Sistemas de Cogeneración', desc: 'Generación simultánea de electricidad y calor con eficiencias superiores al 80%.' },
      { title: 'Amparos para DAP', desc: 'Gestión de amparos legales en defensa de usuarios afectados por el cobro del Derecho de Alumbrado Público.' }
    ],

    // ── Sección Miembros ──────────────────────────────────────────────────────
    team: [
      { name: 'Ing. Juan Erasmo Cuaya G.', role: 'Director General', specialty: 'Sustentabilidad y Eficiencia Energética' },
      { name: 'Equipo de Ingeniería', role: 'Ingenieros Especialistas', specialty: 'Sistemas Eléctricos y Energía Renovable' },
      { name: 'Equipo de Proyectos', role: 'Gestores de Proyectos', specialty: 'Planeación y Control de Proyectos' }
    ],

    // ── Sección Políticas ──────────────────────────────────────────────────────
    politicas: [
      {
        title: 'Compromiso con la Sostenibilidad',
        desc: 'Todos nuestros proyectos se diseñan bajo criterios de sostenibilidad ambiental, buscando minimizar la huella de carbono y maximizar el aprovechamiento de recursos renovables.'
      },
      {
        title: 'Transparencia en Resultados',
        desc: 'Entregamos reportes detallados de ahorro energético y retorno de inversión, con métricas verificables para que el cliente evalúe el impacto real de cada proyecto.'
      },
      {
        title: 'Cumplimiento Normativo y Legal',
        desc: 'Operamos bajo las normas CFE, NOM-001-SEDE, SENER y demás regulaciones aplicables, garantizando instalaciones seguras, legales y certificadas.'
      },
      {
        title: 'Calidad en Ingeniería',
        desc: 'Aplicamos metodologías rigurosas de diseño, cálculo y supervisión en cada proyecto, asegurando que las instalaciones funcionen de manera óptima y duradera.'
      },
      {
        title: 'Confidencialidad de la Información',
        desc: 'La información energética, técnica y financiera de nuestros clientes es tratada con estricta confidencialidad, bajo acuerdos de no divulgación cuando se requiera.'
      }
    ]
  },

  // ── EMPRESA 3: Centro de Capacitación ECG ──────────────────────────────────
  {
    id: 3,
    name: 'Centro de Capacitación ECG',
    shortName: 'Capacitación',
    logo: '/assets/logos/Capacitacion.png',
    slogan: 'Formación Profesional Especializada',
    color: 'from-blue-600 to-cyan-500',
    accentColor: 'blue',

    // ── Contacto ──────────────────────────────────────────────────────────────
    phone: '5214427734562',
    email: 'centroecging@gmail.com',
    direccion: 'Querétaro, Querétaro, México',
    cobertura: 'Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)',
    socialMedia: {
      facebook: 'https://www.facebook.com/profile.php?id=100092558892899',
      instagram: 'https://www.instagram.com/ecg_corporativo_qro/',
      tiktok: 'https://www.tiktok.com/@ecg_corporativo_qro'
    },

    // ── Sección Inicio — Carrusel ──────────────────────────────────────────────
    carouselImages: [
      { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200', caption: 'Capacitación Profesional' },
      { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200', caption: 'Trabajo en Equipo' },
      { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200', caption: 'Desarrollo Organizacional' },
      { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200', caption: 'Liderazgo Empresarial' }
    ],

    // ── Sección Inicio — Features ─────────────────────────────────────────────
    features: [
      {
        name: 'Experiencia',
        desc: 'Más de 20 años formando profesionales en seguridad, medio ambiente y desarrollo organizacional.',
        images: [
          { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', caption: 'Talleres de Capacitación' },
          { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', caption: 'Liderazgo Empresarial' },
          { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', caption: 'Dinámicas de Equipo' }
        ]
      },
      {
        name: 'Calidad',
        desc: 'Programas certificados alineados a NOMs, STPS y estándares internacionales de formación.',
        images: [
          { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', caption: 'Sesiones de Consultoría' },
          { url: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800', caption: 'Certificaciones' },
          { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', caption: 'Control de Calidad' }
        ]
      },
      {
        name: 'Compromiso',
        desc: 'Dedicación total al desarrollo del capital humano y la cultura de prevención en las empresas.',
        images: [
          { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', caption: 'Responsabilidad Social' },
          { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', caption: 'Formación Continua' },
          { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', caption: 'Trabajo Colaborativo' }
        ]
      }
    ],

    // ── Sección Nosotros ───────────────────────────────────────────────────────
    historia: 'Fundada en Querétaro, México, por el Ing. Juan Erasmo Cuaya G., con amplia experiencia en seguridad industrial, medio ambiente y desarrollo organizacional. Nos hemos consolidado como referente en capacitación especializada para empresas del sector industrial y comercial.',
    mision: 'Ofrecer programas de capacitación y consultoría de alto impacto que fortalezcan las competencias del capital humano, promoviendo culturas de seguridad, sostenibilidad y mejora continua en las organizaciones.',
    vision: 'Ser la empresa de capacitación más reconocida del Bajío, distinguida por la calidad de sus instructores, la pertinencia de sus programas y su compromiso con el desarrollo profesional de las personas.',

    // ── Sección Servicios ─────────────────────────────────────────────────────
    services: [
      { title: 'Sistema de Gestión Ambiental', desc: 'Consultoría en evaluación diagnóstica, diseño e implementación de SGA, auditorías internas y certificaciones ambientales.' },
      { title: 'Seguridad e Higiene Industrial', desc: 'Diagnóstico de riesgos laborales según NOMs, diseño de políticas y procedimientos, brigadas y programas de prevención.' },
      { title: 'Desarrollo Organizacional', desc: 'Diagnóstico de clima organizacional, estrategias de cambio y mejora, desarrollo de liderazgo y coaching.' },
      { title: 'Mantenimiento Industrial', desc: 'Análisis de procesos de mantenimiento, planificación eficiente con TPM y formación técnica especializada.' },
      { title: 'Electricidad Industrial', desc: 'Revisión de instalaciones eléctricas con enfoque en seguridad normativa (NOM-029, NFPA-70E).' },
      { title: 'Cumplimiento de Código RED', desc: 'Diagnóstico de requisitos técnicos y legales para emitir documentos con código RED.' }
    ],

    // ── Sección Miembros ──────────────────────────────────────────────────────
    team: [
      { name: 'Ing. Juan Erasmo Cuaya G.', role: 'Director General', specialty: 'Ingeniería Industrial y Capacitación' },
      { name: 'Equipo de Consultores', role: 'Especialistas en Normas', specialty: 'STPS, SEMARNAT, ISO 14001' },
      { name: 'Equipo de Instructores', role: 'Capacitadores Certificados', specialty: 'Desarrollo Profesional y Liderazgo' }
    ],

    // ── Sección Políticas ──────────────────────────────────────────────────────
    politicas: [
      {
        title: 'Enfoque en el Aprendizaje del Participante',
        desc: 'Diseñamos cada curso centrado en las necesidades reales del participante, garantizando contenidos prácticos, actualizados y aplicables a su entorno laboral.'
      },
      {
        title: 'Instructores Certificados y Actualizados',
        desc: 'Nuestro equipo de instructores mantiene certificaciones vigentes y se actualiza continuamente para ofrecer la más alta calidad educativa.'
      },
      {
        title: 'Cumplimiento Normativo',
        desc: 'Todos nuestros programas están alineados a la normatividad vigente (STPS, SEMARNAT, NOM) asegurando que las empresas cumplan con sus obligaciones legales.'
      },
      {
        title: 'Mejora Continua',
        desc: 'Recopilamos retroalimentación de cada evento de capacitación para mejorar continuamente nuestros programas, metodologías y materiales.'
      },
      {
        title: 'Confidencialidad',
        desc: 'La información de nuestros clientes y participantes es tratada con estricta confidencialidad, cumpliendo con la Ley Federal de Protección de Datos Personales.'
      }
    ]
  }
];
