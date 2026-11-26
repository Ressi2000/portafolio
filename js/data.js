(function(RQ){
"use strict";

const T = 16, W = 52, H = 36;

const ZONES = {
  gesrutas:{name:"Plaza GesRutas", wall:"#efe3d0", trim:"#cdb999", roof:"#c8303f", roofDark:"#951f2c", roofLight:"#ef5b67", mapColor:"#e04856"},
  infra:   {name:"Distrito Infraestructura", wall:"#c9c6da", trim:"#9f9bb8", roof:"#3f5f8f", roofDark:"#2c4570", roofLight:"#6a8cc0", mapColor:"#5a82bf"},
  sec:     {name:"Distrito Infraestructura", wall:"#7b768c", trim:"#5c586b", roof:"#3d394a", roofDark:"#2a2735", roofLight:"#8a84a0", mapColor:"#7c7499"},
  correo:  {name:"Oficina de correos", wall:"#e8e4f2", trim:"#c3bdd6", roof:"#3b62b8", roofDark:"#284790", roofLight:"#6f94e0", mapColor:"#5f88e0"},
  mercado: {name:"Mercado", wall:"#f3e7cf", trim:"#d4c29d", roof:"#2f8f5b", roofDark:"#1f6a42", roofLight:"#5cc48a", mapColor:"#4ab87b"},
  garaje:  {name:"Casa", wall:"#dfe7e4", trim:"#b3c2bd", roof:"#2f9c8f", roofDark:"#1f7469", roofLight:"#4fc2b3", mapColor:"#48bfb0"},
  casa:    {name:"Casa", wall:"#f1e4d8", trim:"#d2bfae", roof:"#c4607a", roofDark:"#97435a", roofLight:"#e38199", mapColor:"#de6f8c"},
  obra:    {name:"Zona en obra", roofLight:"#ff9b54", mapColor:"#ff9b54"},
  plaza:   {name:"Cruce central", roofLight:"#f2b84b", mapColor:"#f2b84b"}
};

const ROLE_A = "Analista de Desarrollo Web · 2022–2024";
const ROLE_E = "Especialista de Desarrollo Web · 2024–hoy";

const PLACES = [
  {id:"gesrutas-plus", label:"GesRutas Plus", title:"GesRutas Plus", zone:"gesrutas", x:10, y:3, w:7, h:5, status:"prod", role:ROLE_A, port:443,
   summary:"La Fuerza de Ventas del Grupo Sindoni. Evolucionó de GesRutas, el sistema que controlaba el cumplimiento de rutas de los vendedores.",
   points:["La usan más de 60 personas.","Validación de visitas, pedidos, cobranzas y forecast.","Integrada directamente con SAP mediante servicios OData.","El área de Aplicaciones recibió un reconocimiento del Departamento de Ventas por su apoyo a los objetivos comerciales."],
   stack:["Laravel","SAP OData"], tags:["Laravel","SAP OData"], img:"img/gesrutas.webp", caption:"Pantalla de inicio, con el reconocimiento del Departamento de Ventas."},
  {id:"api", label:"API GesRutas", title:"API GesRutas", zone:"gesrutas", x:4, y:8, w:5, h:5, status:"prod", role:ROLE_E, port:8080,
   summary:"API REST que centraliza los servicios de la familia GesRutas.",
   points:["La consumen la app móvil de GesRutas Plus y el portal IClient.","Autenticación con Laravel Sanctum."],
   stack:["Laravel 11","Sanctum","REST"], tags:["Laravel"]},
  {id:"iclient", label:"IClient", title:"GesRutas IClient", zone:"gesrutas", x:18, y:8, w:5, h:5, status:"dev", role:ROLE_E, port:3000,
   summary:"Portal de pedidos empresariales: la nueva versión del portal de autogestión para los clientes de Sindoni.",
   points:["Los clientes reportan cobranzas y pedidos.","Registro de quejas y reclamos.","Consume los servicios de la API GesRutas."],
   stack:["React"], tags:["React"], img:"img/iclient.webp", caption:"Pantalla de inicio del portal."},
  {id:"monitoreo", label:"Monitoreo", title:"Monitoreo de aplicaciones web", zone:"infra", kind:"tower", x:29, y:3, w:4, h:7, status:"prod", role:ROLE_E, port:9090,
   summary:"Servicio en Python que vigila 9 aplicaciones web de Sindoni y alerta ante caídas o latencia.",
   points:["Desplegado en Azure Kubernetes Service (AKS).","Métricas en Prometheus y dashboards en Grafana.","Avisa antes de que venzan los client secrets y los certificados SSL."],
   stack:["Python","AKS","Prometheus","Grafana"], tags:["Python","Infraestructura"]},
  {id:"cerberus", label:"Cerberus 2.0", title:"Cerberus 2.0", zone:"infra", x:35, y:4, w:7, h:6, status:"soon", role:ROLE_E, port:8443,
   summary:"Gestión del inventario tecnológico del grupo en un entorno multiempresa.",
   points:["Asignaciones, préstamos, traslados y auditoría completa.","Acceso diferenciado por roles y atributos dinámicos por equipo.","Exportación a Excel y PDF.","Incluye un chatbot integrado."],
   stack:["Laravel 12","Livewire 3","Alpine.js"], tags:["Laravel","IA"], img:"img/cerberus.webp", caption:"Página de entrada de la versión 2.0."},
  {id:"seguridad", label:"Búnker", title:"Análisis de seguridad", zone:"sec", kind:"bunker", x:43, y:5, w:6, h:5, status:"done", port:22,
   summary:"Respuesta a incidentes y reconocimiento de superficie expuesta.",
   points:["Análisis de correos de phishing: desofuscación de adjuntos con Python.","Matriz de indicadores de compromiso (IoC) e informe técnico.","Reconocimiento OSINT de infraestructura expuesta a internet."],
   stack:["OSINT","Análisis forense","Python"], tags:["Seguridad","Python"]},
  {id:"reporte", label:"Correos", title:"Reporte semanal con IA", zone:"correo", kind:"post", x:30, y:12, w:6, h:4, status:"prod", port:587,
   summary:"Cada viernes traduce los commits y PRs de cuatro repositorios a lenguaje de negocio.",
   points:["Genera un correo en HTML listo para la gerencia.","Quien no es técnico entiende qué avanzó en la semana."],
   stack:["IA generativa","GitHub","Gmail"], tags:["IA"]},
  {id:"mercadito", label:"Mercadito", title:"Mercadito Sindoni", zone:"mercado", kind:"stall", x:4, y:20, w:7, h:5, status:"dev", role:ROLE_E, port:3001,
   summary:"Plataforma que gestiona el beneficio de compra de productos Sindoni para los trabajadores.",
   points:["Registra las compras hechas con el beneficio.","Calcula lo que corresponde como descuento por nómina."],
   stack:["React","Node.js"], tags:["React","Node.js","SAP OData"], img:"img/mercadito.webp", caption:"Pantalla de inicio: cada trabajador entra con su código SAP."},
  {id:"sorteos", label:"Sorteos", title:"Plataforma de sorteos", zone:"mercado", kind:"tent", x:13, y:20, w:7, h:5, status:"prod", role:ROLE_A, port:3002,
   summary:"Plataforma de sorteos con CRM para campañas navideñas.",
   points:["Usada en las campañas del C.C. Las Américas y de Nucita."],
   stack:["React","Node.js"], tags:["React","Node.js"]},
  {id:"moviles", label:"Garaje", title:"Apps móviles nativas", zone:"garaje", kind:"garage", x:29, y:20, w:6, h:5, status:"done", port:19000,
   summary:"Dos apps móviles nativas hechas con React Native.",
   points:["Control de pagos para Inversiones y Transporte Figuera.","App personal para mi vehículo: mantenimientos, gastos de combustible, garantía y kilometraje actual por geolocalización."],
   stack:["React Native"], tags:["React Native"]},
  {id:"casa", label:"Casa de Ressi", title:"Ressi Figuera", zone:"casa", kind:"house", x:37, y:20, w:7, h:5, about:true},
  {id:"promotoras", label:"Promotoras", title:"App de promotoras", zone:"obra", kind:"lot", x:3, y:28, w:5, h:4, status:"build", port:4001,
   summary:"App para gestionar a las promotoras de mercadeo de Sindoni.",
   points:["Para el área de Mercadeo del Grupo Sindoni."], stack:[], tags:[]},
  {id:"flota", label:"Control de flota", title:"Control de flota", zone:"obra", kind:"lot", x:10, y:28, w:5, h:4, status:"build", port:4002,
   summary:"Un solo sistema para el medidor de gasoil, el control de viajes y la preliquidación de transporte.",
   points:["Primero para Inversiones y Transporte Figuera.","Si funciona bien, la idea es llevarlo a Sindoni."], stack:[], tags:[]},
  {id:"patitas", label:"Patitas", title:"Patitas", zone:"obra", kind:"lot", x:17, y:28, w:5, h:4, status:"build", port:4003,
   summary:"App venezolana de protección de mascotas.",
   points:["Emergencias, recuperación de mascotas perdidas e identificación con QR.","Dos tipos de usuario: dueños de mascotas y clínicas veterinarias."], stack:[], tags:[]},
  {id:"terminal", label:"Terminal", title:"Terminal", zone:"plaza", kind:"kiosk", x:27, y:19, w:2, h:2}
];

const VISITABLE = PLACES.filter(p => p.kind !== "kiosk");
const STATUS = {prod:"En producción", dev:"En desarrollo", soon:"Por entregar", done:"Entregado", build:"En obra"};
const ZONE_ORDER = ["gesrutas","infra","correo","mercado","casa","obra"];
const zoneKey = z => (z==="sec" ? "infra" : z==="garaje" ? "casa" : z);

const FILTER_TECHS = ["Laravel","React","Python","SAP OData","Node.js","React Native","Infraestructura","Seguridad","IA"];

const CATS_DATA = [
  {id:"pirulina", name:"Pirulina", role:"Jefa de QA", fur:"long",
   desc:"Pelo largo, oscura y atigrada, con toques naranjas y blancos.",
   points:["Prueba cada build caminando sobre el teclado.","Si algo se rompe, ella ya lo sabía."],
   quotes:["*Pisa F12 y abre DevTools sin querer.*","Miau. Ese deploy necesitaba más pruebas.","*Se sienta exactamente sobre el teclado.*"],
   img:"img/pirulina.webp", x:31*T, y:29*T},
  {id:"theo", name:"Theo", role:"Soporte en sitio", fur:"short",
   desc:"Amarillo con blanco, de pelo corto.",
   points:["Experto en siestas sobre el router.","Responde cualquier ticket con un maullido."],
   quotes:["Mrrr... ¿probaste apagar y volver a encender el router?","*Ronronea en 5 GHz.*","Ticket cerrado por falta de croquetas."],
   img:"img/theo.webp", x:37*T, y:30*T}
];
const YARD = {x:28*T+8, y:28*T, w:15*T, h:4*T};

const CERBERUS_DATA = {
  id:"mini-cerberus", name:"Mini Cerberus", role:"Guardián de Infraestructura",
  desc:"Cachorro cyber-lobo de tres cabezas con ojos y circuitos cian. Patrulla entre la Torre de Monitoreo, Cerberus 2.0 y el Búnker.",
  points:[
    "Cabeza 1 audita asignaciones y préstamos de equipos.",
    "Cabeza 2 vigila los certificados SSL y alertas de Prometheus.",
    "Cabeza 3 exige galletas antes de aprobar el pase a producción."
  ],
  quotes:[
    "¡Guau! ¡Guau! ¡Guau! (En estéreo de 3 canales).",
    "Cabeza 1: «Inventario OK». Cabeza 2: «Puertos cerrados». Cabeza 3: «¿Tienes snacks?».",
    "*Sus circuitos cian parpadean felices mientras mueve la cola.*",
    "Ningún activo tecnológico sale del Distrito Infraestructura sin su visto bueno."
  ],
  img:"img/cerberus-pup.webp",
  x:38*T + 8, y:11*T
};
const INFRA_PATROL = {x:28*T + 8, y:10*T + 5, w:20*T, h:1*T + 6};

const SKILLS = [
  ["Backend","PHP, Laravel, Node.js, Python"],
  ["Frontend y móvil","JavaScript, React, React Native, jQuery"],
  ["Datos","MySQL (Azure), MongoDB, pandas, SQLAlchemy, Power BI"],
  ["Integración","SAP OData, APIs REST, Make, n8n"],
  ["Infraestructura","Kubernetes (AKS), Prometheus, Grafana, Windows Server, Render"],
  ["Seguridad","Phishing, IoC, OSINT, análisis forense"]
];

const EXPERIENCE = [
  {
    role:"Especialista de Desarrollo Web",
    company:"Grupo Sindoni",
    period:"2024 – presente",
    bullets:[
      "Arquitectura y desarrollo de API REST centralizada (Laravel 11 + Sanctum) que alimenta apps móviles y portales B2B.",
      "Desarrollo de GesRutas IClient, Mercadito Sindoni (React / Node.js) y Cerberus 2.0 (Laravel 12, Livewire 3, Alpine.js) con chatbot integrado.",
      "Diseño de servicio de observabilidad en Python sobre Azure Kubernetes Service (AKS) con Prometheus y Grafana para 9 aplicaciones críticas.",
      "Automatización de reportes ejecutivos semanales con IA generativa e investigaciones de seguridad (phishing, IoC, OSINT)."
    ]
  },
  {
    role:"Analista de Desarrollo Web",
    company:"Grupo Sindoni",
    period:"2022 – 2024",
    bullets:[
      "Evolución de GesRutas Plus (Laravel + SAP OData), usada por más de 60 vendedores para visitas, pedidos, cobranzas y forecast.",
      "Reconocimiento del Departamento de Ventas al área de Aplicaciones por el impacto directo en objetivos comerciales.",
      "Desarrollo de plataforma de sorteos con CRM en React y Node.js para campañas masivas (C.C. Las Américas y Nucita)."
    ]
  },
  {
    role:"Proyectos Independientes & Móvil",
    company:"Inversiones y Transporte Figuera / Personal",
    period:"2023 – presente",
    bullets:[
      "Apps móviles nativas en React Native para control de pagos y gestión personal de vehículo con geolocalización.",
      "Diseño en progreso de suites para control de flota/gasoil y Patitas (protección de mascotas con QR)."
    ]
  }
];

const EDUCATION = {
  degree:"Ingeniera de Sistemas",
  school:"Universidad Bicentenaria de Aragua",
  year:"2023",
  extra:"Formación continua en análisis forense digital, respuesta a incidentes y OSINT."
};

const EMAIL = "ressi2000w@hotmail.com";
const LINKEDIN = "https://www.linkedin.com/in/ressi-figuera-534401317";

const ICONS = {
  star: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M5 1h2v3h3v2H8v2h1v3H7V9H5v2H3V8h1V6H2V4h3V1z"/></svg>',
  sun: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M5 1h2v2H5V1zm0 8h2v2H5V9zM1 5h2v2H1V5zm8 0h2v2H9V5zM2 2h2v2H2V2zm6 6h2v2H8V8zm0-6h2v2H8V2zM2 8h2v2H2V8zm2-4h4v4H4V4z"/></svg>',
  sunset: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M5 1h2v2H5V1zM2 3h2v2H2V3zm6 0h2v2H8V3zM4 5h4v3H4V5zM1 8h10v1H1V8zm2 2h6v1H3v-1z"/></svg>',
  moon: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M5 1h3v1H6v1H5v2h1v2h2v1h2v1H8v1H4V9H3V7H2V4h1V2h2V1z"/></svg>',
  sfxOn: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M1 4h2V3h1V2h2v8H4V9H3V8H1V4zm7 0h1v4H8V4zm2-2h1v8h-1V2z"/></svg>',
  sfxOff: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M1 4h2V3h1V2h2v8H4V9H3V8H1V4zm6 0h1v1h1V4h1v1H9v2h1v1H9V7H8v1H7V7h1V5H7V4z"/></svg>',
  heart: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M2 2h3v1h2V2h3v1h1v3h-1v2H9v1H7v1H5V9H3V8H2V6H1V3h1V2z"/></svg>',
  sales: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M5 1h2v2h2v2h2v2H9v2H7v2H5V9H3V7H1V5h2V3h2V1z"/></svg>',
  bolt: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M6 1h3v2H7v2h3v2H8v2H6v2H4V8h2V6H3V4h2V2h1V1z"/></svg>',
  term: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M1 2h2v2h2v2H3v2H1V6h2V4H1V2zm5 6h5v2H6V8z"/></svg>',
  crown: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M1 3h2v2h2V2h2v3h2V3h2v7H1V3z"/></svg>',
  bug: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M3 1h1v2H3V1zm5 0h1v2H8V1zM4 3h4v1h1v4H8v2H4V8H3V4h1V3zM1 4h2v1H1V4zm8 0h2v1H9V4zM1 7h2v1H1V7zm8 0h2v1H9V7z"/></svg>',
  paw: '<svg class="px-ico lg" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M2 3h2v2H2V3zm3-1h2v2H5V2zm3 1h2v2H8V3zM3 6h6v3H8v1H4V9H3V6z"/></svg>',
  rain: '<svg class="px-ico" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M3 2h5v1h2v3H2V3h1V2zm0 5h1v2H3V7zm3 1h1v2H6V8zm3-1h1v2H9V7z"/></svg>'
};

const ACHIEVEMENTS = [
  {
    id:"first-step", icon:ICONS.star.replace('px-ico','px-ico lg'), title:"Primeros pasos",
    desc:"Explora tu primer lugar del pueblo.",
    check: s => s.visited.size >= 1
  },
  {
    id:"cat-lover", icon:ICONS.heart, title:"Cat Lover",
    desc:"Saluda a Pirulina y a Theo en el patio.",
    check: s => s.petted.size >= CATS_DATA.length
  },
  {
    id:"cat-walk", icon:ICONS.paw, title:"Paseo con QA",
    desc:"Dale un snack a Pirulina o a Theo para que te siga por el pueblo.",
    check: s => !!s.flags.catWalk
  },
  {
    id:"sales-force", icon:ICONS.sales, title:"Fuerza de Ventas",
    desc:"Recorre toda la Plaza GesRutas (Plus, API e IClient).",
    check: s => ["gesrutas-plus","api","iclient"].every(id => s.visited.has(id))
  },
  {
    id:"infra-arch", icon:ICONS.bolt, title:"Arquitecta de Infra",
    desc:"Explora Monitoreo, Cerberus 2.0 y el Búnker de seguridad.",
    check: s => ["monitoreo","cerberus","seguridad"].every(id => s.visited.has(id))
  },
  {
    id:"tty-hacker", icon:ICONS.term, title:"Hacker de tty1",
    desc:"Ejecuta un comando técnico en RESSI-OS (neofetch, nmap o sudo).",
    check: s => !!s.flags.hacker
  },
  {
    id:"bug-hunter", icon:ICONS.bug, title:"Cazadora de Bugs",
    desc:"Atrapa los 3 bugs escapados de QA (desbloquea accesorios y lluvia).",
    check: s => s.caughtBugs && s.caughtBugs.size >= 3
  },
  {
    id:"town-legend", icon:ICONS.crown, title:"Leyenda del Pueblo",
    desc:"Completa el 100%: los 14 lugares y los 2 gatos.",
    check: s => s.visited.size >= VISITABLE.length && s.petted.size >= CATS_DATA.length
  }
];

const AVATAR_SKINS = [
  {id:"normal", label:"Clásico", desc:"Chaqueta violeta original"},
  {id:"obra", label:"Casco de obra", desc:"Listo para la zona en construcción"},
  {id:"hacker", label:"Modo Hacker", desc:"Gafas neón y hoodie nocturno"},
  {id:"corona", label:"Corona", desc:"Estilo leyenda del pueblo"}
];

const BUGS_DATA = [
  {id:"bug-plaza", name:"Bug #1 · NullPointer del Café", x:9*T + 8, y:14*T + 10,
   note:"Pirulina dice: «Ese se escapó en el primer sprint de Plaza GesRutas»."},
  {id:"bug-infra", name:"Bug #2 · SSL a las 4:59 PM", x:34*T + 4, y:8*T + 8,
   note:"Pirulina dice: «Menos mal que Prometheus ya lo tenía fichado»."},
  {id:"bug-obra", name:"Bug #3 · z-index: 999999", x:22*T + 8, y:31*T + 6,
   note:"Pirulina dice: «¡Caso cerrado! QA aprueba este portafolio»."}
];

const WISHES = [
  "Un buen commit hoy le ahorra una hora de debug a tu yo del viernes.",
  "Dato curioso: Ressi empezó integrando SAP OData y terminó vigilando 9 apps en Kubernetes.",
  "Pirulina aprobó este despliegue caminando directamente sobre Ctrl+S.",
  "Si Prometheus está en verde y el café está caliente, va a ser un gran día.",
  "Todo bug imposible se arregla 5 minutos después de explicárselo a un gato.",
  "Consejo dev: automatiza los reportes del viernes y regálate tardes más tranquilas.",
  "Dato curioso: Theo duerme sobre el router porque dice que ahí el ping es más tibio.",
  "Un portafolio también puede ser un lugar donde dan ganas de quedarse un rato."
];

const BOARD_NOTES = {
  status:"Abierta a nuevos retos técnicos, proyectos web/full-stack y colaboraciones.",
  focus:[
    "Cerrando detalles de Cerberus 2.0 (Laravel 12 + Livewire 3 + chatbot).",
    "Avanzando en los prototipos de Control de Flota y Patitas (mascotas con QR).",
    "Profundizando en ciberseguridad defensiva, análisis forense digital y OSINT."
  ]
};

/* ---------- Map geometry ---------- */
const PATHS = [
  {x:2,y:17,w:48,h:2},{x:25,y:2,w:2,h:32},
  {x:27,y:10,w:23,h:2},{x:2,y:25,w:23,h:2},{x:27,y:25,w:23,h:2},{x:2,y:32,w:23,h:2}
];
const PLAZA = {x:3,y:8,w:21,h:9};
const CROSS = {x:27,y:19,w:2,h:3};
const GRAVEL = {x:27,y:2,w:23,h:8};
const DIRT = {x:2,y:27,w:23,h:5};
const FOUNTAIN = {x:11,y:11,w:5,h:4};
const POND = {x:45,y:28,w:4,h:4};
const TREES = [[4,5],[7,4],[19,5],[22,4],[33,6],[42,8],[46,3],[38,14],[42,13],[46,14],[48,12],[21,21],[23,23],[23,29],[46,21],[48,23],[44,30],[28,29],[5,19],[23,14]];
const LAMPS = [[24,16],[27,16],[9,16],[17,16],[27,9],[34,9],[11,19],[24,24],[35,19],[44,24],[9,27],[27,27]];
const ZONE_SIGNS = [
  {text:"PLAZA GESRUTAS", zone:"gesrutas", x:13.5, y:16.4},
  {text:"DISTRITO INFRAESTRUCTURA", zone:"infra", x:43, y:12.3},
  {text:"MERCADO", zone:"mercado", x:11.5, y:19.4},
  {text:"ZONA EN OBRA", zone:"obra", x:12.5, y:27.5},
  {text:"PATIO", zone:"casa", x:35, y:27.6}
];

const PROPS = [
  {id:"board", kind:"prop", prop:"board", label:"Tablón", verb:"Leer", x:23, y:19, w:2, h:1, stand:{x:24*T, y:20*T + 9}},
  {id:"mailbox", kind:"prop", prop:"mailbox", label:"Buzón", verb:"Dejar mensaje", x:36, y:15, w:1, h:1, stand:{x:36*T + 8, y:16*T + 9}},
  {id:"fountain", kind:"prop", prop:"fountain", label:"Fuente", verb:"Lanzar moneda", x:FOUNTAIN.x, y:FOUNTAIN.y, w:FOUNTAIN.w, h:FOUNTAIN.h, stand:{x:(FOUNTAIN.x + FOUNTAIN.w/2)*T, y:(FOUNTAIN.y + FOUNTAIN.h)*T + 9}},
  {id:"pond", kind:"prop", prop:"pond", label:"Estanque", verb:"Dar miguitas", x:POND.x, y:POND.y, w:POND.w, h:POND.h, stand:{x:(POND.x + 2)*T, y:POND.y*T - 5}},
  {id:"bowl", kind:"prop", prop:"bowl", label:"Snacks", verb:"Dar croquetas", x:34, y:29, w:1, h:1, stand:{x:34*T + 8, y:29*T + 12}}
];

const inRect = (r,tx,ty) => tx>=r.x && tx<r.x+r.w && ty>=r.y && ty<r.y+r.h;
const isPath = (tx,ty) => PATHS.some(r => inRect(r,tx,ty));

const solids = [];
PLACES.forEach(b => solids.push({x:b.x*T, y:b.y*T, w:b.w*T, h:b.h*T}));
solids.push({x:FOUNTAIN.x*T+2, y:FOUNTAIN.y*T+2, w:FOUNTAIN.w*T-4, h:FOUNTAIN.h*T-4});
solids.push({x:POND.x*T+2, y:POND.y*T+2, w:POND.w*T-4, h:POND.h*T-4});
solids.push({x:23*T+2, y:19*T+3, w:2*T-4, h:T-4});
TREES.forEach(([tx,ty]) => solids.push({x:tx*T+3, y:ty*T+7, w:10, h:9}));

function doorOf(b){
  if(b.stand) return {x:b.stand.x, y:b.stand.y};
  return {x:(b.x+b.w/2)*T, y:(b.y+b.h)*T + 9};
}

function hits(x,y){
  const l=x-5, r=x+5, t=y-6, btm=y;
  if(l<2*T || r>(W-2)*T || t<2*T || btm>(H-2)*T) return true;
  for(const s of solids){ if(l<s.x+s.w && r>s.x && t<s.y+s.h && btm>s.y) return true; }
  return false;
}

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

RQ.DATA = {
  T, W, H, ZONES, ROLE_A, ROLE_E, PLACES, VISITABLE, STATUS, ZONE_ORDER, zoneKey,
  FILTER_TECHS, CATS_DATA, YARD, CERBERUS_DATA, INFRA_PATROL, SKILLS, EXPERIENCE, EDUCATION, EMAIL, LINKEDIN,
  ICONS, ACHIEVEMENTS, AVATAR_SKINS, BUGS_DATA, WISHES, BOARD_NOTES, PROPS,
  PATHS, PLAZA, CROSS, GRAVEL, DIRT, FOUNTAIN, POND, TREES, LAMPS,
  ZONE_SIGNS, inRect, isPath, solids, doorOf, hits, esc
};
})(window.RQ = window.RQ || {});
