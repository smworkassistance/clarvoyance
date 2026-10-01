-- Clarvoyance v255 — T-075: grants needed for the new self-service account-delete flow.
-- Run this once in the Supabase SQL editor. Purely additive (GRANT is idempotent —
-- safe to re-run), touches no data, no RLS policy, no table shape.
--
-- Why this file is only 2 tables, not 30+: reading every db/*.sql migration (not
-- assuming) showed almost every per-user table already has
--   user_id/owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
-- which means deleting the actual auth.users row (done by the Worker via the Auth
-- Admin API, which needs no separate table GRANT) already cascades all of those
-- automatically. Only these two tables were created WITHOUT that FK and are deleted
-- explicitly by workers/admin-relay-worker.js's deleteMyAccount() — and only these two
-- were never given a service_role grant by any earlier migration (checked via grep
-- across every db/*.sql file, not guessed): social_video_uploads, user_push_subscriptions
-- and notification_send_log already have one (schema_v246_video.sql / schema_v184_notifications.sql).

GRANT SELECT, DELETE ON public.admin_insights       TO service_role;
GRANT SELECT, DELETE ON public.user_practice_plans  TO service_role;
