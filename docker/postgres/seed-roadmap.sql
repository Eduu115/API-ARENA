-- Maintainer roadmap copy, both languages. machine_translated = false.
-- Do not call DeepL for this seed. Idempotent: every insert is ON CONFLICT DO NOTHING.
-- Natural keys: roadmap_phases.slug, roadmap_items (phase_id, slug),
-- translations (phase_id, locale) and (item_id, locale).
-- Foreign keys are resolved with slug subqueries. No hardcoded ids.
--
-- Do NOT apply until content-service is deployed. Back up the database first.
-- Run the script twice and confirm the row counts stay equal.
-- Code first, data after.

BEGIN;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('foundations', 1, 'DONE', 'Jan–Feb 2026', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Foundations', 'Microservice architecture, secure accounts and the first challenge catalog.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'foundations'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Cimientos', 'Arquitectura de microservicios, cuentas seguras y el primer catálogo de challenges.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'foundations'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'microservices', 1, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'foundations'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Microservice platform (auth, challenges, submissions) on Docker', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'foundations' AND i.slug = 'microservices'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Plataforma de microservicios (auth, challenges, entregas) sobre Docker', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'foundations' AND i.slug = 'microservices'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'auth-jwt', 2, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'foundations'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Accounts with JWT login and refresh', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'foundations' AND i.slug = 'auth-jwt'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Cuentas con login JWT y refresh', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'foundations' AND i.slug = 'auth-jwt'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'challenge-catalog', 3, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'foundations'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Challenge catalog with categories and difficulty tiers', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'foundations' AND i.slug = 'challenge-catalog'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Catálogo de challenges con categorías y niveles de dificultad', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'foundations' AND i.slug = 'challenge-catalog'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('the-arena', 2, 'DONE', 'Apr 2026', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'The Arena', 'Real evaluation of your APIs, end to end.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'La Arena', 'Evaluación real de tus APIs, de principio a fin.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'sandbox-pipeline', 1, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Sandboxed build and run of your Spring Boot ZIP', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'sandbox-pipeline'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Compilación y ejecución aislada de tu ZIP Spring Boot', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'sandbox-pipeline'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'http-testing', 2, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Black-box HTTP tests: functional, performance and design', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'http-testing'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Tests HTTP de caja negra: funcionales, rendimiento y diseño', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'http-testing'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'ai-review', 3, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'AI code review (800 technical + 200 AI score)', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'ai-review'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Revisión con IA (800 técnico + 200 IA)', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'ai-review'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'timed-submissions', 4, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Timed submissions, attempt limits and cooldowns', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'timed-submissions'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Entregas cronometradas, límite de intentos y cooldowns', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'timed-submissions'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'notifications', 5, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'the-arena'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Real-time notifications and email verification', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'notifications'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Notificaciones en tiempo real y verificación de email', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'the-arena' AND i.slug = 'notifications'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('competition', 3, 'DONE', 'Apr–Jun 2026', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Competition', 'Leaderboards, rankings and ELO.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Competición', 'Leaderboards, rankings y ELO.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'xp-elo', 1, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'XP levels and ELO rating per submission', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'xp-elo'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Niveles de XP y rating ELO por entrega', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'xp-elo'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'leaderboards', 2, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Global, ELO, Level and per-challenge leaderboards', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'leaderboards'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Leaderboards global, ELO, nivel y por challenge', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'leaderboards'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'rank-badges', 3, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Global rank badges (TOP 25) on profiles', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'rank-badges'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Insignias de ranking global (TOP 25) en perfiles', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'rank-badges'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'extreme-tier', 4, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'EXTREME difficulty tier with expert-level challenges', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'extreme-tier'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Dificultad EXTREME con challenges de nivel experto', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'extreme-tier'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'replay', 5, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'competition'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Submission replay timeline', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'replay'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Replay de la entrega en timeline', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'competition' AND i.slug = 'replay'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('community', 4, 'DONE', 'Jun 2026', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Community & progression', 'Friends, profiles and rewards for consistency.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Comunidad y progresión', 'Amigos, perfiles y recompensas por constancia.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'friends', 1, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Friends and public profiles', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'friends'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Amistades y perfiles públicos', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'friends'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'achievements', 2, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Achievements and collectible badges', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'achievements'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Logros e insignias coleccionables', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'achievements'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'weekly-streak', 3, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Weekly streaks', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'weekly-streak'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Rachas semanales', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'weekly-streak'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'i18n', 4, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Full English / Spanish experience', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'i18n'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Experiencia completa en inglés y español', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'i18n'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'docs-hub', 5, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'community'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Learning docs hub and guided tours', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'docs-hub'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Centro de documentación y tours guiados', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'community' AND i.slug = 'docs-hub'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('teachers', 5, 'DONE', 'Apr–Jun 2026', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'For teachers', 'Run your classes inside API Arena.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'teachers'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Para profesores', 'Lleva tus clases dentro de API Arena.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'teachers'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'teacher-challenges', 1, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'teachers'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Teacher-authored challenges', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'teacher-challenges'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Challenges creados por el profesor', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'teacher-challenges'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'groups', 2, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'teachers'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Student groups with co-teachers', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'groups'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Grupos de alumnos con co-profesor', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'groups'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'corrections', 3, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'teachers'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Corrections queue, penalties, manual grading and reviews', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'corrections'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Cola de correcciones, penalizaciones, nota manual y revisiones', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'corrections'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'zip-download', 4, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'teachers'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Download students'' submitted projects', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'zip-download'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Descarga de los proyectos entregados por los alumnos', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'teachers' AND i.slug = 'zip-download'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('trust-safety', 6, 'DONE', 'Jul–Aug 2026', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Trust & safety', 'A secure, privacy-first platform.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'trust-safety'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Seguridad y confianza', 'Una plataforma segura y respetuosa con tu privacidad.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'trust-safety'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'two-factor', 1, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'trust-safety'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Two-factor authentication', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'two-factor'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Autenticación en dos pasos', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'two-factor'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'admin-console', 2, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'trust-safety'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Admin console with role-based capabilities and moderation', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'admin-console'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Consola de administración con capacidades por rol y moderación', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'admin-console'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'gdpr', 3, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'trust-safety'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'GDPR data export and account deletion', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'gdpr'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Exportación de datos y borrado de cuenta (RGPD)', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'gdpr'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'bot-protection', 4, 'DONE'
FROM roadmap_phases p
WHERE p.slug = 'trust-safety'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Bot protection and rate limiting', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'bot-protection'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Protección anti-bots y limitación de peticiones', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'trust-safety' AND i.slug = 'bot-protection'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('present-python', 7, 'IN_PROGRESS', 'Now', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Present — Python (FastAPI)', 'Compete with Python: submit FastAPI projects to the arena.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'present-python'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Presente — Python (FastAPI)', 'Compite con Python: envía proyectos FastAPI a la arena.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'present-python'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'python-runtime', 1, 'IN_PROGRESS'
FROM roadmap_phases p
WHERE p.slug = 'present-python'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Python runtime in the sandbox', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'present-python' AND i.slug = 'python-runtime'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Runtime de Python en el sandbox', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'present-python' AND i.slug = 'python-runtime'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'fastapi-challenges', 2, 'IN_PROGRESS'
FROM roadmap_phases p
WHERE p.slug = 'present-python'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'FastAPI-ready challenges and starter templates', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'present-python' AND i.slug = 'fastapi-challenges'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Challenges y plantillas preparadas para FastAPI', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'present-python' AND i.slug = 'fastapi-challenges'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('multiplayer', 8, 'PLANNED', 'Next', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Multiplayer', 'Real-time 1v1 duels: same challenge, same clock, best score wins.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'multiplayer'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Multijugador', 'Duelos 1v1 en tiempo real: mismo challenge, mismo reloj, gana la mejor nota.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'multiplayer'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'duels', 1, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'multiplayer'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', '1v1 real-time duels', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'multiplayer' AND i.slug = 'duels'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Duelos 1v1 en tiempo real', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'multiplayer' AND i.slug = 'duels'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'rooms', 2, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'multiplayer'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Rooms and matchmaking', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'multiplayer' AND i.slug = 'rooms'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Salas y emparejamiento', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'multiplayer' AND i.slug = 'rooms'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('academy', 9, 'PLANNED', 'Later', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Academy', 'Structured learning paths from zero to production-ready APIs.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'academy'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Academy', 'Rutas de aprendizaje estructuradas, de cero a APIs listas para producción.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'academy'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'learning-paths', 1, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'academy'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Guided learning paths and lessons', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'academy' AND i.slug = 'learning-paths'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Rutas guiadas y lecciones', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'academy' AND i.slug = 'learning-paths'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'path-progress', 2, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'academy'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Progress tracking per path', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'academy' AND i.slug = 'path-progress'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Seguimiento del progreso por ruta', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'academy' AND i.slug = 'path-progress'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('new-technologies', 10, 'PLANNED', 'Later', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'New technologies', 'More stacks supported in the arena.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'new-technologies'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Nuevas tecnologías', 'Más stacks soportados en la arena.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'new-technologies'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'nodejs', 1, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'new-technologies'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Node.js support', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'new-technologies' AND i.slug = 'nodejs'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Soporte para Node.js', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'new-technologies' AND i.slug = 'nodejs'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('mobile-app', 11, 'PLANNED', 'Later', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'Mobile app', 'Your stats, social feed and notifications in your pocket.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'mobile-app'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'App móvil', 'Tus estadísticas, el feed social y las notificaciones en el bolsillo.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'mobile-app'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'mobile-stats', 1, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'mobile-app'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Stats and progress', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'mobile-app' AND i.slug = 'mobile-stats'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Estadísticas y progreso', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'mobile-app' AND i.slug = 'mobile-stats'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'mobile-social', 2, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'mobile-app'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Social feed and reactions', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'mobile-app' AND i.slug = 'mobile-social'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Feed social y reacciones', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'mobile-app' AND i.slug = 'mobile-social'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'mobile-notifications', 3, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'mobile-app'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Push notifications', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'mobile-app' AND i.slug = 'mobile-notifications'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Notificaciones push', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'mobile-app' AND i.slug = 'mobile-notifications'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_phases (slug, position, status, target_label, created_at, updated_at)
VALUES ('linkedin', 12, 'PLANNED', 'Later', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'en', 'LinkedIn integration', 'Show your API Arena achievements on your professional profile.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'linkedin'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_phase_translations (phase_id, locale, title, summary, machine_translated)
SELECT p.id, 'es', 'Integración con LinkedIn', 'Muestra tus logros de API Arena en tu perfil profesional.', FALSE
FROM roadmap_phases p
WHERE p.slug = 'linkedin'
ON CONFLICT (phase_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'linkedin-link', 1, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'linkedin'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Link your LinkedIn to your API Arena profile', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'linkedin' AND i.slug = 'linkedin-link'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Vincula tu LinkedIn a tu perfil de API Arena', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'linkedin' AND i.slug = 'linkedin-link'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_items (phase_id, slug, position, status)
SELECT p.id, 'linkedin-share', 2, 'PLANNED'
FROM roadmap_phases p
WHERE p.slug = 'linkedin'
ON CONFLICT (phase_id, slug) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'en', 'Share achievements and results on LinkedIn', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'linkedin' AND i.slug = 'linkedin-share'
ON CONFLICT (item_id, locale) DO NOTHING;

INSERT INTO roadmap_item_translations (item_id, locale, title, summary, machine_translated)
SELECT i.id, 'es', 'Comparte logros y resultados en LinkedIn', NULL, FALSE
FROM roadmap_items i
JOIN roadmap_phases p ON p.id = i.phase_id
WHERE p.slug = 'linkedin' AND i.slug = 'linkedin-share'
ON CONFLICT (item_id, locale) DO NOTHING;

COMMIT;
