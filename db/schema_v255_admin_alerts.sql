-- Clarvoyance v255 — T-076: admin email alerts (Resend), cooldown ledger.
-- Run this once in the Supabase SQL editor. Purely additive (one small new table).
--
-- Why a table and not an in-memory counter: a Cloudflare Worker instance can cold-start
-- at any moment, which would silently reset an in-memory cooldown mid-outage — exactly
-- when it matters most (a real multi-day billing outage, like the one this fixes).

CREATE TABLE IF NOT EXISTS public.admin_alert_log (
  key           text PRIMARY KEY,
  last_sent_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.admin_alert_log TO service_role;

-- OWNER STEPS (both required for T-076 to actually send an email — until then it's a
-- harmless no-op: maybeSendAlert() catches the missing-secret error and returns quietly):
--   1. Sign up at resend.com (free tier), create an API key.
--   2. In the deployed admin-relay-worker Cloudflare Worker -> Settings -> Variables and
--      Secrets, add:
--        RESEND_API_KEY     (SECRET)      the key from step 1
--        ADMIN_ALERT_EMAIL  (plain text)  the inbox that should receive the alerts
--      Deploy again after saving (Cloudflare sometimes keeps the old deployment without
--      a new secret — the same gotcha already documented in workers/bunny-relay-worker.js).
