-- Website waitlist and voice notes, in the website's own schema inside the shared database.
-- Never reference CoverSaath backend tables from here.
CREATE SCHEMA IF NOT EXISTS knowvia_web;

CREATE TABLE knowvia_web.waitlist (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 320),
  first_name TEXT CHECK (first_name IS NULL OR length(first_name) <= 80),
  events TEXT[] NOT NULL DEFAULT '{}',
  policies TEXT[] NOT NULL DEFAULT '{}',
  signup_location TEXT NOT NULL CHECK (signup_location IN ('hero', 'closing')),
  attribution JSONB NOT NULL DEFAULT '{}',
  consent_text_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL,
  consent_source TEXT NOT NULL,
  -- Per-email throttle window: submissions counted since window_started_at.
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_count INTEGER NOT NULL DEFAULT 1 CHECK (window_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE knowvia_web.voice_notes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 320),
  audio BYTEA NOT NULL,
  mime_type TEXT NOT NULL CHECK (length(mime_type) <= 80),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 1 AND 60),
  consent_text_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL,
  consent_source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX voice_notes_email_created_idx ON knowvia_web.voice_notes (email, created_at);

-- Deny-by-default for any role other than the owner (no policies are defined).
ALTER TABLE knowvia_web.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowvia_web.voice_notes ENABLE ROW LEVEL SECURITY;

-- On Supabase, keep the schema away from the public API roles. Skipped where the roles do not exist.
DO $$
DECLARE r TEXT;
BEGIN
  REVOKE ALL ON SCHEMA knowvia_web FROM PUBLIC;
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA knowvia_web FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA knowvia_web FROM %I', r);
    END IF;
  END LOOP;
END $$;
