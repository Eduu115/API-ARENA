export const DOC_DOCUMENTS = [
  {
    id: "guia-para-empezar",
    title: "Guía para empezar",
    summary: "Mentalidad, estrategia de trabajo y ritmo de entregas para progresar rápido sin quemarte.",
    readTime: "9 min",
    sections: [
      {
        id: "enfoque",
        heading: "Enfoque recomendado para mejorar de forma constante",
        paragraphs: [
          "API Arena no premia solo el resultado final: premia el progreso constante y tu capacidad de iterar con criterio técnico. Si empiezas con un challenge complejo antes de dominar el build, los tests y el flujo de entrega, la frustración suele llegar pronto.",
          "Para la mayoría de estudiantes, la estrategia más efectiva es sencilla: acumula victorias pequeñas en challenges EASY y MEDIUM, interioriza el pipeline y luego sube la dificultad sobre una base estable."
        ],
        bullets: [
          "Trabaja en objetivos de 20-40 minutos: un endpoint, una validación o un bloque de tests.",
          "Entrega de forma incremental: si algo medible ha mejorado, valídalo antes de complicar en exceso.",
          "Registra fallos recurrentes (status codes, payloads, headers) y conviértelos en tu checklist personal."
        ]
      },
      {
        id: "flujo-estudio",
        heading: "Flujo recomendado de estudio y práctica",
        paragraphs: [
          "Antes de escribir código, dedica unos minutos a leer el challenge con atención y separar requisitos obligatorios de mejoras opcionales.",
          "Al implementar, prioriza el comportamiento observable frente a la perfección interna. Si un endpoint no responde como se espera, una arquitectura limpia por sí sola no pasará los tests funcionales."
        ],
        bullets: [
          "Paso 1: revisa los endpoints requeridos y los códigos HTTP esperados.",
          "Paso 2: arranca una API mínima con health + primer endpoint funcional.",
          "Paso 3: implementa el CRUD principal o el flujo de dominio.",
          "Paso 4: refuerza validaciones y manejo de errores.",
          "Paso 5: optimiza rendimiento y detalles de diseño."
        ],
        visual: {
          type: "flow",
          title: "Mapa visual del flujo de trabajo",
          steps: [
            { label: "Leer challenge", hint: "Endpoints + códigos + restricciones" },
            { label: "Implementar baseline", hint: "Health + routing + JSON" },
            { label: "Completar comportamiento core", hint: "CRUD principal + validaciones" },
            { label: "Verificar contrato HTTP", hint: "Status + payload + errores" },
            { label: "Entregar y medir", hint: "Logs + score + siguiente iteración" }
          ]
        }
      },
      {
        id: "evitar-bloqueos",
        heading: "Cómo evitar bloqueos de principiante",
        paragraphs: [
          "Cuando algo falle, no cambies diez cosas a la vez. Haz cambios pequeños, verifica el impacto y continúa.",
          "Si llevas 25-30 minutos atascado, para y vuelve a un baseline estable. En trabajo de APIs, volver a lo básico suele desbloquear más rápido que forzar un arreglo complejo."
        ],
        bullets: [
          "Registra problema, hipótesis, cambio aplicado y resultado.",
          "Usa checkpoints locales intencionados (p. ej. fix-404-books, validate-input-auth).",
          "Si no puedes explicar un error, redúcelo a un caso mínimo reproducible."
        ]
      }
    ]
  },
  {
    id: "primeros-pasos",
    title: "Primeros pasos",
    summary: "Checklist práctica para preparar tu primer challenge de principio a fin.",
    readTime: "11 min",
    sections: [
      {
        id: "antes-codificar",
        heading: "Antes de codificar: prepara el terreno",
        paragraphs: [
          "Tu primer challenge no empieza con controllers. Empieza con lectura técnica y validación del entorno local.",
          "Define una arquitectura mínima desde el inicio: capas, entidades, validaciones y manejo de errores. Una estructura inicial clara evita deuda accidental."
        ],
        bullets: [
          "Verifica que las versiones de Java y Maven sean compatibles con tu proyecto.",
          "Asegúrate de que el empaquetado produce un JAR ejecutable.",
          "Confirma que el puerto y el contexto de la API no dependan de configuraciones locales exóticas."
        ]
      },
      {
        id: "implementacion-minima",
        heading: "Implementación mínima viable para una primera entrega",
        paragraphs: [
          "No resuelvas todo de golpe. Construye primero un esqueleto estable: routing, serialización JSON, validación básica y respuestas HTTP coherentes.",
          "El objetivo de tu primera entrega no es una nota perfecta. Es demostrar que el pipeline completo funciona con tu base."
        ],
        bullets: [
          "Empieza con los endpoints GET requeridos para validar estructuras de respuesta.",
          "Después añade POST/PUT/DELETE con validación esencial.",
          "Maneja 404, 400 y 500 de forma consistente."
        ]
      },
      {
        id: "primera-entrega",
        heading: "Primera entrega: qué verificar antes de subir el ZIP",
        paragraphs: [
          "La mayoría de fallos en la primera entrega no son de lógica de negocio, sino de empaquetado y estructura del proyecto. La pre-verificación del ZIP es obligatoria.",
          "Asume que los entornos de evaluación son estrictos y no saben nada de tu máquina local."
        ],
        bullets: [
          "El ZIP debe contener `pom.xml` en la raíz, no dentro de carpetas anidadas.",
          "Evita dependencias locales no declaradas.",
          "No subas artefactos innecesarios (salida pesada de target, archivos temporales, credenciales)."
        ]
      }
    ]
  },

  {
    id: "preconfiguracion-proyecto",
    title: "Preconfigurar el proyecto para challenges",
    summary: "Guía técnica completa de requisitos previos, estructura mínima y validación pre-entrega.",
    readTime: "14 min",
    sections: [
      {
        id: "estructura-base",
        heading: "Requisitos de estructura base del proyecto",
        paragraphs: [
          "Para que API Arena compile y ejecute tu entrega, mantén una estructura Maven estándar y predecible. Si el sistema de build no encuentra los archivos esperados, falla antes de ejecutar los tests.",
          "Trata tu proyecto como un paquete portable: cualquier entorno debería descomprimirlo, compilarlo y arrancarlo sin ayuda manual."
        ],
        bullets: [
          "Raíz del ZIP: `pom.xml`, `src/` y archivos de configuración requeridos.",
          "Código principal en `src/main/java`, recursos en `src/main/resources` cuando haga falta.",
          "Sin rutas absolutas ni scripts ligados a tu máquina local."
        ],
        visual: {
          type: "tree",
          title: "Estructura ZIP recomendada",
          lines: [
            "my-challenge-api.zip",
            "├── pom.xml",
            "├── src/",
            "│   ├── main/java/com/yourapp/...",
            "│   └── main/resources/application.properties",
            "└── README.md (optional)"
          ]
        }
      },
      {
        id: "pom-dependencias",
        heading: "Configuración Maven y dependencias",
        paragraphs: [
          "Tu `pom.xml` es el contrato de build del challenge. Dependencias faltantes o plugins mal configurados pueden romper la ejecución en sandbox.",
          "Un POM limpio y explícito reduce la variabilidad y mejora la reproducibilidad."
        ],
        bullets: [
          "Declara versión de Java compatible y plugin de compilación.",
          "Incluye solo dependencias web, de serialización y validación necesarias.",
          "Evita dependencias innecesarias que aumenten el tiempo de build o generen conflictos."
        ]
      },
      {
        id: "arranque-api",
        heading: "Condiciones de arranque de la API",
        paragraphs: [
          "Tu API debe arrancar de forma autónoma y responder en un tiempo razonable. Si el arranque es demasiado lento o falla, los tests no pueden ejecutarse de forma fiable.",
          "Usa valores por defecto seguros para entornos de evaluación y no bloquees el arranque por variables opcionales."
        ],
        bullets: [
          "Proporciona un health endpoint o un endpoint de respuesta mínima.",
          "No requieras servicios externos solo para arrancar.",
          "Maneja fallos de inicialización con logs claros."
        ]
      },
      {
        id: "checklist-envio",
        heading: "Checklist final antes de entregar",
        paragraphs: [
          "Este checklist suele separar una entrega válida de un intento fallido de empaquetado. Ejecútalo siempre, incluso con experiencia.",
          "Si fallas aquí, la nota refleja problemas de entrega, no tu capacidad técnica real."
        ],
        bullets: [
          "Compila en local con `mvn clean package` sin pasos manuales extra.",
          "Valida endpoints requeridos y códigos de status HTTP esperados.",
          "Genera el ZIP final e inspecciona manualmente la estructura interna.",
          "Revisa los logs una vez más y elimina secretos/credenciales."
        ],
        visual: {
          type: "checklist",
          title: "Checklist rápido pre-entrega",
          items: [
            { label: "Build local OK", status: "ok" },
            { label: "pom.xml en raíz del ZIP", status: "ok" },
            { label: "Endpoints requeridos cubiertos", status: "ok" },
            { label: "Códigos HTTP correctos", status: "ok" },
            { label: "Sin secretos en el bundle", status: "warn" }
          ]
        }
      }
    ]
  },
  {
    id: "platform-navigation",
    title: "Navegación de la plataforma",
    summary:
      "Dónde está cada cosa: landing, chrome de la app, Dashboard, Challenges, submissions, Docs y lo básico de la cuenta.",
    readTime: "6 min",
    sections: [
      {
        id: "map",
        heading: "Mapa general",
        paragraphs: [
          "API Arena separa las páginas de marketing (landing) de la app autenticada. Una vez inicias sesión, la misma barra superior te acompaña en todas partes para que la memoria muscular se forme rápido.",
          "Usa Docs como referencia permanente. Los tours guiados solo presentan la UI una vez; Docs sigue disponible para profundizar (layout del ZIP, ELO, troubleshooting)."
        ],
        bullets: [
          "Landing: vista pública, enlaces a Challenges y registro.",
          "Páginas de la app: Dashboard, catálogo de Challenges, Submissions, Friends, Leaderboard, Docs, Replay.",
          "Profile y Alerts están a la derecha de la barra superior cuando has iniciado sesión."
        ]
      },
      {
        id: "chrome",
        heading: "Barra superior (invitado vs autenticado)",
        paragraphs: [
          "Los invitados ven Challenges, Leaderboard, Docs y Replay más Log in. Los usuarios autenticados también ven Dashboard, Submissions, Friends, ELO, Alerts, selector de tema y Profile.",
          "La navegación inferior en pantallas pequeñas refleja los mismos destinos cuando aplica."
        ],
        bullets: [
          "Docs abre el hub de aprendizaje con guías extensas — marca las páginas que reutilizas a menudo.",
          "Replay muestra timelines del pipeline de entregas pasadas cuando están disponibles.",
          "Las cuentas Teacher pueden ver una entrada extra Teacher para flujos de clase."
        ]
      },
      {
        id: "dashboard",
        heading: "Dashboard",
        paragraphs: [
          "El Dashboard es tu inicio tras el login: tarjetas KPI, challenges recientes y accesos directos al catálogo. La barra lateral resume nivel, XP, challenges resueltos y mix de categorías.",
          "Trátalo como plataforma de lanzamiento, no como el único sitio para explorar — el catálogo completo con filtros está en Challenges."
        ],
        bullets: [
          "Abre un challenge desde la tabla o las tarjetas destacadas para leer el briefing público.",
          "Usa Enter Arena o Browse all para saltar al listado completo de challenges cuando quieras filtros."
        ]
      }
    ]
  },
  {
    id: "challenges-catalog",
    title: "Catálogo de Challenges",
    summary: "Cómo buscar, filtrar, ordenar y abrir un challenge antes de iniciar una sesión cronometrada.",
    readTime: "5 min",
    sections: [
      {
        id: "sidebar",
        heading: "Filtros de la barra lateral",
        paragraphs: [
          "La columna izquierda sirve para acotar el listado: búsqueda por texto, dificultad, estado de completado, chips de categoría y un resumen breve de progreso.",
          "Los filtros se combinan — limpia las etiquetas en la parte superior de la columna principal cuando quieras resetear una dimensión."
        ],
        bullets: [
          "Los filtros de dificultad coinciden con la badge de cada tarjeta (easy → expert).",
          "El estado te ayuda a centrarte en challenges sin resolver, en progreso o completados cuando planificas práctica.",
          "El orden solo cambia la secuencia; no oculta challenges salvo que lo combines con filtros."
        ]
      },
      {
        id: "cards",
        heading: "Leer una tarjeta",
        paragraphs: [
          "Cada tarjeta muestra dificultad, categoría, origen (legacy vs community), puntos, fragmento de descripción y estadísticas de la comunidad (intentos, resueltos). Tu mejor nota aparece cuando tienes historial en ese challenge.",
          "Haz clic en la tarjeta para abrir la página de detalle del challenge — el briefing público antes de comprometerte con una sesión cronometrada."
        ],
        bullets: [
          "Las badges Featured destacan selecciones editoriales; siguen siendo challenges normales con las mismas reglas.",
          "Vista grid vs list es solo preferencia — el contenido es idéntico."
        ]
      },
      {
        id: "next",
        heading: "Qué ocurre después",
        paragraphs: [
          "Desde el detalle, Start Challenge comprueba límites y abre el workspace de entrega con el contrato completo, el timer y la subida del ZIP.",
          "Si solo quieres leer, quédate en la página de detalle — no se consume nada hasta que inicias."
        ],
        bullets: [
          "Hace falta iniciar sesión para empezar — los invitados reciben un aviso de login.",
          "Consulta Challenge workspace para la diferencia entre preview y specs completas."
        ]
      }
    ]
  },
  {
    id: "challenge-workspace",
    title: "Workspace del challenge",
    summary: "Detalle del challenge vs pantalla de entrega: qué ves antes y después de iniciar una sesión cronometrada.",
    readTime: "6 min",
    sections: [
      {
        id: "preview",
        heading: "Detalle del challenge (preview)",
        paragraphs: [
          "La página de detalle es el briefing público: título, dificultad, categoría, tiempo, recompensa de XP y descripción. Los contratos HTTP completos, expectativas de tests e hints están restringidos a propósito.",
          "Así el catálogo sigue legible y se protege la integridad competitiva — te comprometes con el timer antes de ver la especificación completa."
        ],
        bullets: [
          "Back vuelve al catálogo; Start Challenge es la acción principal cuando estés listo.",
          "Si los límites te bloquean (tope diario o cooldown), la UI explica la próxima hora elegible en UTC."
        ]
      },
      {
        id: "submit",
        heading: "Workspace de entrega (tras iniciar)",
        paragraphs: [
          "Tras iniciar, la ruta de submit muestra los requisitos completos: endpoints, status codes, tests, criterios de rendimiento y diseño, hints y objetivos de aprendizaje.",
          "Un timer en vivo cuenta atrás para tu sesión. Salir de la página no pausa el reloj — planifica antes de empezar."
        ],
        bullets: [
          "Los límites de fair-play (intentos por día UTC, cooldown) aparecen en la parte superior del workspace.",
          "Los roles staff pueden saltarse límites de estudiante para pruebas operativas — los estudiantes deben asumir que aplican las reglas estándar."
        ]
      },
      {
        id: "pedagogy",
        heading: "Consejos pedagógicos",
        paragraphs: [
          "Si eres nuevo, lee Primeros pasos y Preconfigurar el proyecto en Docs antes de tu primer inicio — evita la mayoría de fallos de empaquetado.",
          "Usa el tour guiado la primera vez que abras el workspace; puedes saltarlo y releer este documento después."
        ],
        bullets: [
          "Trata cada sesión como una entrega única: build, verifica en local y sube un ZIP limpio.",
          "Si se acaba el tiempo, necesitarás una nueva sesión cuando sea elegible — no cuentes con pausar."
        ]
      }
    ]
  },
  {
    id: "submitting-a-challenge",
    title: "Entregar un challenge",
    summary: "Reglas del ZIP, expectativas del pipeline y qué hacer mientras se procesa tu entrega.",
    readTime: "7 min",
    sections: [
      {
        id: "zip",
        heading: "Empaquetado ZIP",
        paragraphs: [
          "Sube un único archivo `.zip`. El build espera un proyecto Maven con `pom.xml` en la raíz del archivo — no anidado dentro de una carpeta extra salvo que el challenge lo permita explícitamente.",
          "Elimina secretos, rutas locales y binarios innecesarios. El sandbox compila desde cero."
        ],
        bullets: [
          "Arrastra y suelta en el panel o haz clic para explorar — solo se acepta `.zip`.",
          "Confirma la estructura en local: descomprime en una carpeta limpia y ejecuta `mvn clean package` antes de subir.",
          "Si reemplazas el archivo, revisa el nombre y el tamaño mostrados en el panel antes de entregar."
        ]
      },
      {
        id: "pipeline",
        heading: "Qué hace el pipeline",
        paragraphs: [
          "Tras la subida, la plataforma compila tu proyecto, ejecuta la API candidata y lanza tests HTTP automatizados contra ella. Las notas combinan señales funcionales, de rendimiento y diseño más un bloque de revisión asistida por IA.",
          "Mantén la pestaña abierta hasta que termine el procesamiento — interrumpir durante la subida o el build inicial puede fallar la sesión y aun así consumir límites."
        ],
        bullets: [
          "Tras el éxito irás a la página de detalle de la entrega — desde ahí abre Results o Replay cuando estén disponibles.",
          "Logs y timelines ayudan a depurar; úsalos antes de reenviar a ciegas."
        ]
      },
      {
        id: "limits",
        heading: "Límites y cooldown",
        paragraphs: [
          "Los estudiantes tienen presupuesto diario de intentos por challenge y cooldown entre entregas. Protegen la calidad del ranking — consulta los contadores en la parte superior del workspace.",
          "Planifica reintentos: lee el fallo, corrige la causa raíz y vuelve a entregar cuando esté permitido."
        ],
        bullets: [
          "UTC es la referencia para los resets diarios — revisa el texto del banner de límites para las horas exactas.",
          "Si estás bloqueado, usa la espera para leer Docs o mejorar tests en local."
        ]
      }
    ]
  },
  {
    id: "errores-comunes",
    title: "Errores comunes",
    summary: "Fallos recurrentes en entregas, por qué ocurren y cómo prevenirlos de forma sistemática.",
    readTime: "10 min",
    sections: [
      {
        id: "errores-build",
        heading: "Errores de build y empaquetado",
        paragraphs: [
          "Los fallos más habituales son estructurales: ZIP mal formado, POM fuera de la raíz, dependencias sin resolver. Una pre-verificación breve evita la mayoría.",
          "No confundas fallos de build con fallos de lógica de negocio. Son categorías distintas y requieren arreglos diferentes."
        ],
        bullets: [
          "POM no encontrado en la raíz del ZIP.",
          "Dependencias faltantes en `pom.xml`.",
          "Configuraciones que solo funcionan en tu máquina."
        ]
      },
      {
        id: "errores-http",
        heading: "Errores de contrato HTTP",
        paragraphs: [
          "Muchos challenges fallan por detalles del contrato: status code incorrecto, payload incompleto o nombres de endpoint inconsistentes.",
          "Los tests del pipeline son estrictos porque simulan consumidores reales: diferencias pequeñas pueden romper la compatibilidad."
        ],
        bullets: [
          "Devolver `200` donde se espera `201` o `204`.",
          "No devolver `404` para recursos inexistentes.",
          "Formato JSON distinto al contrato del challenge."
        ]
      },
      {
        id: "errores-diseno-rendimiento",
        heading: "Errores de diseño y rendimiento",
        paragraphs: [
          "Una API funcional puede perder puntos en diseño/rendimiento si la consistencia, la validación y la latencia son débiles.",
          "No necesitas optimización extrema para una buena nota, pero sí decisiones técnicas sólidas y medibles."
        ],
        bullets: [
          "Validación insuficiente o respuestas de error ambiguas.",
          "Consultas o transformaciones innecesarias en endpoints calientes.",
          "Falta de manejo robusto de excepciones."
        ]
      }
    ]
  },
  {
    id: "sistema-xp-elo",
    title: "Sistema de XP y ELO",
    summary: "Guía completa de clasificación, ganancias/pérdidas de ELO y estrategia de ranking.",
    readTime: "16 min",
    sections: [
      {
        id: "xp",
        heading: "XP: progreso acumulado",
        paragraphs: [
          "XP representa tu progresión global en la plataforma. Crece al completar y mejorar challenges, premiando la constancia y la evolución técnica.",
          "No es solo un contador de intentos: el sistema valora la calidad del resultado y el aprendizaje efectivo."
        ],
        bullets: [
          "Completar challenges desbloquea progresión base.",
          "Mejorar entregas anteriores añade progresión extra.",
          "Entregas spam sin mejora real están limitadas por reglas anti-abuso."
        ]
      },
      {
        id: "elo",
        heading: "ELO: cómo funciona de verdad",
        paragraphs: [
          "ELO compara el rendimiento competitivo esperado frente a los resultados reales. No es un contador de actividad; estima la estabilidad de habilidad y penaliza elecciones competitivas de poco valor.",
          "Cada entrega relevante compara el resultado esperado (según tu estado y el contexto del challenge) con tu resultado real. Superas expectativas y subes; quedas por debajo y bajas."
        ],
        bullets: [
          "No todas las entregas tienen el mismo impacto: importan calidad, consistencia y momento.",
          "Entregas mediocres repetidas pueden erosionar ELO aunque XP siga subiendo.",
          "Subir ELO exige mejora real de nota, no solo volumen de intentos."
        ],
        visual: {
          type: "flow",
          title: "Flujo de cálculo ELO (simplificado)",
          steps: [
            { label: "Calcular expectativa", hint: "Nivel actual + contexto del challenge" },
            { label: "Evaluar resultado real", hint: "Nota técnica + revisión IA" },
            { label: "Comparar delta", hint: "Resultado - expectativa" },
            { label: "Aplicar ajuste", hint: "Delta positivo sube / delta negativo baja" }
          ]
        }
      },
      {
        id: "clasificacion",
        heading: "Cómo clasificarte y entrar en ranking",
        paragraphs: [
          "Para que los rankings sean estadísticamente significativos hace falta una actividad válida mínima. Antes de eso, tu estado puede seguir siendo preliminar.",
          "La clasificación no depende de una sesión brillante. Requiere suficientes resultados para que el sistema estime tu nivel con menos ruido."
        ],
        bullets: [
          "Completa un mínimo de challenges con resultados consistentes para salir del estado inicial.",
          "Evita concentrar toda la actividad en un solo challenge: diversificar reduce ruido.",
          "Construye un historial de entregas con mejora progresiva, no aleatoria."
        ]
      },
      {
        id: "que-suma-elo",
        heading: "Qué suele sumar ELO (y por qué)",
        paragraphs: [
          "Lo que más suma no es entregar más, sino entregar mejor. El sistema premia decisiones técnicas robustas que producen notas altas y repetibles.",
          "La estrategia ganadora combina fiabilidad funcional, diseño limpio y buena latencia."
        ],
        bullets: [
          "Superar tu mejor nota previa en un challenge con una entrega claramente más fuerte.",
          "Reducir errores de contrato HTTP (status/payload) y mejorar la corrección.",
          "Mantener calidad en varios challenges, no solo en uno.",
          "Entregar cuando la mejora está demostrada, no por impulso."
        ]
      },
      {
        id: "que-no-suma-elo",
        heading: "Qué no ayuda (o perjudica) al ELO",
        paragraphs: [
          "Algunas acciones parecen productivas solo por actividad, pero aportan poco valor competitivo. En ELO, la calidad marginal por entrega importa mucho.",
          "Spamear intentos sin cambios sustanciales aumenta el riesgo de delta negativo y daña tu posición relativa aunque XP suba lentamente."
        ],
        bullets: [
          "Reenviar proyectos casi idénticos sin mejoras medibles.",
          "Ignorar cooldown/límites y enviar al momento sin revisar.",
          "Descuidar diseño y errores de API mientras solo buscas compilar.",
          "Optimizar volumen de entregas en lugar de mejora técnica real."
        ],
        visual: {
          type: "checklist",
          title: "Anti-patrones a evitar",
          items: [
            { label: "Entregar sin revisar logs de error previos", status: "warn" },
            { label: "Reintentar sin cambios en endpoints críticos", status: "warn" },
            { label: "Optimizar un área rompiendo otra", status: "warn" },
            { label: "Validar funcional + diseño + rendimiento antes de entregar", status: "ok" }
          ]
        }
      },
      {
        id: "mantener-elo",
        heading: "Cómo mantener y consolidar ELO con el tiempo",
        paragraphs: [
          "Mantener un ELO alto no significa evitar riesgo. Significa gestionar el riesgo técnico con disciplina.",
          "La mejor estrategia a largo plazo: iteraciones pequeñas, calidad constante y timing inteligente de entregas."
        ],
        bullets: [
          "Ejecuta un checklist fijo pre-entrega (build, endpoints, errores, rendimiento).",
          "Cuando te atasques, vuelve a un baseline estable y reconstruye por capas.",
          "No entrenes solo un challenge; alterna para sostener el nivel global.",
          "Prioriza consistencia semanal frente a picos aislados."
        ]
      },
      {
        id: "score-mixto",
        heading: "Nota técnica + revisión IA",
        paragraphs: [
          "La nota final de la entrega combina evaluación técnica y revisión asistida: 800 puntos técnicos + 200 puntos de revisión IA.",
          "Mide tanto el cumplimiento funcional/rendimiento como la calidad de implementación."
        ],
        bullets: [
          "Correctness, performance y design definen el bloque técnico principal.",
          "La revisión IA añade análisis cualitativo y recomendaciones.",
          "Los mejores resultados equilibran fiabilidad técnica y limpieza de implementación."
        ],
        visual: {
          type: "score",
          title: "Distribución de nota para un ELO fuerte",
          items: [
            { label: "Correctness + Performance + Design", value: 800, max: 1000, color: "cyan" },
            { label: "AI Review", value: 200, max: 1000, color: "purple" }
          ]
        }
      }
    ]
  }
];
