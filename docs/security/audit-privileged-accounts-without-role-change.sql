-- READ ONLY. Do not apply this as a migration. Do not modify data.
-- Maintainer: run this yourself against production (psql). It is a SELECT only.
--
-- Lists ADMIN and TEACHER accounts that are not in the init-db.sql seed
-- (sysop, profoak, profsanchez) and have no admin_audit_log row for a role
-- change (action = 'SET_ROLE'). Those rows may have been created by the
-- public registration bug that trusted a client-supplied role.
--
-- Expected seed (docker/postgres/init-db.sql):
--   sysop       / sysop@apiarena.dev       ADMIN
--   profoak     / profoak@apiarena.dev     TEACHER
--   profsanchez / profsanchez@apiarena.dev TEACHER

SELECT
    u.id,
    u.username,
    u.email,
    u.role,
    u.created_at,
    u.is_active,
    u.email_verified
FROM users u
WHERE u.role IN ('ADMIN', 'TEACHER')
  AND u.username NOT IN ('sysop', 'profoak', 'profsanchez')
  AND lower(u.email) NOT IN (
        'sysop@apiarena.dev',
        'profoak@apiarena.dev',
        'profsanchez@apiarena.dev'
      )
  AND NOT EXISTS (
        SELECT 1
        FROM admin_audit_log a
        WHERE a.action = 'SET_ROLE'
          AND (
                a.target_user_id = u.id
             OR a.target_username = u.username
          )
      )
ORDER BY u.created_at NULLS LAST, u.id;
