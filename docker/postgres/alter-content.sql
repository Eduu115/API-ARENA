-- Content + roadmap schema for content-service (port 8092).
-- Idempotent and transactional. Apply on the live database after the
-- content-service image is deployed (code first, data after).
-- Do not recreate Docker volumes.
--
-- Writes require JWT authority CAP_CONTENT. auth-service only adds that
-- authority after AdminCapability.CONTENT is deployed (T1). Deploy T1 first;
-- until then every content write returns 403.

BEGIN;

CREATE TABLE IF NOT EXISTS content_posts (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(16) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    status VARCHAR(16) NOT NULL,
    source_locale VARCHAR(2) NOT NULL,
    version_label VARCHAR(80),
    cover_image_url VARCHAR(500),
    author_id BIGINT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_content_posts_slug UNIQUE (slug),
    CONSTRAINT content_posts_type_chk CHECK (type IN ('NEWS', 'CHANGELOG')),
    CONSTRAINT content_posts_status_chk CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT content_posts_source_locale_chk CHECK (source_locale IN ('en', 'es'))
);

CREATE TABLE IF NOT EXISTS content_post_translations (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    locale VARCHAR(2) NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    body_md TEXT NOT NULL,
    machine_translated BOOLEAN NOT NULL DEFAULT FALSE,
    translated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_content_post_translations_post_locale UNIQUE (post_id, locale),
    CONSTRAINT content_post_translations_locale_chk CHECK (locale IN ('en', 'es'))
);

CREATE TABLE IF NOT EXISTS content_tags (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(40) NOT NULL,
    CONSTRAINT uq_content_tags_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS content_post_tags (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES content_tags(id) ON DELETE CASCADE,
    CONSTRAINT uq_content_post_tags_post_tag UNIQUE (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS roadmap_phases (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(80) NOT NULL,
    position INT NOT NULL,
    status VARCHAR(16) NOT NULL,
    target_label VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roadmap_phases_slug UNIQUE (slug),
    CONSTRAINT roadmap_phases_status_chk CHECK (status IN ('DONE', 'IN_PROGRESS', 'PLANNED'))
);

CREATE TABLE IF NOT EXISTS roadmap_phase_translations (
    phase_id BIGINT NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
    locale VARCHAR(2) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    machine_translated BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (phase_id, locale),
    CONSTRAINT roadmap_phase_translations_locale_chk CHECK (locale IN ('en', 'es'))
);

CREATE TABLE IF NOT EXISTS roadmap_items (
    id BIGSERIAL PRIMARY KEY,
    phase_id BIGINT NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
    slug VARCHAR(80) NOT NULL,
    position INT NOT NULL,
    status VARCHAR(16) NOT NULL,
    CONSTRAINT uq_roadmap_items_phase_slug UNIQUE (phase_id, slug),
    CONSTRAINT roadmap_items_status_chk CHECK (status IN ('DONE', 'IN_PROGRESS', 'PLANNED'))
);

CREATE TABLE IF NOT EXISTS roadmap_item_translations (
    item_id BIGINT NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
    locale VARCHAR(2) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    machine_translated BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (item_id, locale),
    CONSTRAINT roadmap_item_translations_locale_chk CHECK (locale IN ('en', 'es'))
);

CREATE INDEX IF NOT EXISTS idx_content_posts_type_status_published
    ON content_posts (type, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_post_translations_post
    ON content_post_translations (post_id);
CREATE INDEX IF NOT EXISTS idx_content_post_tags_tag
    ON content_post_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_phases_position
    ON roadmap_phases (position);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_phase_position
    ON roadmap_items (phase_id, position);

COMMIT;
