-- Removes the maintainer roadmap seed. Leaves the content tables in place.
-- Idempotent.

BEGIN;

DELETE FROM roadmap_item_translations
WHERE item_id IN (
    SELECT i.id FROM roadmap_items i
    JOIN roadmap_phases p ON p.id = i.phase_id
    WHERE p.slug IN (
        'foundations', 'the-arena', 'competition', 'community', 'teachers', 'trust-safety',
        'present-python', 'multiplayer', 'academy', 'new-technologies', 'mobile-app', 'linkedin'
    )
);

DELETE FROM roadmap_items
WHERE phase_id IN (
    SELECT id FROM roadmap_phases WHERE slug IN (
        'foundations', 'the-arena', 'competition', 'community', 'teachers', 'trust-safety',
        'present-python', 'multiplayer', 'academy', 'new-technologies', 'mobile-app', 'linkedin'
    )
);

DELETE FROM roadmap_phase_translations
WHERE phase_id IN (
    SELECT id FROM roadmap_phases WHERE slug IN (
        'foundations', 'the-arena', 'competition', 'community', 'teachers', 'trust-safety',
        'present-python', 'multiplayer', 'academy', 'new-technologies', 'mobile-app', 'linkedin'
    )
);

DELETE FROM roadmap_phases WHERE slug IN (
    'foundations', 'the-arena', 'competition', 'community', 'teachers', 'trust-safety',
    'present-python', 'multiplayer', 'academy', 'new-technologies', 'mobile-app', 'linkedin'
);

COMMIT;
