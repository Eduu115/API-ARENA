-- Run once if DB was created before friendships table existed.
CREATE TABLE IF NOT EXISTS friendships (
    id BIGSERIAL PRIMARY KEY,
    user_low_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_high_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    CHECK (user_low_id < user_high_id),
    UNIQUE(user_low_id, user_high_id)
);
CREATE INDEX IF NOT EXISTS idx_friendships_user_low ON friendships(user_low_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_high ON friendships(user_high_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
