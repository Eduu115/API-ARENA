/** Docs hub chrome strings (not document body copy). */

export const DOCS_UI = {
  en: {
    learningCenter: '// Learning Center',
    arenaDocs: 'ArenaDocs',
    backToChallenges: 'BACK TO CHALLENGES',
    home: 'Home',
    docs: 'Docs',
    documents: 'Documents',
    helpfulSection: 'Was this section helpful?',
    wellExplained: 'Well explained',
    needsImprovement: 'Needs improvement',
    helpfulDoc: 'Was the full document helpful?',
    yesUseful: 'Yes, very useful',
    couldImprove: 'Could be improved',
    nextDocument: 'Next document',
    endOfTrack: 'End of this learning track',
    backToGettingStarted: 'Back to Getting Started',
    goToChallenges: 'Go to Challenges',
    globalFeedback: 'Global docs feedback',
    totalVotes: 'Total votes:',
    helpfulVotes: 'Helpful votes:',
    usefulnessRate: 'Usefulness rate:',
    noFeedback: 'No feedback data yet.',
    faq: [
      {
        q: 'What should I read first?',
        a: 'Start with Getting Started, then First Steps, then Preconfigure Project, before you open a hard challenge.',
      },
      {
        q: 'When do I see the full challenge specification?',
        a: 'The public challenge page is a preview. Endpoints and hidden tests are shown on the submit screen after you sign in and start a timed run.',
      },
      {
        q: 'What does a submission have to contain?',
        a: 'A ZIP of a Maven Spring Boot project with pom.xml at the archive root. The sandbox builds that project and the testing service calls the running API over HTTP.',
      },
    ],
    nextCta: {
      gettingStartedToFirstSteps: 'Go to First Steps',
      firstStepsToPreconfig: 'Continue to Preconfigure Project',
      nextPrefix: 'Next:',
    },
  },
  es: {
    learningCenter: '// Centro de aprendizaje',
    arenaDocs: 'ArenaDocs',
    backToChallenges: 'VOLVER A CHALLENGES',
    home: 'Inicio',
    docs: 'Docs',
    documents: 'Documentos',
    helpfulSection: '¿Te ha sido útil esta sección?',
    wellExplained: 'Bien explicada',
    needsImprovement: 'Mejorable',
    helpfulDoc: '¿Te ha sido útil el documento completo?',
    yesUseful: 'Sí, muy útil',
    couldImprove: 'Se puede mejorar',
    nextDocument: 'Siguiente documento',
    endOfTrack: 'Fin de esta ruta de aprendizaje',
    backToGettingStarted: 'Volver a Guía para empezar',
    goToChallenges: 'Ir a Challenges',
    globalFeedback: 'Feedback global de docs',
    totalVotes: 'Votos totales:',
    helpfulVotes: 'Votos útiles:',
    usefulnessRate: 'Tasa de utilidad:',
    noFeedback: 'Aún no hay datos de feedback.',
    faq: [
      {
        q: '¿Qué leo primero?',
        a: 'Empieza por Guía para empezar, sigue con Primeros pasos y luego Preconfigurar el proyecto, antes de abrir un challenge difícil.',
      },
      {
        q: '¿Cuándo veo la especificación completa del challenge?',
        a: 'La página pública del challenge es una vista previa. Los endpoints y los tests ocultos se muestran en la pantalla de entrega después de iniciar sesión y empezar una sesión cronometrada.',
      },
      {
        q: '¿Qué tiene que contener una entrega?',
        a: 'Un ZIP de un proyecto Maven Spring Boot con pom.xml en la raíz del archivo. El sandbox compila ese proyecto y el servicio de tests llama a la API en ejecución por HTTP.',
      },
    ],
    nextCta: {
      gettingStartedToFirstSteps: 'Ir a Primeros pasos',
      firstStepsToPreconfig: 'Continuar a Preconfigurar proyecto',
      nextPrefix: 'Siguiente:',
    },
  },
};

export function getDocsUi(locale) {
  return DOCS_UI[locale === 'es' ? 'es' : 'en'];
}

export function getNextDocCtaLabel(currentDoc, nextDoc, locale) {
  const ui = getDocsUi(locale);
  if (currentDoc?.id === 'guia-para-empezar' && nextDoc?.id === 'primeros-pasos') {
    return ui.nextCta.gettingStartedToFirstSteps;
  }
  if (currentDoc?.id === 'primeros-pasos' && nextDoc?.id === 'preconfiguracion-proyecto') {
    return ui.nextCta.firstStepsToPreconfig;
  }
  return `${ui.nextCta.nextPrefix} ${nextDoc.title}`;
}
