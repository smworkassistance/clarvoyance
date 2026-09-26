-- v253 / batch B8 — one additive file (owner runs it in the Supabase SQL editor). Safe to run twice.
-- The app and Workers keep working (old behaviour) until it is run: every new query soft-fails.

-- T-062: true video shape (aspect = width/height) for cached YouTube videos, so Vibe/Discover show portrait Shorts edge to edge without black bars
alter table public.youtube_topic_cache add column if not exists aspect numeric;

-- T-063: Clar Reels — instant, self-hosted stock clips (Pexels, re-hosted on our Bunny library) shown in Vibe/Discover with a real quote on top.
-- Filled by the bunny Worker's cron (needs PEXELS_API_KEY). Public can read only clips that finished processing.
create table if not exists public.clar_reels (
  id bigserial primary key,
  pexels_id bigint unique,
  bunny_guid text unique not null,
  theme text,
  width int, height int, duration int,
  photographer text, photographer_url text, pexels_url text,
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  created_at timestamptz not null default now()
);
alter table public.clar_reels enable row level security;
drop policy if exists clar_reels_read on public.clar_reels;
create policy clar_reels_read on public.clar_reels for select to anon, authenticated using (status = 'ready');
grant select on public.clar_reels to anon, authenticated;
grant all on public.clar_reels to service_role;
grant usage, select on sequence public.clar_reels_id_seq to service_role;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
-- T-069: WEEKLY LEAGUES (the new Board). Cohorts of up to 20 members of the same tier compete on XP GAINED THIS WEEK (Mon 00:00 IST -> Sun).
-- Promotion / demotion is decided by league_close_week() (called by the admin-relay cron after the week ends; idempotent).
-- Only members who chose "on the leaderboard" are ever placed in a league or shown in one.
-- Tiers: 0 Seed, 1 Sprout, 2 Bloom, 3 Radiant, 4 Luminous, 5 Sovereign (names live in the app).
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
create or replace function public.league_week_start(ts timestamptz default now()) returns date
language sql stable as $$ select (date_trunc('week', ts at time zone 'Asia/Kolkata'))::date $$;

create table if not exists public.league_members (
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_start  date not null,
  tier        smallint not null default 0 check (tier between 0 and 5),
  cohort_id   text not null,
  xp_start    integer not null default 0,     -- total XP at the moment they joined this week's league (gain = xp now - xp_start)
  xp_final    integer,                        -- set when the week is closed
  rank_final  smallint,
  result      text check (result in ('promoted','stayed','demoted')),
  created_at  timestamptz not null default now(),
  primary key (user_id, week_start)
);
create index if not exists lm_cohort_idx on public.league_members (week_start, cohort_id);
alter table public.league_members enable row level security;
drop policy if exists lm_own on public.league_members;
create policy lm_own on public.league_members for select to authenticated using (user_id = auth.uid());
grant select on public.league_members to authenticated;
grant all on public.league_members to service_role;

create table if not exists public.league_cheers (
  from_user  uuid not null references auth.users(id) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user, week_start),
  constraint lc_no_self check (from_user <> to_user)
);
alter table public.league_cheers enable row level security;
drop policy if exists lc_own on public.league_cheers;
create policy lc_own on public.league_cheers for select to authenticated using (from_user = auth.uid());
grant select on public.league_cheers to authenticated;
grant all on public.league_cheers to service_role;

-- "join my league this week": idempotent; picks the tier from last week's result; fills a cohort of the same tier (max 20) or opens a new one
create or replace function public.league_join_me() returns table (week_start date, tier smallint, cohort_id text)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_w date := public.league_week_start(); v_prev record; v_tier smallint := 0; v_cohort text; v_xp int; v_lb boolean;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select coalesce((p.visibility ->> 'leaderboard')::boolean, false), p.xp into v_lb, v_xp from public.social_profiles p where p.user_id = v_uid;
  if not found or not v_lb then return; end if;                       -- only members who chose to be on the board
  return query select m.week_start, m.tier, m.cohort_id from public.league_members m where m.user_id = v_uid and m.week_start = v_w;
  if found then return; end if;
  select m.tier, m.result into v_prev from public.league_members m where m.user_id = v_uid and m.week_start < v_w order by m.week_start desc limit 1;
  if found then
    v_tier := case v_prev.result when 'promoted' then least(v_prev.tier + 1, 5) when 'demoted' then greatest(v_prev.tier - 1, 0) else v_prev.tier end;
  end if;
  select m.cohort_id into v_cohort from public.league_members m where m.week_start = v_w and m.tier = v_tier
    group by m.cohort_id having count(*) < 20 order by count(*) desc, m.cohort_id limit 1;
  if v_cohort is null then v_cohort := 'w' || v_w::text || '-t' || v_tier || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6); end if;
  insert into public.league_members (user_id, week_start, tier, cohort_id, xp_start) values (v_uid, v_w, v_tier, v_cohort, coalesce(v_xp, 0)) on conflict do nothing;
  return query select v_w, v_tier, v_cohort;
end $$;

-- my league board: everyone in MY cohort this week, ranked by XP gained; masked (still-on-board members only; blocked pairs hidden both ways)
create or replace function public.league_board() returns table (
  rank int, user_id uuid, handle text, display_name text, avatar_url text, gain int, is_me boolean, tier smallint, cohort_id text, week_start date, i_follow boolean, cheered boolean)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_w date := public.league_week_start(); v_c text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select m.cohort_id into v_c from public.league_members m where m.user_id = v_uid and m.week_start = v_w;
  if v_c is null then return; end if;
  return query
    select (row_number() over (order by greatest(0, p.xp - m.xp_start) desc, p.user_id))::int, p.user_id, p.handle, p.display_name, p.avatar_url,
           greatest(0, p.xp - m.xp_start)::int, (p.user_id = v_uid), m.tier, m.cohort_id, m.week_start,
           exists (select 1 from public.social_follows f where f.follower_id = v_uid and f.following_id = p.user_id),
           exists (select 1 from public.league_cheers c where c.from_user = v_uid and c.to_user = p.user_id and c.week_start = v_w)
    from public.league_members m join public.social_profiles p on p.user_id = m.user_id
    where m.cohort_id = v_c and m.week_start = v_w
      and (p.user_id = v_uid or coalesce((p.visibility ->> 'leaderboard')::boolean, false))
      and not exists (select 1 from public.social_blocks b where (b.blocker_id = v_uid and b.blocked_id = p.user_id) or (b.blocker_id = p.user_id and b.blocked_id = v_uid))
    order by 1;
end $$;

-- my own league facts: this week + last week's outcome (for "you vs last week" and the weekly recap)
create or replace function public.league_me() returns table (
  week_start date, tier smallint, cohort_id text, gain int, last_week date, last_tier smallint, last_xp int, last_rank smallint, last_result text)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_w date := public.league_week_start();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  return query
    select m.week_start, m.tier, m.cohort_id, greatest(0, coalesce(p.xp, 0) - m.xp_start)::int,
           l.week_start, l.tier, l.xp_final, l.rank_final, l.result
    from public.league_members m
    join public.social_profiles p on p.user_id = m.user_id
    left join lateral (select x.* from public.league_members x where x.user_id = v_uid and x.week_start < v_w order by x.week_start desc limit 1) l on true
    where m.user_id = v_uid and m.week_start = v_w;
end $$;

-- cheer someone in my league (once per person per week)
create or replace function public.league_cheer(p_to uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_w date := public.league_week_start();
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  -- only people in MY cohort this week can be cheered
  if not exists (select 1 from public.league_members a join public.league_members b on b.cohort_id = a.cohort_id and b.week_start = a.week_start
                 where a.user_id = v_uid and b.user_id = p_to and a.week_start = v_w) then return false; end if;
  insert into public.league_cheers (from_user, to_user, week_start) values (v_uid, p_to, v_w) on conflict do nothing;
  return true;
end $$;

-- closing the week (service_role only): rank each cohort by XP gained; top 5 promote (top 1 in a cohort under 6), bottom 3 demote (cohorts of 10+, never below Seed); idempotent
create or replace function public.league_close_week(p_week date default null) returns int
language plpgsql security definer set search_path = public as $$
declare v_w date := coalesce(p_week, public.league_week_start() - 7); n int := 0; r record; v_res text;
begin
  for r in
    select m.user_id, m.tier, m.cohort_id,
           greatest(0, coalesce(p.xp, 0) - m.xp_start) as gain,
           row_number() over (partition by m.cohort_id order by greatest(0, coalesce(p.xp, 0) - m.xp_start) desc, m.user_id) as rk,
           count(*) over (partition by m.cohort_id) as sz
    from public.league_members m left join public.social_profiles p on p.user_id = m.user_id
    where m.week_start = v_w and m.result is null
  loop
    v_res := 'stayed';
    if r.gain > 0 and r.tier < 5 and ((r.sz >= 6 and r.rk <= 5) or (r.sz < 6 and r.rk = 1)) then v_res := 'promoted';
    elsif r.tier > 0 and r.sz >= 10 and r.rk > r.sz - 3 then v_res := 'demoted';
    end if;
    update public.league_members set xp_final = r.gain, rank_final = r.rk, result = v_res where user_id = r.user_id and week_start = v_w;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.league_close_week(date) from public, anon, authenticated;
grant execute on function public.league_close_week(date) to service_role;
grant execute on function public.league_join_me(), public.league_board(), public.league_me(), public.league_cheer(uuid), public.league_week_start(timestamptz) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
-- T-070: NOTIFICATIONS (the Activity screen). Rows are created by database triggers (likes, comments, follows, league result/cheers) so the app never has to.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
create table if not exists public.user_notifications (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('like','comment','follow','guide_post','league','badge','clar','cheer')),
  actor_id    uuid references auth.users(id) on delete set null,
  target_type text,
  target_id   text,
  text        text check (text is null or char_length(text) <= 200),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists un_user_idx on public.user_notifications (user_id, created_at desc);
create unique index if not exists un_dedupe on public.user_notifications (user_id, kind, actor_id, target_type, target_id) where kind in ('like','follow','cheer');
alter table public.user_notifications enable row level security;
drop policy if exists un_select on public.user_notifications;
drop policy if exists un_update on public.user_notifications;
drop policy if exists un_self_badge on public.user_notifications;
create policy un_select on public.user_notifications for select to authenticated using (user_id = auth.uid());
create policy un_update on public.user_notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy un_self_badge on public.user_notifications for insert to authenticated with check (user_id = auth.uid() and kind = 'badge' and actor_id is null);
revoke all on public.user_notifications from anon, authenticated;
grant select on public.user_notifications to authenticated;
grant update (read_at) on public.user_notifications to authenticated;
grant insert (user_id, kind, target_type, target_id, text) on public.user_notifications to authenticated;
grant all on public.user_notifications to service_role;
grant usage, select on sequence public.user_notifications_id_seq to authenticated, service_role;

-- like on my post
create or replace function public.tg_notify_like() returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select a.user_id into v_owner from public.social_achievements a where a.id = new.target_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.user_notifications (user_id, kind, actor_id, target_type, target_id) values (v_owner, 'like', new.user_id, new.target_type, new.target_id::text) on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists notify_like on public.social_reactions;
create trigger notify_like after insert on public.social_reactions for each row execute function public.tg_notify_like();

-- comment on my post
create or replace function public.tg_notify_comment() returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select a.user_id into v_owner from public.social_achievements a where a.id = new.target_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.user_notifications (user_id, kind, actor_id, target_type, target_id, text) values (v_owner, 'comment', new.user_id, new.target_type, new.target_id::text, left(new.body, 120));
  end if;
  return new;
end $$;
drop trigger if exists notify_comment on public.social_comments;
create trigger notify_comment after insert on public.social_comments for each row execute function public.tg_notify_comment();

-- someone followed me
create or replace function public.tg_notify_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.following_id <> new.follower_id then
    insert into public.user_notifications (user_id, kind, actor_id, target_type, target_id) values (new.following_id, 'follow', new.follower_id, 'profile', new.follower_id::text) on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists notify_follow on public.social_follows;
create trigger notify_follow after insert on public.social_follows for each row execute function public.tg_notify_follow();

-- league: a cheer, and the weekly result
create or replace function public.tg_notify_cheer() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_notifications (user_id, kind, actor_id, target_type, target_id, text) values (new.to_user, 'cheer', new.from_user, 'league', new.week_start::text, 'cheered you on in your league') on conflict do nothing;
  return new;
end $$;
drop trigger if exists notify_cheer on public.league_cheers;
create trigger notify_cheer after insert on public.league_cheers for each row execute function public.tg_notify_cheer();

create or replace function public.tg_notify_league_result() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.result is not null and old.result is null then
    insert into public.user_notifications (user_id, kind, target_type, target_id, text)
    values (new.user_id, 'league', 'league', new.week_start::text,
            case new.result when 'promoted' then 'You moved up a league this week' when 'demoted' then 'You moved down a league — a fresh start this week' else 'You stayed in your league this week' end);
  end if;
  return new;
end $$;
drop trigger if exists notify_league_result on public.league_members;
create trigger notify_league_result after update on public.league_members for each row execute function public.tg_notify_league_result();
