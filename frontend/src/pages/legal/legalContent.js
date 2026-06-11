/*
 * Legal texts for API Arena (RGPD / LOPDGDD / LSSI-CE).
 *
 * IMPORTANT: fill the CONTROLLER data below with the real details of the data
 * controller (responsable del tratamiento). These placeholders appear across all
 * legal documents. The texts are a solid baseline but should be reviewed by a
 * lawyer before going to production.
 */

export const CONTROLLER = {
  name: "Eduardo Serrano Trenado",
  // NIF kept for internal records (RAT) only; not published on public legal pages,
  // as the LSSI does not require an individual to publish their DNI.
  nif: "47317646E",
  address: "Paseo de Rinconete y Cortadillo, nº 3, portal 3, 1ºA, 28906 Getafe (Madrid, España)",
  email: "privacy@apiarena.net",
  legalEmail: "legal@apiarena.net",
  site: "https://apiarena.net",
  context:
    "Proyecto Fin de Grado (TFG) de un Ciclo Formativo de Grado Superior. Titularidad y autoría: Eduardo Serrano Trenado.",
  lastUpdated: "11 de junio de 2026",
  consentVersion: "1.0",
};

const C = CONTROLLER;

export const LEGAL_DOCS = {
  "aviso-legal": {
    slug: "aviso-legal",
    title: "Aviso Legal",
    intro:
      "Información general exigida por la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).",
    sections: [
      {
        heading: "1. Titular del sitio web",
        body: [
          `En cumplimiento del artículo 10 de la LSSI-CE, se informa de que el titular de ${C.site} (en adelante, "API Arena" o "la Plataforma") es:`,
          {
            list: [
              `Responsable: ${C.name}`,
              `Domicilio: ${C.address}`,
              `Correo de contacto: ${C.legalEmail}`,
              `Contexto: ${C.context}`,
            ],
          },
        ],
      },
      {
        heading: "2. Objeto",
        body: [
          "API Arena es una plataforma educativa y competitiva en la que personas desarrolladoras y estudiantes envían APIs (proyectos de software) que se compilan y prueban automáticamente, obteniendo puntuaciones, rankings y retroalimentación.",
          "El acceso a la Plataforma atribuye la condición de usuario e implica la aceptación de este Aviso Legal, de la Política de Privacidad, de la Política de Cookies y de los Términos de Uso.",
        ],
      },
      {
        heading: "3. Condiciones de uso",
        body: [
          "El usuario se compromete a hacer un uso lícito de la Plataforma, conforme a la ley, la buena fe y el orden público, y a no utilizarla con fines ilícitos o lesivos para terceros.",
        ],
      },
      {
        heading: "4. Propiedad intelectual e industrial",
        body: [
          "Los contenidos, marca, diseño, código y elementos de la Plataforma pertenecen a su titular o a terceros que han autorizado su uso. El contenido enviado por los usuarios (proyectos/código) sigue siendo de su autor, que concede a la Plataforma una licencia limitada para procesarlo y evaluarlo conforme a los Términos de Uso.",
        ],
      },
      {
        heading: "5. Responsabilidad",
        body: [
          "La Plataforma se ofrece tal cual, con fines educativos. El titular no garantiza la disponibilidad ininterrumpida del servicio ni se responsabiliza de los daños derivados de un uso indebido por parte del usuario.",
        ],
      },
      {
        heading: "6. Legislación aplicable y jurisdicción",
        body: [
          "Las presentes condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa aplicable.",
        ],
      },
    ],
  },

  privacidad: {
    slug: "privacidad",
    title: "Política de Privacidad",
    intro:
      "Información sobre el tratamiento de datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).",
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        body: [
          {
            list: [
              `Responsable: ${C.name}`,
              `Domicilio: ${C.address}`,
              `Correo para el ejercicio de derechos: ${C.email}`,
            ],
          },
        ],
      },
      {
        heading: "2. Datos que tratamos",
        body: [
          "Según tu uso de la Plataforma, podemos tratar:",
          {
            list: [
              "Datos de cuenta: nombre de usuario, correo electrónico, contraseña (almacenada de forma segura mediante hash, nunca en claro), fecha de nacimiento (para verificar la edad mínima), rol (estudiante/profesor).",
              "Datos de perfil: biografía, usuario de GitHub, avatar (URL), si los aportas.",
              "Datos de actividad y rendimiento: puntuaciones, XP, ELO, retos completados, tiempo de desarrollo y de navegación, marcas temporales de actividad.",
              "Contenido enviado: proyectos/código (ficheros ZIP), logs de compilación y de pruebas, y resultados asociados.",
              "Datos relacionales: amistades y pertenencia a grupos de clase creados por profesores.",
              "Datos técnicos mínimos necesarios para prestar el servicio y mantener la sesión.",
            ],
          },
        ],
      },
      {
        heading: "3. Finalidades y bases jurídicas",
        body: [
          {
            list: [
              "Crear y gestionar tu cuenta y prestar el servicio (base: ejecución del contrato / términos de uso).",
              "Verificar tu correo electrónico y tu edad mínima (base: obligación legal y ejecución del contrato).",
              "Compilar, ejecutar y evaluar tus envíos y mostrar puntuaciones y rankings (base: ejecución del contrato).",
              "Enviarte correos transaccionales imprescindibles (verificación, bienvenida, avisos del servicio) (base: ejecución del contrato).",
              "Enviarte avisos opcionales de nuevos retos por email, solo si los activas (base: consentimiento, revocable en cualquier momento).",
              "Mantener la seguridad, prevenir abusos y elaborar estadísticas internas agregadas (base: interés legítimo).",
            ],
          },
        ],
      },
      {
        heading: "4. Plazos de conservación",
        body: [
          {
            list: [
              "Datos de cuenta: mientras la cuenta esté activa; se eliminan o anonimizan tras la baja, salvo obligación legal de conservación.",
              "Ficheros ZIP de envíos: durante el periodo de disponibilidad definido (por defecto 90 días) y después se eliminan.",
              "Datos de replay/diagnóstico: se eliminan transcurrido el periodo de retención (por defecto 30 días).",
              "Tokens de verificación y sesión: caducan automáticamente (verificación 48 h; sesión según configuración).",
            ],
          },
        ],
      },
      {
        heading: "5. Destinatarios y encargados del tratamiento",
        body: [
          "No vendemos tus datos. La aplicación y las bases de datos se ejecutan en infraestructura propia (alojamiento on-premise), por lo que no intervienen proveedores de hosting externos. Para funcionalidades concretas recurrimos a estos encargados del tratamiento:",
          {
            list: [
              "Resend (envío de correos electrónicos transaccionales).",
              "Google (Gemini) para análisis automático opcional de envíos, cuando esta función esté activada; se le envían registros técnicos del envío, no tu identidad directamente.",
            ],
          },
          "Tu perfil público (nombre de usuario, biografía, GitHub y estadísticas) puede ser visible para otros usuarios. Tu correo electrónico puede ser visible para el profesorado de los grupos a los que pertenezcas y en la búsqueda de amistades.",
        ],
      },
      {
        heading: "6. Transferencias internacionales",
        body: [
            "El envío de correos se realiza a través de Resend, cuyo tratamiento puede implicar la transferencia de datos a Estados Unidos. Dicha transferencia se ampara en las garantías previstas por el RGPD (Cláusulas Contractuales Tipo y/o el marco de adecuación vigente). Si se activa el análisis por IA con un proveedor externo (Google Gemini), aplicarían garantías equivalentes. Las tipografías se sirven desde nuestros propios servidores para evitar transferencias innecesarias.",
        ],
      },
      {
        heading: "7. Tus derechos",
        body: [
          "Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar tu consentimiento en cualquier momento.",
          `Para ejercerlos, escribe a ${C.email}. Desde tu perfil también puedes exportar tus datos y eliminar tu cuenta.`,
          "Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).",
        ],
      },
      {
        heading: "8. Menores de edad",
        body: [
          "La Plataforma está dirigida a personas mayores de 14 años. No se permite el registro de menores de 14 años. Si detectamos una cuenta de un menor de 14 años, procederemos a su eliminación.",
        ],
      },
      {
        heading: "9. Seguridad",
        body: [
          "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo el cifrado de contraseñas y el aislamiento del entorno de ejecución de los envíos.",
        ],
      },
      {
        heading: "10. Decisiones automatizadas",
        body: [
          "La compilación, ejecución y puntuación de tus envíos (incluida la valoración técnica y, si está activada, la revisión por IA) se realizan de forma automatizada con una finalidad educativa y de competición. Estas evaluaciones no producen efectos jurídicos sobre ti ni te afectan significativamente de modo similar, por lo que no constituyen decisiones automatizadas en el sentido del artículo 22 del RGPD. En todo caso, puedes contactar con nosotros si tienes dudas sobre una puntuación.",
        ],
      },
      {
        heading: "11. Cambios en esta política",
        body: [
          `Podemos actualizar esta política. La versión vigente del consentimiento es la ${C.consentVersion}. Última actualización: ${C.lastUpdated}.`,
        ],
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: "Política de Cookies",
    intro:
      "Información sobre cookies y almacenamiento local conforme al artículo 22.2 de la LSSI-CE.",
    sections: [
      {
        heading: "1. ¿Qué tecnologías usamos?",
        body: [
          "API Arena no utiliza cookies de seguimiento ni de publicidad, ni herramientas de analítica de terceros. Tampoco cargamos recursos externos que rastreen tu navegación (las tipografías se sirven desde nuestros propios servidores).",
          "Para funcionar, la Plataforma utiliza almacenamiento local del navegador (localStorage/sessionStorage), no cookies de terceros.",
        ],
      },
      {
        heading: "2. Almacenamiento técnico necesario",
        body: [
          "Estos datos son imprescindibles para que el servicio funcione y no requieren consentimiento:",
          {
            list: [
              "Sesión de autenticación (mantener tu sesión iniciada).",
              "Sesión de reto en curso y temporizador (para que el cronómetro siga al cambiar de pestaña).",
              "Control técnico para no duplicar el cómputo de tiempo entre pestañas.",
            ],
          },
        ],
      },
      {
        heading: "3. Almacenamiento de preferencias",
        body: [
          "Estos datos mejoran tu experiencia y se gestionan según tus preferencias de consentimiento:",
          {
            list: [
              "Preferencia de tema (claro/oscuro).",
              "Estado de los tutoriales/onboarding ya vistos.",
            ],
          },
        ],
      },
      {
        heading: "4. Cómo gestionarlo",
        body: [
          "Puedes borrar el almacenamiento local desde la configuración de tu navegador en cualquier momento. También puedes revisar tus preferencias desde el aviso de consentimiento de la Plataforma.",
        ],
      },
    ],
  },

  terminos: {
    slug: "terminos",
    title: "Términos de Uso",
    intro: "Condiciones que rigen el uso de API Arena.",
    sections: [
      {
        heading: "1. Aceptación",
        body: [
          "El uso de la Plataforma implica la aceptación de estos Términos, del Aviso Legal y de la Política de Privacidad. Si no estás de acuerdo, no debes utilizar la Plataforma.",
        ],
      },
      {
        heading: "2. Cuenta y edad mínima",
        body: [
          "Debes tener al menos 14 años para registrarte y facilitar información veraz. Eres responsable de la confidencialidad de tus credenciales y de la actividad realizada con tu cuenta.",
        ],
      },
      {
        heading: "3. Uso aceptable",
        body: [
          "No está permitido: vulnerar la seguridad de la Plataforma, intentar evadir el aislamiento del entorno de ejecución, subir contenido malicioso, suplantar a terceros o infringir derechos de propiedad intelectual.",
        ],
      },
      {
        heading: "4. Contenido enviado por el usuario",
        body: [
          "Eres responsable del contenido (proyectos/código) que envías y de que no incluya datos personales de terceros ni material ilícito. Concedes a la Plataforma una licencia limitada para almacenar, compilar, ejecutar y evaluar tus envíos con el fin de prestar el servicio.",
        ],
      },
      {
        heading: "5. Disponibilidad y responsabilidad",
        body: [
          "La Plataforma se ofrece con fines educativos, sin garantía de disponibilidad continua. En la medida permitida por la ley, el titular no será responsable de daños indirectos derivados del uso del servicio.",
        ],
      },
      {
        heading: "6. Baja y eliminación de cuenta",
        body: [
          "Puedes dar de baja tu cuenta en cualquier momento desde tu perfil. Esto eliminará tus datos personales asociados, salvo los que debamos conservar por obligación legal.",
        ],
      },
      {
        heading: "7. Ley aplicable",
        body: [
          `Estos Términos se rigen por la legislación española. Última actualización: ${C.lastUpdated}.`,
        ],
      },
    ],
  },
};

export const LEGAL_NAV = [
  { slug: "aviso-legal", label: "Aviso Legal" },
  { slug: "privacidad", label: "Privacidad" },
  { slug: "cookies", label: "Cookies" },
  { slug: "terminos", label: "Términos" },
];
