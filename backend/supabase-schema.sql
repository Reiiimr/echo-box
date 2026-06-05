-- ══════════════════════════════════════════════════════════════
--  Echo-Box — Supabase / PostgreSQL Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════


-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE users (
  id           VARCHAR(128) PRIMARY KEY,       -- Firebase UID
  username     VARCHAR(30)  UNIQUE NOT NULL,   -- URL-friendly, lowercase
  display_name VARCHAR(50)  NOT NULL,
  bio          TEXT,
  gender       VARCHAR(20)  NOT NULL,          -- Immutable after setup
  age          INT          NOT NULL,          -- Immutable after setup
  box_name     VARCHAR(100) DEFAULT 'My Box',
  box_color    VARCHAR(7)   DEFAULT '#8b6440', -- Hex colour
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);


-- ── ITEMS ─────────────────────────────────────────────────────
-- Stores Cassette Tapes, Mail, and Packages.
CREATE TABLE items (
  id           SERIAL       PRIMARY KEY,
  sender_id    VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
  receiver_id  VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  item_type    VARCHAR(10)  NOT NULL CHECK (item_type IN ('cassette', 'mail', 'package')),
  sender_alias VARCHAR(15)  DEFAULT 'display' CHECK (sender_alias IN ('display', 'anonymous')),
  text_content TEXT,
  voice_url    TEXT,        -- Firebase Storage URL
  image_url    TEXT,        -- Firebase Storage URL
  scheduled_at TIMESTAMPTZ  DEFAULT NOW(),
  is_deleted   BOOLEAN      DEFAULT FALSE,
  is_read      BOOLEAN      DEFAULT FALSE,
  reaction     VARCHAR(10)  DEFAULT NULL,  -- emoji reaction stamp
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);


-- ── BLOCKS ────────────────────────────────────────────────────
CREATE TABLE blocks (
  id         SERIAL       PRIMARY KEY,
  blocker_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  blocked_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);


-- ── REPORTS ───────────────────────────────────────────────────
CREATE TABLE reports (
  id          SERIAL       PRIMARY KEY,
  reporter_id VARCHAR(128) REFERENCES users(id) ON DELETE SET NULL,
  reported_id VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);


-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_items_receiver    ON items(receiver_id, scheduled_at DESC);
CREATE INDEX idx_items_sender      ON items(sender_id, created_at DESC);
CREATE INDEX idx_items_unread      ON items(receiver_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_blocks_blocker    ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked    ON blocks(blocked_id);
CREATE INDEX idx_users_username    ON users(username);


-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- We use the service-role key from the backend, so all access
-- goes through our Express API. RLS is enabled for safety but
-- policies allow full access via service role.

ALTER TABLE users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow everything (backend enforces business rules via service key)
CREATE POLICY "full_access_users"   ON users   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access_items"   ON items   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access_blocks"  ON blocks  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access_reports" ON reports FOR ALL USING (true) WITH CHECK (true);
