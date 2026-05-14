// RIGI Tracker — data layer
// Source: Boletín Oficial, TN, Infobae, Ámbito. Update: May 2026.

window.RIGI = {
  sectors: {
    oilgas:         { label: 'Oil & Gas',       color: '#475569' },
    mining:         { label: 'Minería',         color: '#2563eb' },
    energy:         { label: 'Energía',         color: '#059669' },
    infrastructure: { label: 'Infraestructura', color: '#d97706' }
  },

  statuses: {
    operativo:    { label: 'Operativo',       color: '#16a34a' },
    construccion: { label: 'En construcción', color: '#2563eb' },
    desarrollo:   { label: 'En desarrollo',   color: '#ca8a04' },
    ampliacion:   { label: 'En ampliación',   color: '#4f46e5' },
    exploracion:  { label: 'En exploración',  color: '#9333ea' },
    aprobado:     { label: 'Aprobado',        color: '#6b7280' }
  },

  // Approx province centroids on a 320x540 SVG of Argentina
  provinces: {
    'Jujuy':         { region: 'NOA',       x: 130, y: 58 },
    'Salta':         { region: 'NOA',       x: 152, y: 100 },
    'Catamarca':     { region: 'NOA',       x: 138, y: 148 },
    'Santa Fe':      { region: 'Litoral',   x: 200, y: 198 },
    'San Juan':      { region: 'Cuyo',      x: 108, y: 220 },
    'Mendoza':       { region: 'Cuyo',      x: 108, y: 278 },
    'Buenos Aires':  { region: 'Pampeana',  x: 220, y: 310 },
    'Neuquén':       { region: 'Patagonia', x: 105, y: 348 },
    'Río Negro':     { region: 'Patagonia', x: 165, y: 388 }
  },

  projects: [
    {
      id: 1, sector: 'energy', status: 'operativo',
      name: 'Parque solar YPF Luz',
      company: 'YPF Luz',
      province: 'Mendoza',
      amount: 211,
      location: 'Las Heras, Mendoza',
      description: 'Primer proyecto del RIGI aprobado e inaugurado. Parque solar fotovoltaico de 305 MW de capacidad instalada, ya genera 100 MW y fue el primero del régimen en recibir habilitación de CAMMESA.',
      timeline: '2024: inaugurado · 100 MW operativos · 305 MW a capacidad total',
      impact: '305 MW renovables. Reducción de emisiones. Abastecimiento de la red de Mendoza.',
      opportunities: [
        'Mantenimiento de paneles y equipos eléctricos',
        'Monitoreo y optimización de generación con IA',
        'Expansión a nuevas fases del parque',
        'Servicios de seguridad operativa'
      ],
      companies: 'YPF Luz (subsidiaria de YPF)'
    },
    {
      id: 2, sector: 'oilgas', status: 'construccion',
      name: 'Vaca Muerta Oleoducto Sur (VMOS)',
      company: 'YPF + PAE + Vista + Pampa + Pluspetrol + Chevron + Shell',
      province: 'Neuquén',
      amount: 2486,
      location: 'Allen (Neuquén) → Punta Colorada (Río Negro)',
      description: 'Oleoducto de 437 km que conectará la producción de Vaca Muerta con Punta Colorada para exportación. Operativo hacia fines de 2026.',
      timeline: '2025–2026: construcción · Fin 2026: puesta en operación',
      impact: 'Duplicación de la capacidad exportadora petrolera. Reducción de costos logísticos. Miles de empleos.',
      opportunities: [
        'Cañerías y válvulas de alta presión',
        'Ingeniería de detalle y supervisión de obra',
        'Sistemas de monitoreo y detección de fugas',
        'Bombas y equipos de impulsión',
        'Soldadura especializada',
        'Campamentos y logística'
      ],
      companies: 'YPF, Pan American Energy, Vista Energy, Pampa Energía, Pluspetrol, Chevron, Shell'
    },
    {
      id: 3, sector: 'oilgas', status: 'desarrollo',
      name: 'GNL PAE-Golar / Southern Energy',
      company: 'Southern Energy (PAE + Golar)',
      province: 'Río Negro',
      amount: 6878,
      location: 'Golfo San Matías, Río Negro',
      description: 'Megaproyecto de licuefacción de gas natural. Permitirá exportar GNL desde Vaca Muerta a mercados internacionales. La inversión más grande del RIGI.',
      timeline: '2027: inicio de licuefacción',
      impact: 'Argentina como exportador de GNL. Divisas por miles de millones. Demanda sostenida de gas de Vaca Muerta.',
      opportunities: [
        'Ingeniería criogénica',
        'Buques metaneros y logística portuaria',
        'Compresión y tratamiento de gas',
        'Mantenimiento criogénico',
        'Inspección y certificación',
        'Proveedores locales para GNL'
      ],
      companies: 'Southern Energy (joint venture PAE + Golar LNG)'
    },
    {
      id: 4, sector: 'mining', status: 'desarrollo',
      name: 'Río Tinto · Litio Salar de Rincón',
      company: 'Río Tinto',
      province: 'Salta',
      amount: 2700,
      location: 'Salar de Rincón, Salta',
      description: 'Extracción y procesamiento de litio en el Salar de Rincón. La minera anglo-australiana apuesta por Argentina como hub global de litio.',
      timeline: '2025–2028: construcción y puesta en marcha',
      impact: 'Salta en el mapa del litio. Carbonato de litio de alta calidad para baterías. Empleo en la Puna salteña.',
      opportunities: [
        'Perforación y exploración',
        'Plantas de evaporación y proceso químico',
        'Equipos para manejo de salmueras',
        'Laboratorios de control',
        'Campamentos en la Puna',
        'Transporte de insumos y producto'
      ],
      companies: 'Río Tinto (Reino Unido / Australia)'
    },
    {
      id: 5, sector: 'infrastructure', status: 'desarrollo',
      name: 'Sidersa · Planta siderúrgica',
      company: 'Sidersa',
      province: 'Buenos Aires',
      amount: 286,
      location: 'San Nicolás, Buenos Aires',
      description: 'Nueva planta siderúrgica para 360.000 toneladas anuales de insumos para industria nacional y exportación.',
      timeline: '2025–2027: construcción y puesta en marcha',
      impact: '360 mil tn/año de acero. Sustitución de importaciones. Integración con la cadena minera y energética.',
      opportunities: [
        'Ingeniería siderúrgica',
        'Equipos de laminación y hornos',
        'Manejo de materiales y logística pesada',
        'Mantenimiento industrial',
        'Comercialización de acero',
        'Transporte ferroviario y portuario'
      ],
      companies: 'Sidersa'
    },
    {
      id: 6, sector: 'mining', status: 'desarrollo',
      name: 'Salar del Hombre Muerto',
      company: 'Galan Lithium',
      province: 'Catamarca',
      amount: 217,
      location: 'Salar del Hombre Muerto, Catamarca',
      description: 'Proyecto de cloruro de litio de la firma australiana Galan Lithium. Exportará US$180 M anuales desde 2029.',
      timeline: '2027–2029: construcción · 2029: US$180 M/año en exportaciones',
      impact: 'US$180 M/año en exportaciones. Empleo en Catamarca. Cadena de valor del litio.',
      opportunities: [
        'Perforación y bombeo de salmueras',
        'Equipos de evaporación solar',
        'Análisis químico y control',
        'Logística en la Puna catamarqueña',
        'Construcción de campamentos'
      ],
      companies: 'Galan Lithium (Australia)'
    },
    {
      id: 7, sector: 'energy', status: 'desarrollo',
      name: 'Parque eólico Olavarría',
      company: 'Acindar / PCR',
      province: 'Buenos Aires',
      amount: 250,
      location: 'Olavarría, Buenos Aires',
      description: 'Parque eólico de 180 MW impulsado por Acindar (ArcelorMittal) y PCR. Energía renovable para la industria del acero y el SADI.',
      timeline: '2025–2027: construcción y conexión a red',
      impact: '180 MW renovables. Abastecimiento directo a la industria siderúrgica. Menor huella de carbono.',
      opportunities: [
        'Montaje de aerogeneradores',
        'Obra civil de fundaciones y caminos',
        'Mantenimiento de turbinas',
        'Almacenamiento de energía',
        'Subestaciones y conexión eléctrica'
      ],
      companies: 'Acindar (ArcelorMittal), PCR'
    },
    {
      id: 8, sector: 'mining', status: 'exploracion',
      name: 'Los Azules',
      company: 'McEwen Cooper',
      province: 'San Juan',
      amount: 2672,
      location: 'San Juan',
      description: 'Uno de los proyectos de cobre más importantes del país. Exploración avanzada y estudio de factibilidad en curso.',
      timeline: '2025–2028: exploración, factibilidad y construcción',
      impact: 'Cobre de clase mundial. San Juan como provincia minera. Empleo directo e indirecto.',
      opportunities: [
        'Perforación diamantina y exploración',
        'Estudios de impacto ambiental',
        'Ingeniería de mina y planta concentradora',
        'Caminos e infraestructura vial',
        'Chancado y molienda',
        'Logística de equipos y suministros'
      ],
      companies: 'McEwen Cooper (Canadá)'
    },
    {
      id: 9, sector: 'infrastructure', status: 'desarrollo',
      name: 'Puerto multipropósito Timbúes',
      company: 'Por confirmar',
      province: 'Santa Fe',
      amount: 277,
      location: 'Timbúes, Santa Fe',
      description: 'Complejo logístico portuario para fertilizantes, hierro, productos siderúrgicos, granos y combustibles. Refuerza el polo agroindustrial santafesino.',
      timeline: '2025–2027: construcción',
      impact: 'Mayor capacidad de exportación/importación. Menor costo logístico para agro e industria. Integración con el Gran Rosario.',
      opportunities: [
        'Dragado y obras portuarias',
        'Equipos de carga y descarga',
        'Silos y almacenes',
        'Gestión logística y operación portuaria',
        'Conexión ferroviaria y vial',
        'Servicios a buques'
      ],
      companies: 'Por confirmar'
    },
    {
      id: 10, sector: 'mining', status: 'desarrollo',
      name: 'Gualcamayo',
      company: 'Minas Argentinas',
      province: 'San Juan',
      amount: 665,
      location: 'San Juan',
      description: 'Ampliación de explotación de oro y plata con esquema de mineralización diferente. Alto impacto en empleo directo.',
      timeline: '2025–2028: nuevo esquema de explotación',
      impact: 'Extensión de vida útil. Empleo directo en San Juan. Producción sostenida de oro y plata.',
      opportunities: [
        'Equipos de minería subterránea',
        'Ventilación y seguridad minera',
        'Plantas de procesamiento',
        'Transporte de mineral',
        'Perforación y voladura'
      ],
      companies: 'Minas Argentinas'
    },
    {
      id: 11, sector: 'mining', status: 'ampliacion',
      name: 'Veladero',
      company: 'Barrick Mining',
      province: 'San Juan',
      amount: 380,
      location: 'San Juan',
      description: 'Ampliación de la mina de oro y plata Veladero. Una de las más importantes del país recibe inversión para extender su producción.',
      timeline: '2025–2027: ampliación y nuevos tajos',
      impact: 'Extensión de vida útil. Mantenimiento de empleo. Producción continua de oro y plata.',
      opportunities: [
        'Movimiento de suelo y cielo abierto',
        'Carguío y transporte',
        'Mantenimiento de flota minera',
        'Tronadura',
        'Gestión de residuos mineros'
      ],
      companies: 'Barrick Mining (Canadá)'
    },
    {
      id: 12, sector: 'mining', status: 'desarrollo',
      name: 'Diablillos',
      company: 'AbraSilver',
      province: 'Salta',
      amount: 760,
      location: 'Salta y Catamarca',
      description: 'Nueva mina de oro y plata de AbraSilver en la frontera entre Salta y Catamarca. Generará 1.200 empleos directos y US$417 M anuales de exportación.',
      timeline: '2025–2028: construcción y puesta en marcha',
      impact: '1.200 empleos directos. US$417 M/año en exportaciones. Desarrollo del NOA.',
      opportunities: [
        'Construcción de planta de procesos',
        'Molienda y flotación',
        'Campamentos e infraestructura',
        'Logística de insumos y producción',
        'Estudios geotécnicos y ambientales'
      ],
      companies: 'AbraSilver (Canadá)'
    },
    {
      id: 13, sector: 'mining', status: 'ampliacion',
      name: 'Fénix',
      company: 'Río Tinto',
      province: 'Catamarca',
      amount: 530,
      location: 'Catamarca',
      description: 'Ampliación de la producción de litio en Catamarca por parte de Río Tinto. Refuerza la apuesta global por Argentina como hub de litio para baterías.',
      timeline: '2026–2029: ampliación de producción',
      impact: 'Más producción de litio en Catamarca. Más exportaciones y empleo local.',
      opportunities: [
        'Piletas de evaporación',
        'Equipos de proceso químico',
        'Mantenimiento industrial',
        'Servicios de laboratorio',
        'Infraestructura en la Puna'
      ],
      companies: 'Río Tinto (Reino Unido / Australia)'
    },
    {
      id: 14, sector: 'oilgas', status: 'desarrollo',
      name: 'Ampliación Gasoducto Perito Moreno',
      company: 'TGS',
      province: 'Neuquén',
      amount: 550,
      location: 'Neuquén → Buenos Aires',
      description: 'Refuerzo de transporte de gas natural en 14 MM m³/día desde Vaca Muerta hacia Buenos Aires. Obra crítica para abastecer demanda interna y posibilitar más exportaciones.',
      timeline: '2025–2027: construcción',
      impact: '+14 MM m³/d de capacidad. Abastecimiento industrial y residencial. Más exportaciones a Chile y Brasil.',
      opportunities: [
        'Cañerías de gran diámetro',
        'Estaciones de compresión',
        'Ingeniería de gasoductos',
        'Soldadura y tendido',
        'Válvulas y control',
        'Estudios de impacto ambiental'
      ],
      companies: 'Transportadora Gas del Sur (TGS)'
    },
    {
      id: 15, sector: 'mining', status: 'ampliacion',
      name: 'Cauchari-Olaroz',
      company: 'Ganfeng + America Lithium + JEMSE',
      province: 'Jujuy',
      amount: 1241,
      location: 'Salar Cauchari-Olaroz, Jujuy',
      description: 'Ampliación del proyecto de litio para alcanzar 40.000 tn/año. Joint venture entre la china Ganfeng, America Lithium y la estatal jujeña JEMSE.',
      timeline: '2025–2027: ampliación a 40.000 tn/año',
      impact: '40.000 tn/año de carbonato de litio. Uno de los proyectos de litio más grandes del país. Empleo en Jujuy.',
      opportunities: [
        'Planta de carbonato de litio',
        'Evaporación y cristalización',
        'Laboratorios de ensayo',
        'Campamentos mineros',
        'Transporte a puerto',
        'Provisión de energía'
      ],
      companies: 'Ganfeng Lithium (China), America Lithium, JEMSE (Jujuy)'
    },
    {
      id: 16, sector: 'mining', status: 'aprobado',
      name: 'Proyecto San Jorge (PSJ)',
      company: 'Zonda Metals + Alberdi Energy',
      province: 'Mendoza',
      amount: 891,
      location: 'Uspallata, Mendoza',
      description: 'Megaproyecto minero de cobre en Uspallata. Aprobado por el Gobierno el 14 de mayo de 2026. Pertenece a la suiza Zonda Metals y la argentina Alberdi Energy.',
      timeline: '2026–2030: construcción y producción',
      impact: 'Cobre de alta ley. Primera gran mina de cobre en Mendoza. Empleo en Uspallata. Exportaciones estratégicas.',
      opportunities: [
        'Ingeniería de mina y planta concentradora',
        'Chancado primario',
        'Caminos de acceso y obra civil',
        'Instalaciones eléctricas y subestaciones',
        'Logística de equipos pesados',
        'Gestión de recursos hídricos',
        'Hotelería y alimentación de personal'
      ],
      companies: 'Zonda Metals GmbH (Suiza), Alberdi Energy (Argentina)'
    }
  ]
};
