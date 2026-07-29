-- ═══════════════════════════════════════════════════════════════════
-- Clarvoyance v161 — Consultant System Commands + Saved Suggestions
-- Run in the Supabase SQL Editor (once)
-- ═══════════════════════════════════════════════════════════════════

-- admin_commands: two purposes in one small table, split by `type`:
--   'rule'       — standing instructions always fed into the Consultant's
--                  own system prompt (how it should think/prioritize)
--   'suggestion' — a specific suggestion the owner clicked "Save" on from
--                  a Consultant reply, kept as a lightweight action list
CREATE TABLE IF NOT EXISTS admin_commands (
  id         bigserial   PRIMARY KEY,
  type       text        NOT NULL CHECK (type IN ('rule','suggestion')),
  text       text        NOT NULL,
  done       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_commands ENABLE ROW LEVEL SECURITY;

-- Same temporary-openness as ai_context/admin_insights (admin.html has no
-- real auth yet — see CLAUDE.md AI Logic Console security note).
CREATE POLICY "anon_commands_select" ON admin_commands FOR SELECT TO anon USING (true);
CREATE POLICY "anon_commands_insert" ON admin_commands FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_commands_update" ON admin_commands FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_commands_delete" ON admin_commands FOR DELETE TO anon USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON admin_commands TO anon;
GRANT USAGE, SELECT ON SEQUENCE admin_commands_id_seq TO anon;
