-- ═══════════════════════════════════════════════════════════════════
-- v262 — Manual upgrade requests (NOT RUN YET — owner runs it in the Supabase SQL editor)
--
-- Owner's own simplification (2026-10-04), replacing the earlier AI-screenshot-verification
-- plan: no payment gateway, no automated verification yet. A member fills a short in-app form
-- (which plan + the UPI transaction reference they paid with, + an optional note) and the
-- owner manually checks their own UPI app, then approves or rejects from admin.html -- exactly
-- the kind of thing `subscriptions.source='admin_grant'` (already in schema_v260_plans.sql,
-- the CHECK constraint already allowed 'admin_grant' alongside 'gateway'/'promo') was built for.
--
-- Same reasoning as schema_v260_plans.sql: the CLIENT can insert its own request and read its
-- own requests, but can never approve itself -- only a Worker holding the service_role key
-- (admin-relay-worker.js) can change `subscriptions`, same restriction that table already had.
-- Safe to re-run (IF NOT EXISTS / OR REPLACE everywhere).
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    text NOT NULL DEFAULT 'clar',
  plan_id       text NOT NULL CHECK (length(plan_id) <= 40),
  utr           text CHECK (utr IS NULL OR length(utr) <= 40),
  note          text CHECK (note IS NULL OR length(note) <= 500),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_at   timestamptz,
  reviewer_note text CHECK (reviewer_note IS NULL OR length(reviewer_note) <= 500),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upgrade_requests_user ON upgrade_requests (user_id);
CREATE INDEX IF NOT EXISTS upgrade_requests_status ON upgrade_requests (status, created_at);

-- Staff view, same LEFT JOIN pattern as admin_subscription_overview, so admin.html shows
-- email/nick directly instead of a bare user_id.
CREATE OR REPLACE VIEW admin_upgrade_requests_overview AS
SELECT ur.id, ur.user_id, up.email, up.nick AS name, ur.product_id, ur.plan_id, ur.utr, ur.note,
       ur.status, ur.reviewed_at, ur.reviewer_note, ur.created_at
  FROM upgrade_requests ur
  LEFT JOIN user_profile up ON up.user_id = ur.user_id
 ORDER BY ur.created_at DESC;
REVOKE ALL ON admin_upgrade_requests_overview FROM public, anon, authenticated;
GRANT SELECT ON admin_upgrade_requests_overview TO service_role;

ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member can request their own upgrade" ON upgrade_requests;
CREATE POLICY "member can request their own upgrade" ON upgrade_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "member can see their own upgrade requests" ON upgrade_requests;
CREATE POLICY "member can see their own upgrade requests" ON upgrade_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

GRANT SELECT, INSERT ON upgrade_requests TO authenticated;           -- RLS limits to own rows; no UPDATE/DELETE for clients
GRANT SELECT, INSERT, UPDATE, DELETE ON upgrade_requests TO service_role;

INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Manual upgrade requests (v262, 2026-10-04) -- no payment gateway yet, so a member who has paid via UPI fills a short in-app form (plan + UTR + optional note), which the owner reviews in admin.html''s Upgrade Requests tab against their own UPI app, then approves (writes a real subscriptions row, source=admin_grant, default 1 month) or rejects. admin_upgrade_requests_overview shows email/name alongside each request. Replace with a real payment-gateway webhook (T-106) later -- this table and the admin flow can stay as a manual-grant fallback even after that.'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Manual upgrade requests (v262%');

NOTIFY pgrst, 'reload schema';
