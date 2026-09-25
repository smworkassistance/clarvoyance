-- ═══════════════════════════════════════════════════════════════════════════
-- v247 (T-010) — usage_correlation_me(): the v225 "does this person's own engagement track with how they are
-- doing?" calculation, moved SERVER-SIDE.
-- Run once in the Supabase SQL editor. Safe to re-run (create or replace).
--
-- WHY
--  v225 computed this in the browser by reading `admin_insights`. Since v178b that table is (rightly) locked to
--  service_role only, so every read returned 403 and Fortune's "USAGE-OUTCOME EVIDENCE" could never appear.
--  Re-opening the table would leak every user's chat/Fortune log snippets. Instead this SECURITY DEFINER function reads
--  the table on the caller's behalf, but ONLY for auth.uid(), and returns just the aggregate numbers — never raw rows.
--
-- WHAT (identical algorithm to the JS it replaces; verified against it on 200+ random fixtures in a real Postgres engine)
--  For every UTC day with at least one logged state_read (low=0, neutral=0.5, high=1; chat + Fortune rows alike),
--  take that same person's mean daily_score over that day and the two before it (only days that have a score).
--  Days with no score in that 3-day window are dropped. With >= 6 such days, sort by that recent engagement, compare the
--  average state of the lower half with the higher half; "confirms" when higher > lower + 0.05.
--  Deliberate improvement over the JS: it looked at the OLDEST 120 score rows / 400 insight rows; this uses the MOST RECENT
--  (identical for anyone under those limits).
--
-- SECURITY
--  execute: authenticated only (every real app user, anonymous sessions included). anon/public: revoked.
--  search_path pinned; returns NULL when there is no logged-in user. Additive: one new function, nothing else touched.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.usage_correlation_me()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_uid  uuid := auth.uid();
  v_n    bigint;
  v_low  numeric;
  v_high numeric;
begin
  if v_uid is null then
    return null;
  end if;

  with insights as (
    select created_at, value
    from (
      select created_at, value
      from public.admin_insights
      where user_id = v_uid
      order by created_at desc
      limit 400
    ) i
  ),
  sd as (                                   -- one row per UTC day: average state that day
    select (created_at at time zone 'utc')::date as d,
           avg(case value->>'state_read' when 'low' then 0.0 when 'neutral' then 0.5 else 1.0 end)::numeric as avg_state
    from insights
    where value->>'state_read' in ('low', 'neutral', 'high')
    group by 1
  ),
  sc as (                                   -- the person's own daily engagement scores
    select date::date as d, daily_score::numeric as s
    from (
      select date, daily_score
      from public.user_daily_log
      where user_id = v_uid and daily_score is not null
      order by date desc
      limit 120
    ) y
  ),
  pts as (                                  -- that day + the 2 before it
    select sd.d, sd.avg_state,
           (select avg(sc.s) from sc where sc.d between sd.d - 2 and sd.d) as recent
    from sd
  ),
  ranked as (
    select avg_state,
           row_number() over (order by recent, d) as rn,
           count(*) over ()                        as n
    from pts
    where recent is not null
  )
  select max(n),
         avg(avg_state) filter (where rn <= floor(n / 2.0)),
         avg(avg_state) filter (where rn >  n - floor(n / 2.0))
    into v_n, v_low, v_high
  from ranked;

  if coalesce(v_n, 0) < 6 then
    return jsonb_build_object('hasEnoughData', false, 'sampleSize', coalesce(v_n, 0));
  end if;

  return jsonb_build_object(
    'hasEnoughData', true,
    'sampleSize', v_n,
    'lowEngagementStatePct',  round(v_low  * 100)::int,
    'highEngagementStatePct', round(v_high * 100)::int,
    'confirms', v_high > v_low + 0.05
  );
end;
$$;

revoke all on function public.usage_correlation_me() from public, anon;
grant execute on function public.usage_correlation_me() to authenticated;

notify pgrst, 'reload schema';
