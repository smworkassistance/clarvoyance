-- v264: Goal story details (category, target date, why, feel, listens).
-- One additive jsonb column on the existing user_goal_items table. Existing rows
-- get '{}', the own-row RLS policies and grants already cover the column, and
-- nothing else changes. Until this runs, the app retries saves without the column,
-- so goals keep syncing their titles and photos as before.
alter table public.user_goal_items
  add column if not exists details jsonb not null default '{}'::jsonb;

-- Tell PostgREST to pick up the new column straight away
notify pgrst, 'reload schema';
