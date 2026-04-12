export const DOC_DOCUMENTS = [
  {
    id: "guia-para-empezar",
    title: "Guia para empezar",
    summary: "Mentalidad, estrategia de trabajo y ritmo de entregas para progresar rapido sin quemarte.",
    readTime: "9 min",
    sections: [
      {
        id: "enfoque",
        heading: "Enfoque recomendado para avanzar con consistencia",
        paragraphs: [
          "API Arena no premia solo el resultado final: premia la progresion constante y la capacidad de iterar con criterio tecnico. Si empiezas intentando un challenge complejo sin dominar el flujo completo de build, test y entrega, lo normal es frustrarse pronto.",
          "La estrategia mas efectiva para la mayoria de estudiantes es simple: encadenar varias victorias pequenas en retos EASY y MEDIUM, interiorizar el pipeline, y luego escalar dificultad con una base estable. Esto acelera mucho mas que intentar 'saltos heroicos' con una unica submission gigante."
        ],
        bullets: [
          "Trabaja por objetivos de 20-40 minutos: endpoint concreto, validacion concreta o bloque de tests concreto.",
          "Envio incremental: si ya has mejorado algo medible, considera enviar para validar antes de seguir complicando.",
          "Anota fallos recurrentes (status code, payload, headers) y convirtelos en checklist personal."
        ]
      },
      {
        id: "flujo-estudio",
        heading: "Flujo de estudio y practica recomendado",
        paragraphs: [
          "Antes de tocar codigo, invierte unos minutos en leer bien el enunciado y separar lo obligatorio de lo deseable. Esta distincion evita perder tiempo en extras cuando aun faltan requisitos criticos.",
          "Cuando empieces a implementar, prioriza funcionalidad observable sobre perfeccion interna. Si el endpoint no responde como se espera, da igual lo bonita que sea la arquitectura: no superara pruebas funcionales."
        ],
        bullets: [
          "Paso 1: leer endpoints requeridos y codigos HTTP esperados.",
          "Paso 2: levantar API minima con health + primer endpoint funcional.",
          "Paso 3: completar CRUD o flujo principal.",
          "Paso 4: revisar validaciones y errores.",
          "Paso 5: optimizar rendimiento y detalles de diseno."
        ],
        visual: {
          type: "flow",
          title: "Mapa visual del flujo",
          steps: [
            { label: "Leer challenge", hint: "Endpoints + codigos + restricciones" },
            { label: "Implementar base", hint: "Health + routing + JSON" },
            { label: "Completar funcionalidad", hint: "CRUD principal + validaciones" },
            { label: "Revisar contrato HTTP", hint: "Status + payload + errores" },
            { label: "Enviar y medir", hint: "Logs + score + siguiente iteracion" }
          ]
        }
      },
      {
        id: "evitar-bloqueos",
        heading: "Como evitar bloqueos tipicos de principiantes",
        paragraphs: [
          "Cuando algo falla, no cambies diez cosas a la vez. Haz modificaciones pequenas, comprueba efecto, y sigue. Este enfoque reduce la incertidumbre y te da una trazabilidad clara de por que mejora o empeora tu score.",
          "Si llevas mas de 25-30 minutos atascado en un punto, para y vuelve a una version estable. En APIs, volver a lo basico suele desbloquear mas que insistir en una solucion compleja."
        ],
        bullets: [
          "Registra en un archivo local: problema, hipotesis, cambio aplicado, resultado.",
          "Usa nombres de commit o checkpoints locales con intencion (fix-404-books, validate-input-auth).",
          "Si no entiendes un error, llvalo a un caso minimo reproducible."
        ]
      }
    ]
  },
  {
    id: "primeros-pasos",
    title: "Primeros pasos",
    summary: "Checklist practica para preparar tu primer challenge de principio a fin sin sorpresas.",
    readTime: "11 min",
    sections: [
      {
        id: "antes-codificar",
        heading: "Antes de codificar: preparar el terreno",
        paragraphs: [
          "Tu primer reto no empieza escribiendo controladores: empieza con una lectura tecnica del challenge y una validacion de entorno local. Si tu proyecto no arranca de forma confiable en local, es muy probable que falle en el sandbox.",
          "Define una minima arquitectura antes de arrancar: capas, entidades, validaciones y manejo de errores. Con una estructura inicial clara evitas deuda accidental desde el minuto uno."
        ],
        bullets: [
          "Verifica version de Java y Maven compatibles con tu proyecto.",
          "Comprueba que el empaquetado genera un JAR ejecutable.",
          "Confirma que el puerto y contexto de tu API no dependen de configuraciones locales exoticas."
        ]
      },
      {
        id: "implementacion-minima",
        heading: "Implementacion minima viable para enviar pronto",
        paragraphs: [
          "No intentes resolver todo de golpe. Construye primero una columna vertebral estable: routing, serializacion JSON, validaciones basicas y respuestas HTTP coherentes.",
          "El objetivo de la primera entrega no es score perfecto: es confirmar que el pipeline completo funciona con tu base tecnica."
        ],
        bullets: [
          "Implementa primero los GET requeridos para validar estructura de respuesta.",
          "Despues añade POST/PUT/DELETE con validaciones elementales.",
          "Asegura manejo de 404, 400 y 500 de forma consistente."
        ]
      },
      {
        id: "primera-entrega",
        heading: "Primera entrega: que revisar antes de subir ZIP",
        paragraphs: [
          "La mayor parte de fallos en primeras entregas no son de logica de negocio, sino de formato de proyecto y empaquetado. Por eso la pre-revision del ZIP es un paso obligatorio, no opcional.",
          "Asume que el evaluador es estricto y no conoce tu maquina: todo debe funcionar de forma reproducible y autonoma."
        ],
        bullets: [
          "El archivo ZIP debe tener `pom.xml` en la raiz, no dentro de una carpeta anidada.",
          "Evita dependencias locales no declaradas en Maven.",
          "No subas artefactos innecesarios (target pesado, archivos temporales, credenciales)."
        ]
      }
    ]
  },
  {
    id: "preconfiguracion-proyecto",
    title: "Preconfigurar proyecto para challenge",
    summary: "Guia tecnica completa de prerequisitos, estructura minima y validaciones antes de cualquier envio.",
    readTime: "14 min",
    sections: [
      {
        id: "estructura-base",
        heading: "Estructura base que debe tener tu proyecto",
        paragraphs: [
          "Para que el pipeline de API Arena pueda compilar y ejecutar tu entrega, debes mantener una estructura Maven estandar y predecible. Si el build system no encuentra lo esperado, el proceso falla antes incluso de ejecutar tests.",
          "Piensa en tu proyecto como un paquete portable: cualquier entorno debe poder descomprimir, compilar y arrancar sin asistencia manual."
        ],
        bullets: [
          "Raiz del ZIP: `pom.xml`, carpeta `src/`, y archivos de configuracion necesarios.",
          "Codigo principal en `src/main/java` y, si aplica, recursos en `src/main/resources`.",
          "Sin rutas absolutas ni scripts que dependan de tu sistema local."
        ],
        visual: {
          type: "tree",
          title: "Estructura recomendada del ZIP",
          lines: [
            "my-challenge-api.zip",
            "├── pom.xml",
            "├── src/",
            "│   ├── main/java/com/tuapp/...",
            "│   └── main/resources/application.properties",
            "└── README.md (opcional)"
          ]
        }
      },
      {
        id: "pom-dependencias",
        heading: "Configuracion de Maven y dependencias",
        paragraphs: [
          "Tu `pom.xml` es el contrato de compilacion del challenge. Cualquier dependencia faltante o plugin mal definido puede tumbar la ejecucion en el sandbox.",
          "Mantener el POM limpio y explicito reduce la variabilidad y facilita builds reproducibles."
        ],
        bullets: [
          "Declara version de Java compatible y plugin de compilacion.",
          "Incluye starter web y dependencias de serializacion/validacion que realmente uses.",
          "Evita dependencias innecesarias que inflen build time o introduzcan conflictos."
        ]
      },
      {
        id: "arranque-api",
        heading: "Condiciones de arranque de la API",
        paragraphs: [
          "Tu API debe arrancar de forma autonoma y responder en un tiempo razonable. Si tarda demasiado o falla en el bootstrap, los tests no llegaran a ejecutarse correctamente.",
          "Configura valores por defecto seguros para entorno de evaluacion y evita bloquear inicio por variables opcionales."
        ],
        bullets: [
          "Asegura que existe un endpoint de salud o respuesta minima.",
          "No dependas de servicios externos obligatorios para arrancar.",
          "Controla errores de inicializacion con logs claros."
        ]
      },
      {
        id: "checklist-envio",
        heading: "Checklist final antes de enviar",
        paragraphs: [
          "Esta checklist es la diferencia entre una entrega evaluable y una entrega fallida por detalles de packaging. Recorrela siempre, aunque tengas experiencia.",
          "Si fallas aqui, el score no reflejara tu capacidad tecnica real, sino un problema de entrega."
        ],
        bullets: [
          "Compila en local con `mvn clean package` sin pasos manuales adicionales.",
          "Valida endpoints requeridos y codigos HTTP del challenge.",
          "Genera ZIP final y verifica manualmente su estructura interna.",
          "Haz una ultima lectura de logs y elimina secretos/credenciales."
        ],
        visual: {
          type: "checklist",
          title: "Checklist rapida pre-envio",
          items: [
            { label: "Build local OK", status: "ok" },
            { label: "pom.xml en raiz del ZIP", status: "ok" },
            { label: "Endpoints requeridos cubiertos", status: "ok" },
            { label: "Codigos HTTP correctos", status: "ok" },
            { label: "Sin secretos en el bundle", status: "warn" }
          ]
        }
      }
    ]
  },
  {
    id: "errores-comunes",
    title: "Errores comunes",
    summary: "Fallos recurrentes en submissions, por que ocurren y como prevenirlos de forma sistematica.",
    readTime: "10 min",
    sections: [
      {
        id: "errores-build",
        heading: "Errores de build y empaquetado",
        paragraphs: [
          "El error mas comun es estructural: ZIP mal generado, POM fuera de raiz o dependencias no resueltas. Estos problemas son evitables con una revision previa de 2 minutos.",
          "No confundas un fallo de build con un fallo de logica. Son categorias distintas y requieren estrategias distintas."
        ],
        bullets: [
          "POM no localizado en raiz del ZIP.",
          "Dependencias no declaradas en `pom.xml`.",
          "Configuraciones que solo funcionan en tu maquina."
        ]
      },
      {
        id: "errores-http",
        heading: "Errores de contrato HTTP",
        paragraphs: [
          "Muchos challenges fallan por detalles de contrato: status code incorrecto, payload incompleto o naming inconsistente de endpoints.",
          "Los tests del pipeline son estrictos porque simulan consumidores reales: pequeñas diferencias pueden implicar incompatibilidad."
        ],
        bullets: [
          "Responder `200` donde se esperaba `201` o `204`.",
          "No devolver `404` en recursos inexistentes.",
          "Formato JSON distinto al esperado por el challenge."
        ]
      },
      {
        id: "errores-diseno-rendimiento",
        heading: "Errores de diseno y rendimiento",
        paragraphs: [
          "Una API funcional puede perder muchos puntos en design/performance si no cuida consistencia, validaciones y latencia.",
          "No necesitas una optimizacion extrema para buena nota, pero si decisiones tecnicas solidas y medibles."
        ],
        bullets: [
          "Validaciones insuficientes o respuestas de error ambiguas.",
          "Consultas o transformaciones innecesarias en endpoints calientes.",
          "Ausencia de manejo robusto de excepciones."
        ]
      }
    ]
  },
  {
    id: "sistema-xp-elo",
    title: "Sistema de XP y ELO",
    summary: "Como se calcula tu progreso, que afecta a tu ranking y como tomar decisiones inteligentes de mejora.",
    readTime: "8 min",
    sections: [
      {
        id: "xp",
        heading: "XP: progreso acumulativo",
        paragraphs: [
          "La XP representa tu avance general en la plataforma. Se incrementa al completar y mejorar retos, premiando la constancia y la evolucion tecnica.",
          "No es solo un contador de intentos: el sistema valora calidad de resultado y aprendizaje efectivo."
        ],
        bullets: [
          "Completar retos desbloquea progresion base.",
          "Mejorar submissions anteriores puede aportar progreso adicional.",
          "El farm de envios sin mejora real se limita con reglas de anti-abuso."
        ]
      },
      {
        id: "elo",
        heading: "ELO: rendimiento competitivo",
        paragraphs: [
          "El ELO refleja tu rendimiento relativo dentro del ecosistema. Es una metrica de nivel competitivo, no de volumen de actividad.",
          "Puedes subir o bajar ELO segun la calidad de tus resultados en contexto, por eso conviene enviar cuando realmente has mejorado."
        ],
        bullets: [
          "No todos los envios impactan igual.",
          "El rendimiento sostenido importa mas que picos aislados.",
          "Reintentar con mejoras concretas suele ser mejor que enviar por impulso."
        ]
      },
      {
        id: "score-mixto",
        heading: "Score tecnico + AI review",
        paragraphs: [
          "La puntuacion final de submission combina evaluacion tecnica y revision asistida: 800 puntos tecnicos + 200 puntos de AI review.",
          "Esto permite medir tanto cumplimiento funcional/rendimiento como calidad global de estructura y mantenibilidad."
        ],
        bullets: [
          "Correctness, performance y design definen bloque tecnico principal.",
          "AI review aporta analisis cualitativo con recomendaciones.",
          "El mejor resultado llega al equilibrar fiabilidad tecnica y limpieza de implementacion."
        ],
        visual: {
          type: "score",
          title: "Distribucion visual de la puntuacion",
          items: [
            { label: "Correctness + Performance + Design", value: 800, max: 1000, color: "cyan" },
            { label: "AI Review", value: 200, max: 1000, color: "purple" }
          ]
        }
      }
    ]
  }
];

export const DOC_BY_ID = DOC_DOCUMENTS.reduce((acc, doc) => {
  acc[doc.id] = doc;
  return acc;
}, {});
