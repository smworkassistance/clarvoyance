-- ═══════════════════════════════════════════════════════════════════════
-- v263 (T-101): server-side daily counter for Clar AI messages.
-- Run in the Supabase SQL editor. Additive and idempotent (safe to re-run).
-- Used by workers/gemini-proxy-worker.js ONLY when feature_flags.plans_enforced is ON.
-- Nothing in the app reads or writes this table from the browser.
-- ═══════════════════════════════════════════════════════════════════════

-- one row per member, per UTC day, per feature: how many were used
create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default ((now() at time zone 'utc')::date),
  feature text not null,
  count   int  not null default 0 check (count >= 0),
  primary key (user_id, day, feature)
);

-- locked down: no policy for anon/authenticated = the browser can neither read nor write it.
-- Only the service role (the proxy Worker) touches it.
alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from anon, authenticated;
grant select, insert, update, delete on public.ai_usage_daily to service_role;

-- atomic "use one, if allowed": returns the new count, or -1 when the limit is already reached
-- (nothing is counted in that case). p_limit <= 0 is always refused, so a missing plan row can never mean "unlimited".
create or replace function public.ai_usage_consume(p_user uuid, p_feature text, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v int;
begin
  if p_limit is null or p_limit <= 0 then
    return -1;
  end if;
  insert into public.ai_usage_daily as u (user_id, day, feature, count)
  values (p_user, (now() at time zone 'utc')::date, p_feature, 1)
  on conflict (user_id, day, feature)
  do update set count = u.count + 1 where u.count < p_limit
  returning u.count into v;
  if v is null then
    return -1;
  end if;
  return v;
end;
$$;

-- only the service role may call it (never the browser)
revoke all on function public.ai_usage_consume(uuid, text, int) from public, anon, authenticated;
grant execute on function public.ai_usage_consume(uuid, text, int) to service_role;

-- the enforcement switch itself (OFF until the owner flips it). Created here only if missing, never overwritten.
insert into public.feature_flags (key, enabled)
values ('plans_enforced', false)
on conflict (key) do nothing;
