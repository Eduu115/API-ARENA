-- Normalize displayed profile badges: the "displayed" selection is an attribute
-- of an owned badge, not a JSON array on users. Run once on the live container;
-- idempotent. Backfills from users.displayed_profile_badges, then that column is
-- left orphaned (drop it in a later migration once verified).
ALTER TABLE user_profile_badges ADD COLUMN IF NOT EXISTS displayed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE user_profile_badges upb
SET displayed = TRUE
FROM users u,
     profile_badge_definitions d,
     LATERAL json_array_elements_text(
         COALESCE(NULLIF(u.displayed_profile_badges, ''), '[]')::json
     ) AS elem(code)
WHERE upb.user_id = u.id
  AND upb.badge_id = d.id
  AND d.code = elem.code;
