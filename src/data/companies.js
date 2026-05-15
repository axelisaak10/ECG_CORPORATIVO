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
    slogan: '¡TU ÉXITO COMIENZA CON UNA INGENIERÍA BIEN EJECUTADA!',
    color: 'from-ecg-gris to-ecg-gris-claro',
    accentColor: 'ecg-gris',

    // ── Contacto ──────────────────────────────────────────────────────────────
    phone: '5214427734562',
    email: 'centroecg@ecgcorporativo.com',
    direccion: 'El Marqués, Querétaro, México',
    cobertura: 'Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)',
    socialMedia: {
      facebook: 'https://www.facebook.com/profile.php?id=100092558892899',
      instagram: 'https://www.instagram.com/ecg_corporativo_qro/',
      tiktok: 'https://www.tiktok.com/@ecg_corporativo_qro'
    },

    // ── Sección Inicio — Carrusel ──────────────────────────────────────────────
    // Puedes agregar imágenes (.png, .jpg) o videos (.mp4, .webm, .mov)
    // Para imágenes: { url: '/assets/fotos/mi-foto.jpg', caption: 'Descripción' }
    // Para videos:   { url: '/assets/videos/mi-video.mp4', caption: 'Descripción', type: 'video' }
    //                También puedes agregar poster: '/assets/fotos/poster.jpg' para la miniatura del video
    carouselImages: [
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778694013/imagenecg1_pmumwd.jpg', caption: 'Ingeniería Industrial' },
      { url: 'https://res.cloudinary.com/djraiiuyg/video/upload/v1778694013/videoecg1_wqwrdv.mp4', caption: 'Instalaciones Eléctricas', type: 'video' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778694013/imagenecg5_cfaurj.jpg', caption: 'Equipos Industriales' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778694012/imagenecg2_fedasr.jpg', caption: 'Mantenimiento Especializado' }
    ],

    // ── Sección Inicio — Features ─────────────────────────────────────────────
    features: [
      {
        name: 'MISIÓN',
        desc: 'Brindar soluciones integrales en ingeniería eléctrica mediante servicios de mantenimiento, construcción e infraestructura eléctrica, desarrollo de planos generales, diseño y ejecución de subestaciones, así como análisis energéticos especializados. Nos comprometemos a ofrecer calidad, seguridad y eficiencia en cada proyecto, garantizando confiabilidad operativa y cumplimiento normativo para nuestros clientes industriales, comerciales y públicos.',
        images: [
          { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778698506/ecg_q2nmhs.jpg', caption: 'Proyectos Industriales' },
          { url: 'https://res.cloudinary.com/djraiiuyg/video/upload/v1778694013/videoecg1_wqwrdv.mp4', caption: 'Instalaciones Eléctricas' },
          { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778698506/WhatsApp_Image_2026-05-13_at_12.51.07_PM_h0e6df.jpg', caption: 'Mantenimiento Especializado' }
        ]
      },
      {
        name: 'VISIÓN',
        desc: 'Ser una empresa líder en ingeniería eléctrica a nivel regional y nacional, reconocida por nuestra excelencia técnica, innovación en soluciones energéticas y capacidad para desarrollar proyectos eléctricos de alto impacto, contribuyendo al crecimiento sostenible y a la eficiencia energética del país.',
        images: [
          { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', caption: 'Control de Calidad' },
          { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800', caption: 'Equipos Certificados' },
          { url: 'https://images.unsplash.com/photo-1581093458791-9d42e1db760e?w=800', caption: 'Procesos Auditados' }
        ]
      },
      {
        name: 'VALORES',
        desc: 'Seguridad: La seguridad eléctrica y la integridad de las personas son nuestra prioridad. Calidad Técnica: Trabajamos bajo normas y estándares eléctricos vigentes. Responsabilidad: Cumplimos tiempos, presupuestos y especificaciones técnicas. Innovación: Implementamos tecnologías que optimizan el consumo y mejoran el rendimiento. Honestidad e Integridad: Actuamos con transparencia en cada proceso. Servicio al Cliente: Construimos relaciones de largo plazo basadas en confianza y resultados.',
        images: [
          { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', caption: 'Proyectos Terminados' },
          { url: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800', caption: 'Clientes Satisfechos' },
          { url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800', caption: 'Infraestructura Confiable' }
        ]
      }
    ],

    // ── Sección Nosotros ───────────────────────────────────────────────────────
    historia: 'Fundado en el año 2000 en la ciudad de Querétaro, Querétaro, México, por el ingeniero Juan Erasmo Cuaya Granados, quien aporta más de 20 años de experiencia en el sector del mantenimiento eléctrico, Dictaminación, Gestión y Capacitación, ECG Corporativo se ha consolidado como un socio confiable y experto en soluciones integrales de ingeniería industrial y comercial.',
    mision: 'Brindar soluciones integrales en ingeniería eléctrica mediante servicios de mantenimiento, construcción e infraestructura eléctrica, desarrollo de planos generales, diseño y ejecución de subestaciones, así como análisis energéticos especializados. Nos comprometemos a ofrecer calidad, seguridad y eficiencia en cada proyecto.',
    vision: 'Ser una empresa líder en ingeniería eléctrica a nivel regional y nacional, reconocida por nuestra excelencia técnica, innovación en soluciones energéticas y capacidad para desarrollar proyectos eléctricos de alto impacto, contribuyendo al crecimiento sostenible y a la eficiencia energética del país.',

    // ── Sección Servicios ─────────────────────────────────────────────────────
    services: [
      { title: 'Mantenimiento Industrial, Comercial y Residencial', desc: 'Servicios especializados de mantenimiento preventivo, correctivo y predictivo para instalaciones eléctricas e infraestructura energética. Incluye diagnóstico, reparación, optimización de tableros, transformadores, subestaciones y equipos eléctricos.' },
      { title: 'Construcción, Infraestructura y Planos en General', desc: 'Construcción de almacenes y talleres, diseño e implementación de infraestructura eléctrica, elaboración de planos eléctricos y de ingeniería para proyectos industriales, comerciales y residenciales.' },
      { title: 'Subestaciones y Análisis Energéticos', desc: 'Diseño, construcción, mantenimiento y modernización de subestaciones eléctricas. Análisis de calidad de energía, medición y análisis del consumo eléctrico, evaluación de cargas y eficiencia energética.' },
      { title: 'Propuesta de Valor ECG', desc: 'Reducción de riesgos y fallas operativas mediante ingeniería de alta precisión. Ahorro energético, cumplimiento normativo, respuesta rápida y un solo aliado confiable que centraliza servicios técnicos y de abastecimiento.' }
    ],

    // ── Sección Miembros ──────────────────────────────────────────────────────
    // Foto del miembro: coloca la imagen en /public/assets/miembros/ y pon la ruta aquí
    // Formatos soportados: .png, .jpg, .jpeg, .webp
    // bio: Descripción profesional del miembro (aparece en la tarjeta de presentación)
    // email, phone, linkedin: opcionales, aparecen en la tarjeta de presentación al hacer clic
    team: [
      {
        name: 'Ing. Juan Erasmo Cuaya G.',
        role: 'Fundador y Director',
        specialty: 'Ingeniero en electrónica industrial',
        image: '/assets/miembros/erasmo_cuaya.jpeg',
        bio: 'Ingeniero con más de 20 años de experiencia en mantenimiento eléctrico, dictaminación, gestión y capacitación. Fundador de ECG Corporativo y líder de proyectos de alto impacto en ingeniería eléctrica.',
        email: 'centroecg@ecgcorporativo.com'
      },
      {
        name: 'MARÍA DE RAYO MANCERA',
        role: 'Recursos humanos y finanzas ',
        specialty: 'L.A.E.',
        image: '/assets/miembros/maria_rayo.jpeg',
        bio: 'Equipo especializado en la gestión y ejecución de proyectos industriales, diseño de subestaciones y supervisión técnica de instalaciones eléctricas.'
      },
      {
        name: 'ADELFO MEJÍA AGUILAR',
        role: 'Jefe de operaciones',
        image: '/assets/miembros/adelfo.jpeg',
        bio: 'Técnicos certificados en mantenimiento preventivo, correctivo y predictivo de instalaciones eléctricas e infraestructura energética.'
      },
      {
        name: 'CESAR ERNESTO GUERRA MENDOZA',
        role: 'Jefe de diseño',
        specialty: 'Ingeniero Industrial',
        image: '/assets/miembros/cesar_guerra.jpeg',
        bio: 'Técnicos certificados en mantenimiento preventivo, correctivo y predictivo de instalaciones eléctricas e infraestructura energética.'
      },
      {
        name: 'AXEL ISAAC  RODRÍGUEZ',
        role: 'Desarrollo de software e ingeniería',
        specialty: 'Ingeniero en desarrollo y gestión de software',
        image: '/assets/miembros/axel.jpeg',
        bio: 'Técnicos certificados en mantenimiento preventivo, correctivo y predictivo de instalaciones eléctricas e infraestructura energética.'
      },
      {
        name: 'AXEL ISAAC RODRÍGUEZ',
        role: 'Desarrollo de software e ingeniería',
        specialty: 'Ingeniero en desarrollo y gestión de software',
        image: '/assets/miembros/axel.jpeg',
        bio: 'Técnicos certificados en mantenimiento preventivo, correctivo y predictivo de instalaciones eléctricas e infraestructura energética.'
      }
    ],

    // ── Sección Políticas ──────────────────────────────────────────────────────
    politicas: [
      {
        title: '1. Enfoque Proactivo en las Necesidades del Cliente',
        desc: 'Nos comprometemos a anticipar e identificar activamente las necesidades de nuestros clientes, desarrollando soluciones adaptadas y anticipadas.'
      },
      {
        title: '2. Mejora Continua Basada en Retroalimentación',
        desc: 'Establecemos mecanismos sistemáticos para recopilar comentarios de clientes y empleados, que alimentan procesos de mejora continua en nuestros productos y servicios.'
      },
      {
        title: '3. Medición y Seguimiento de Satisfacción',
        desc: 'Evaluamos regularmente la satisfacción del cliente mediante indicadores clave: Puntuación de Satisfacción del Cliente, tiempos de respuesta y resolución al primer contacto.'
      },
      {
        title: '4. Formación y Empoderamiento del Equipo',
        desc: 'Nos comprometemos a formar de manera continua a nuestro personal en atención al cliente, resolución eficiente y normas de conducta profesional, otorgándoles autoridad para resolver problemas con rapidez.'
      },
      {
        title: '5. Comunicación Clara y Transparente',
        desc: 'Nos esforzamos por establecer expectativas realistas con los clientes, cumpliendo con los compromisos asumidos y evitando promesas ambiguas o imposibles.'
      }
    ]
  },

  // ── EMPRESA 2: Dictaminación y Gestoria ECG ────────────────────────────────
  {
    id: 2,
    name: 'Dictaminación y Gestoría ECG',
    shortName: 'Sustentabilidad',
    // Logo: coloca tu imagen en /public/assets/logos/ y cambia el nombre aquí
    logo: '/assets/logos/Dictaminacion.png',
    slogan: '¡DICTAMINACIÓN Y GESTORÍA SIN COMPLICACIONES, TUS TRÁMITES EN MANOS EXPERTAS!',
    color: 'from-ecg-rojo2 to-ecg-rojo1',
    accentColor: 'ecg-rojo1',

    // ── Contacto ──────────────────────────────────────────────────────────────
    phone: '5214427734562',
    email: 'dictaminacion@ecgcorporativo.com',
    direccion: 'Querétaro, Querétaro, México',
    cobertura: 'Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)',
    socialMedia: {
      facebook: 'https://www.facebook.com/profile.php?id=100092558892899',
      instagram: 'https://www.instagram.com/ecg_corporativo_qro/',
      tiktok: 'https://www.tiktok.com/@ecg_corporativo_qro'
    },

    // ── Sección Inicio — Carrusel ──────────────────────────────────────────────
    carouselImages: [
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778693808/dicta5_i82mmm.jpg', caption: 'Dictaminación' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778693808/dicta3_nxnfwi.jpg', caption: 'Gestoría' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778693808/dicta1_ui3iy7.jpg', caption: 'Cumplimiento Normativo' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778693808/dicta6_jzlsmz.jpg', caption: 'Sustentabilidad Industrial' }
    ],

    // ── Sección Inicio — Features ─────────────────────────────────────────────
    features: [
      {
        name: 'MISIÓN',
        desc: 'Brindar servicios especializados de dictaminación, gestoría y cumplimiento normativo con alto nivel técnico y profesional, asegurando a nuestros clientes la correcta regularización de sus proyectos, optimizando tiempos, reduciendo riesgos y garantizando el apego a la normativa vigente.',
        images: [
          { url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800', caption: 'Dictaminación' },
          { url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', caption: 'Gestoría' },
          { url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800', caption: 'Cumplimiento Normativo' }
        ]
      },
      {
        name: 'VISIÓN',
        desc: 'Ser una empresa líder a nivel regional y nacional en servicios de dictaminación y gestoría, reconocida por su confiabilidad, eficiencia y excelencia técnica, contribuyendo al desarrollo ordenado y legal de proyectos empresariales, industriales y comerciales.',
        images: [
          { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', caption: 'Proyectos Empresariales' },
          { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', caption: 'Proyectos Industriales' },
          { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', caption: 'Proyectos Comerciales' }
        ]
      },
      {
        name: 'VALORES',
        desc: 'Responsabilidad: Cumplimos con cada proceso con seriedad. Transparencia: Actuamos con claridad y honestidad. Eficiencia: Optimizamos tiempos y recursos. Ética profesional: Principios legales y morales sólidos. Compromiso: Acompañamos al cliente hasta la conclusión. Calidad: Alto nivel técnico y normativo. Confidencialidad: Protegemos la información del cliente.',
        images: [
          { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', caption: 'Responsabilidad' },
          { url: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800', caption: 'Confianza' },
          { url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800', caption: 'Ética' }
        ]
      }
    ],

    // ── Sección Nosotros ───────────────────────────────────────────────────────
    historia: 'Fundado en el año 2000 en la ciudad de Querétaro, Querétaro, México, por el ingeniero Juan Erasmo Cuaya Granados, quien aporta más de 20 años de experiencia en el sector del mantenimiento eléctrico, Dictaminación, Gestión y Capacitación.',
    mision: 'Brindar servicios especializados de dictaminación, gestoría y cumplimiento normativo con alto nivel técnico y profesional, asegurando a nuestros clientes la correcta regularización de sus proyectos, optimizando tiempos, reduciendo riesgos y garantizando el apego a la normativa vigente.',
    vision: 'Ser una empresa líder a nivel regional y nacional en servicios de dictaminación y gestoría, reconocida por su confiabilidad, eficiencia y excelencia técnica, contribuyendo al desarrollo ordenado y legal de proyectos empresariales, industriales y comerciales.',

    // ── Sección Servicios ─────────────────────────────────────────────────────
    services: [
      { title: 'Dictaminación Riesgo Alto (Peritaje)', desc: 'Evaluación técnica, normativa y documental de instalaciones de alto riesgo como subestaciones eléctricas, instalaciones industriales y centros de carga elevados. Garantiza cumplimiento de NOM, previene accidentes y facilita permisos.' },
      { title: 'Dictaminación Riesgo Medio', desc: 'Evaluación de instalaciones o actividades que pueden generar afectaciones relevantes. Aplica en comercios, edificios de servicios e instalaciones eléctricas de mediana capacidad.' },
      { title: 'Dictaminación Riesgo Bajo', desc: 'Revisión técnica simplificada para instalaciones con bajo nivel de peligrosidad. Facilita trámites rápidos de aperturas de negocio o permisos municipales.' },
      { title: 'Gestoría ante CFE', desc: 'Trámites técnicos y administrativos ante la CFE para contratación, regularización, modificación o ampliación del suministro eléctrico. Nuevos contratos, aumento de carga, factibilidades.' },
      { title: 'Gestoría ante CENACE', desc: 'Gestión de trámites ante el CENACE para interconexiones, conexión a la Red Nacional de Transmisión y cumplimiento del Código de Red.' },
      { title: 'Gestoría ante SENER', desc: 'Trámites ante la Secretaría de Energía para autorización, regulación y supervisión de proyectos energéticos. Permisos, cumplimiento normativo y certeza jurídica.' },
      { title: 'UVIE\'S', desc: 'Gestión, coordinación y acompañamiento para la evaluación y certificación de instalaciones eléctricas a través de una UVIE acreditada para verificar cumplimiento de la NOM-001-SEDE.' },
      { title: 'Corresponsabilidades de Obra', desc: 'Servicio mediante el cual un corresponsable técnico acreditado asume la supervisión y validación normativa de instalaciones eléctricas y sistemas especiales dentro de un proyecto.' }
    ],

    // ── Sección Miembros ──────────────────────────────────────────────────────
    team: [
      {
        name: 'Ing. Juan Erasmo Cuaya G.',
        role: 'Director General',
        specialty: 'Sustentabilidad y Eficiencia Energética',
        image: '/assets/miembros/erasmo_cuaya.jpeg',
        bio: 'Director General con amplia experiencia en dictaminación, gestoría y cumplimiento normativo. Lidera proyectos de alto impacto en regularización y certificación.',
        email: 'dictaminacion@ecgcorporativo.com'
      },
      {
        name: 'Equipo de Ingeniería',
        role: 'Ingenieros Especialistas',
        specialty: 'Sistemas Eléctricos y Energía Renovable',
        image: '',
        bio: 'Especialistas en sistemas eléctricos, energía renovable y cumplimiento normativo. Responsables del análisis técnico y la evaluación de instalaciones.'
      },
      {
        name: 'Equipo de Proyectos',
        role: 'Gestores de Proyectos',
        specialty: 'Planeación y Control de Proyectos',
        image: '',
        bio: 'Equipo dedicado a la gestión integral de trámites y proyectos, garantizando cumplimiento normativo y tiempos óptimos de entrega.'
      }
    ],

    // ── Sección Políticas ──────────────────────────────────────────────────────
    politicas: [
      {
        title: 'Cumplimiento Normativo Estricto',
        desc: 'Cumplir estrictamente con las leyes, reglamentos y normas aplicables en cada gestión.'
      },
      {
        title: 'Comunicación Constante con el Cliente',
        desc: 'Mantener comunicación constante y clara con el cliente sobre el estatus de sus trámites.'
      },
      {
        title: 'Veracidad Documental',
        desc: 'Garantizar la veracidad y correcta integración de la documentación presentada.'
      },
      {
        title: 'Respeto a los Tiempos Acordados',
        desc: 'Respetar los tiempos acordados, informando oportunamente cualquier eventualidad.'
      }
    ]
  },

  // ── EMPRESA 3: Centro de Capacitación ECG ──────────────────────────────────
  {
    id: 3,
    name: 'CETACHI ECG',
    shortName: 'Capacitación',
    logo: '/assets/logos/Capacitacion.png',
    slogan: 'Formamos, certificamos y fortalecemos tu operación',
    color: 'from-ecg-azul to-ecg-celeste',
    accentColor: 'ecg-azul',

    // ── Contacto ──────────────────────────────────────────────────────────────
    phone: '5214427734562',
    email: 'formacion@ecgcorporativo.com',
    direccion: 'El Marqués, Querétaro, México',
    cobertura: 'Zona Centro y Bajío (Aguascalientes, Guanajuato, Jalisco, Michoacán, Querétaro, San Luis Potosí y Zacatecas)',
    socialMedia: {
      facebook: 'https://www.facebook.com/profile.php?id=100092558892899',
      instagram: 'https://www.instagram.com/ecg_corporativo_qro/',
      tiktok: 'https://www.tiktok.com/@ecg_corporativo_qro'
    },

    // ── Sección Inicio — Carrusel ──────────────────────────────────────────────
    carouselImages: [
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778698506/WhatsApp_Image_2026-05-13_at_12.52.27_PM_c2oejz.jpg', caption: 'Capacitación Profesional' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778601599/CETA1_4_wzhnkr.jpg', caption: 'Trabajo en Equipo' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778601599/CETA1_2_bgnde2.jpg', caption: 'Desarrollo Organizacional' },
      { url: 'https://res.cloudinary.com/djraiiuyg/image/upload/v1778601599/CETA1_1_r08ezg.jpg', caption: 'Liderazgo Empresarial' }
    ],

    // ── Sección Inicio — Features ─────────────────────────────────────────────
    features: [
      {
        name: 'Agentes Capacitadores',
        desc: 'Al estar capacitado en CETACHI tendrás el reconocimiento de gobierno debido a que nuestros capacitadores son reconocidos por la STPS. Contamos con la validez de la STPS para poder expedir DC-3 que avalan tus capacidades laborales.',
        images: [
          { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', caption: 'Talleres de Capacitación' },
          { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', caption: 'Liderazgo Empresarial' },
          { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', caption: 'Dinámicas de Equipo' }
        ]
      },
      {
        name: 'Cursos Especializados',
        desc: 'Contamos con cursos teórico-prácticos especializados en Energía y Mantenimiento industrial, comercial y residencial. Programas certificados alineados a NOMs, STPS y estándares internacionales de formación.',
        images: [
          { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', caption: 'Sesiones de Consultoría' },
          { url: 'https://images.unsplash.com/photo-1560264280-88b68371db39?w=800', caption: 'Certificaciones' },
          { url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', caption: 'Control de Calidad' }
        ]
      },
      {
        name: 'Compromiso',
        desc: 'Dedicación total al desarrollo del capital humano y la cultura de prevención en las empresas. Construimos relaciones de largo plazo con nuestros clientes impulsando su operación.',
        images: [
          { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', caption: 'Responsabilidad Social' },
          { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', caption: 'Formación Continua' },
          { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', caption: 'Trabajo Colaborativo' }
        ]
      }
    ],

    // ── Sección Nosotros ───────────────────────────────────────────────────────
    historia: 'CETACHI ECG — Centro de Transferencia del Conocimiento en Habilidades Industriales, fundado en Querétaro, México, por el Ing. Juan Erasmo Cuaya Granados. Formamos, certificamos y fortalecemos tu operación con capacitadores reconocidos por la STPS.',
    mision: 'Formar y certificar al capital humano en habilidades industriales y energéticas, mediante cursos teórico-prácticos especializados reconocidos por la STPS, contribuyendo a la seguridad, eficiencia y competitividad de las organizaciones.',
    vision: 'Ser el centro de capacitación líder en el Bajío, reconocido por la calidad de sus programas, la excelencia de sus instructores y el impacto real en la operación de nuestros clientes.',

    // ── Sección Servicios ─────────────────────────────────────────────────────
    services: [
      { title: 'Cursos de Energía', desc: 'Cursos teórico-prácticos especializados en sistemas energéticos, eficiencia eléctrica e instalaciones. Programas reconocidos por la STPS con expedición de DC-3.' },
      { title: 'Mantenimiento Industrial', desc: 'Capacitación especializada en mantenimiento industrial, comercial y residencial. Formación técnica alineada a NOMs y estándares internacionales.' },
      { title: 'Agentes Capacitadores ante STPS', desc: 'Capacitadores reconocidos oficialmente por la STPS. Expedición de constancias DC-3 que avalan las capacidades laborales de los participantes.' }
    ],

    // ── Sección Miembros ──────────────────────────────────────────────────────
    team: [
      {
        name: 'Ing. Juan Erasmo Cuaya G.',
        role: 'Director General',
        specialty: 'Ingeniería Industrial y Capacitación',
        image: '/assets/miembros/erasmo_cuaya.jpeg',
        bio: 'Director y fundador de CETACHI ECG. Capacitador reconocido por la STPS con más de 20 años de experiencia en formación técnica industrial.',
        email: 'formacion@ecgcorporativo.com'
      },
      {
        name: 'Equipo de Consultores',
        role: 'Especialistas en Normas',
        specialty: 'STPS, SEMARNAT, ISO 14001',
        image: '',
        bio: 'Consultores especializados en normatividad vigente, certificaciones y estándares internacionales aplicados a la industria.'
      },
      {
        name: 'Equipo de Instructores',
        role: 'Capacitadores Certificados',
        specialty: 'Desarrollo Profesional y Liderazgo',
        image: '',
        bio: 'Instructores certificados ante la STPS, especializados en cursos teórico-prácticos de energía y mantenimiento industrial.'
      }
    ],

    // ── Sección Políticas ──────────────────────────────────────────────────────
    politicas: [
      {
        title: 'Enfoque en el Aprendizaje del Participante',
        desc: 'Diseñamos cada curso centrado en las necesidades reales del participante, garantizando contenidos prácticos, actualizados y aplicables a su entorno laboral.'
      },
      {
        title: 'Instructores Certificados y Actualizados',
        desc: 'Nuestro equipo de instructores mantiene certificaciones vigentes ante la STPS y se actualiza continuamente para ofrecer la más alta calidad educativa.'
      },
      {
        title: 'Cumplimiento Normativo',
        desc: 'Todos nuestros programas están alineados a la normatividad vigente (STPS, NOM) asegurando que las empresas cumplan con sus obligaciones legales.'
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
