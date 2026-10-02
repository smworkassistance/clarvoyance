-- ═══════════════════════════════════════════════════════════════════
-- v261 — Landing page v4: "Ask Clar" lead capture, Feedback, Growth Scholarship
-- (NOT RUN YET — owner runs it in the Supabase SQL editor)
--
-- Same lockdown pattern as every table since v178 / the plan_waitlist table (schema_v260_plans.sql):
--   * anon may INSERT only — nobody but service_role can ever read these back (emails, feedback text,
--     scholarship situations are all write-only from the public landing page's point of view).
--   * Safe to re-run (IF NOT EXISTS everywhere).
--   * No code reads these yet; a future admin.html tab (or a direct Supabase Table Editor look) is how
--     the owner reviews submissions for now.
-- ═══════════════════════════════════════════════════════════════════

-- 1. landing_leads — captured by the "Ask Clar" bot's optional, skippable lead form -------------------
CREATE TABLE IF NOT EXISTS landing_leads (
  id          bigserial PRIMARY KEY,
  name        text CHECK (name IS NULL OR length(name) <= 120),
  email       text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' AND length(email) <= 254),
  context     text CHECK (context IS NULL OR length(context) <= 4000),   -- a short slice of the bot conversation, for follow-up context only
  source      text NOT NULL DEFAULT 'landing_bot' CHECK (length(source) <= 40),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. landing_feedback — the landing page's own general feedback form (separate from the in-app
--    account-delete feedback screen, which writes to its own app-side table) ------------------------
CREATE TABLE IF NOT EXISTS landing_feedback (
  id          bigserial PRIMARY KEY,
  rating      int CHECK (rating BETWEEN 1 AND 5),
  reason      text CHECK (reason IS NULL OR length(reason) <= 60),
  message     text CHECK (message IS NULL OR length(message) <= 4000),
  email       text CHECK (email IS NULL OR (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' AND length(email) <= 254)),
  source      text NOT NULL DEFAULT 'landing' CHECK (length(source) <= 40),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (rating IS NOT NULL OR reason IS NOT NULL OR message IS NOT NULL)   -- at least one real field, no empty rows
);

-- 3. scholarship_applications — the Clar Growth Scholarship (free Plus/Pro for students / genuine need) ---
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email       text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' AND length(email) <= 254),
  situation   text NOT NULL CHECK (length(situation) BETWEEN 1 AND 4000),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),  -- owner can update by hand while reviewing
  source      text NOT NULL DEFAULT 'landing' CHECK (length(source) <= 40),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. security: RLS + grants ------------------------------------------------------------------------
ALTER TABLE landing_leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can leave a lead" ON landing_leads;
CREATE POLICY "anyone can leave a lead" ON landing_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anyone can leave feedback" ON landing_feedback;
CREATE POLICY "anyone can leave feedback" ON landing_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anyone can apply for the scholarship" ON scholarship_applications;
CREATE POLICY "anyone can apply for the scholarship" ON scholarship_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT INSERT ON landing_leads, landing_feedback, scholarship_applications TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE landing_leads_id_seq, landing_feedback_id_seq, scholarship_applications_id_seq TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON landing_leads, landing_feedback, scholarship_applications TO service_role;

INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Landing page v4 (2026-10-03) -- "Ask Clar" floating bot talks to a visitor via the SAME Gemini worker the app uses (cold-frog-d555), with its own short "landing concierge" system prompt built client-side (content.json bot.system_prompt) -- no Worker change was needed, the worker already allows any origin and takes a client-built system_instruction. Its optional lead form, the landing''s general Feedback page, and the Growth Scholarship page all write to landing_leads / landing_feedback / scholarship_applications -- anon insert-only, nobody but service_role can read them back (review them in the Supabase Table Editor for now). The rotating palette, the ~120-subject marquee and the wisdom quotes are all pure front-end (content.json), nothing server-side.'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Landing page v4 (2026-10-03)%');

NOTIFY pgrst, 'reload schema';
