-- ═══════════════════════════════════════════════════════════════════
-- T-107 — "Before you go" feedback screen shown just before account delete
-- (NOT RUN YET — owner runs it in the Supabase SQL editor)
--
-- Deliberately a standalone table with NO foreign key to auth.users: the client inserts
-- this row a few seconds before calling account.deleteMe (admin-relay-worker.js), which
-- deletes the user's auth.users row. A FK with ON DELETE CASCADE would wipe this exact
-- feedback the moment that happens, defeating the entire point of collecting it. Same
-- lockdown pattern as landing_leads/landing_feedback (schema_v261_landing_pages.sql):
--   * anon/authenticated may INSERT only — nobody but service_role can read it back.
--   * Safe to re-run (IF NOT EXISTS everywhere).
--   * The client-side insert already soft-fails (try/catch + .catch) if this table
--     doesn't exist, so nothing breaks before this is run — the delete flow just skips
--     straight past collecting feedback until then.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS account_delete_feedback (
  id          bigserial PRIMARY KEY,
  reason      text CHECK (reason IS NULL OR length(reason) <= 60),
  message     text CHECK (message IS NULL OR length(message) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_delete_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone leaving can leave feedback" ON account_delete_feedback;
CREATE POLICY "anyone leaving can leave feedback" ON account_delete_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT INSERT ON account_delete_feedback TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE account_delete_feedback_id_seq TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_delete_feedback TO service_role;

INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Account-delete feedback (T-107, 2026-10-03) -- "Before you go" screen shown right before the real delete-confirm screen (Profile -> Danger Zone -> Delete my account). Reason chips + optional free-text, fully skippable, writes one row to account_delete_feedback (no FK to the user -- deliberately, so it survives the account deletion that follows seconds later). View it directly in the Supabase Table Editor or via admin.html (not yet added to an admin tab -- a small follow-up if the owner wants it there).'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Account-delete feedback (T-107, 2026-10-03)%');

NOTIFY pgrst, 'reload schema';
