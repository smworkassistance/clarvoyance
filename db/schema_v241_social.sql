-- ═══════════════════════════════════════════════════════════════════════════
-- v241 — Community (social layer)
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
--
-- DESIGN
--  * Other people can NEVER read the base tables. They read two VIEWS
--    (social_public_profiles, social_feed) that mask every field the owner has not
--    made public. Privacy is therefore enforced by the database, not by the app.
--  * Views run with the view owner's rights on purpose (that is what lets them read
--    rows RLS hides from the caller) and filter with auth.uid() themselves.
--  * The feed stores only a badge_id — never free text — so the only user-written
--    text anywhere in the Community is display name, handle, bio and goal, all
--    length-limited here, and reportable.
--  * Everything ships OFF: the feature flag row below is enabled=false. Existing
--    users see no change until you flip it (see the last statement).
--  * Per this project's standing gotcha, each new table gets an explicit
--    service_role GRANT and (for the live app) an `authenticated` GRANT.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. Feature flag ───────────────────────────────────────────────────────
create table if not exists public.feature_flags (
  key        text primary key,
  enabled    boolean not null default false,
  note       text,
  updated_at timestamptz not null default now()
);
alter table public.feature_flags enable row level security;
drop policy if exists "flags read" on public.feature_flags;
create policy "flags read" on public.feature_flags for select to anon, authenticated using (true);
grant select on public.feature_flags to anon, authenticated;
grant select, insert, update, delete on public.feature_flags to service_role;
insert into public.feature_flags (key, enabled, note)
values ('social_layer', false, 'Community: profiles, follows, leaderboard, feed. Flip enabled=true to launch.')
on conflict (key) do nothing;

-- ── 1. Profiles (own-row only; everyone else reads the view) ───────────────
create table if not exists public.social_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  handle         text not null,
  display_name   text not null,
  bio            text not null default '',
  avatar_url     text,
  age_confirmed  boolean not null default false,
  is_listed      boolean not null default true,
  visibility     jsonb   not null default '{}'::jsonb,
  xp             integer not null default 0,
  xp_week        integer not null default 0,
  streak         integer not null default 0,
  engaged_days   integer not null default 0,
  clar_min_day   numeric(7,1),
  clar_min_week  numeric(8,1),
  badges         jsonb   not null default '[]'::jsonb,
  goal_text      text,
  interests      jsonb   not null default '{}'::jsonb,
  stats_at       timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint sp_handle_fmt check (handle ~ '^[a-z0-9_.]{3,20}$'),
  constraint sp_name_len   check (char_length(display_name) between 1 and 40),
  constraint sp_bio_len    check (char_length(bio) <= 160),
  constraint sp_goal_len   check (goal_text is null or char_length(goal_text) <= 280),
  constraint sp_adult      check (age_confirmed),                     -- 18+ declaration is mandatory
  constraint sp_xp_sane    check (xp between 0 and 10000000 and xp_week between 0 and 100000),
  constraint sp_badges_arr check (jsonb_typeof(badges) = 'array' and jsonb_array_length(badges) <= 60),
  -- hardening: nobody can smuggle a tracking URL, a huge blob, or an official-looking handle in through the API
  constraint sp_avatar_https check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500)),
  constraint sp_json_size    check (pg_column_size(interests) <= 4000 and pg_column_size(visibility) <= 500),
  constraint sp_handle_resv  check (handle not in ('admin','administrator','clar','clarvoyance','support','help','moderator','official','staff','team','root'))
);
create unique index if not exists sp_handle_uq on public.social_profiles (handle);
create index if not exists sp_xp_idx      on public.social_profiles (xp desc);
create index if not exists sp_xpweek_idx  on public.social_profiles (xp_week desc);
alter table public.social_profiles enable row level security;
drop policy if exists "sp own select" on public.social_profiles;
drop policy if exists "sp own insert" on public.social_profiles;
drop policy if exists "sp own update" on public.social_profiles;
drop policy if exists "sp own delete" on public.social_profiles;
create policy "sp own select" on public.social_profiles for select to authenticated using (user_id = auth.uid());
create policy "sp own insert" on public.social_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "sp own update" on public.social_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sp own delete" on public.social_profiles for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.social_profiles to authenticated;
grant select, insert, update, delete on public.social_profiles to service_role;

-- ── 2. Follows ────────────────────────────────────────────────────────────
create table if not exists public.social_follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint sf_no_self check (follower_id <> following_id)
);
create index if not exists sf_following_idx on public.social_follows (following_id);
alter table public.social_follows enable row level security;
drop policy if exists "sf own select" on public.social_follows;
drop policy if exists "sf own insert" on public.social_follows;
drop policy if exists "sf own delete" on public.social_follows;
create policy "sf own select" on public.social_follows for select to authenticated using (follower_id = auth.uid() or following_id = auth.uid());
create policy "sf own insert" on public.social_follows for insert to authenticated with check (follower_id = auth.uid());
-- you can remove your own follows AND remove someone who follows you
create policy "sf own delete" on public.social_follows for delete to authenticated using (follower_id = auth.uid() or following_id = auth.uid());
grant select, insert, delete on public.social_follows to authenticated;
grant select, insert, update, delete on public.social_follows to service_role;

-- ── 3. Blocks (handle/name denormalised so the blocked list can still be shown) ──
create table if not exists public.social_blocks (
  blocker_id     uuid not null references auth.users(id) on delete cascade,
  blocked_id     uuid not null references auth.users(id) on delete cascade,
  blocked_handle text,
  blocked_name   text,
  created_at     timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint sb_no_self check (blocker_id <> blocked_id)
);
alter table public.social_blocks enable row level security;
drop policy if exists "sb own select" on public.social_blocks;
drop policy if exists "sb own insert" on public.social_blocks;
drop policy if exists "sb own delete" on public.social_blocks;
create policy "sb own select" on public.social_blocks for select to authenticated using (blocker_id = auth.uid());
create policy "sb own insert" on public.social_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "sb own delete" on public.social_blocks for delete to authenticated using (blocker_id = auth.uid());
grant select, insert, delete on public.social_blocks to authenticated;
grant select, insert, update, delete on public.social_blocks to service_role;

-- ── 4. Reports (write-only for users; you read them in the Supabase dashboard) ──
create table if not exists public.social_reports (
  id          bigint generated by default as identity primary key,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null check (reason in ('Spam','Harassment','Fake or impersonation','Inappropriate','Other')),
  note        text check (note is null or char_length(note) <= 300),
  created_at  timestamptz not null default now()
);
alter table public.social_reports enable row level security;
drop policy if exists "sr insert" on public.social_reports;
create policy "sr insert" on public.social_reports for insert to authenticated with check (reporter_id = auth.uid());
grant insert on public.social_reports to authenticated;
grant select, insert, update, delete on public.social_reports to service_role;

-- ── 5. Activity (achievement posts) — badge_id only, never free text ───────
create table if not exists public.social_activity (
  id         bigint generated by default as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  badge_id   text not null check (badge_id ~ '^[a-z0-9_]{1,24}$'),
  created_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
create index if not exists sa_user_idx on public.social_activity (user_id, created_at desc);
alter table public.social_activity enable row level security;
drop policy if exists "sa own select" on public.social_activity;
drop policy if exists "sa own insert" on public.social_activity;
drop policy if exists "sa own delete" on public.social_activity;
create policy "sa own select" on public.social_activity for select to authenticated using (user_id = auth.uid());
create policy "sa own insert" on public.social_activity for insert to authenticated with check (user_id = auth.uid());
create policy "sa own delete" on public.social_activity for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.social_activity to authenticated;
grant select, insert, update, delete on public.social_activity to service_role;

-- ── 6. Cheers ─────────────────────────────────────────────────────────────
create table if not exists public.social_cheers (
  activity_id bigint not null references public.social_activity(id) on delete cascade,
  user_id     uuid   not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id)
);
alter table public.social_cheers enable row level security;
drop policy if exists "sc own select" on public.social_cheers;
drop policy if exists "sc own insert" on public.social_cheers;
drop policy if exists "sc own delete" on public.social_cheers;
create policy "sc own select" on public.social_cheers for select to authenticated using (user_id = auth.uid());
create policy "sc own insert" on public.social_cheers for insert to authenticated with check (user_id = auth.uid());
create policy "sc own delete" on public.social_cheers for delete to authenticated using (user_id = auth.uid());
grant select, insert, delete on public.social_cheers to authenticated;
grant select, insert, update, delete on public.social_cheers to service_role;

-- ── 7. VIEW: what other people are allowed to see of a profile ─────────────
-- Each sensitive column is NULL unless the owner switched it on (or it is the
-- owner looking at themselves). Being on the leaderboard implies XP + badges.
-- Blocked pairs (either direction) are invisible to each other.
create or replace view public.social_public_profiles as
select
  p.user_id, p.handle, p.display_name, p.bio, p.avatar_url, p.is_listed, p.created_at, p.updated_at,
  f.me as is_me,
  f.v_lb as on_leaderboard,
  case when f.me then p.visibility end                                   as visibility,
  case when f.me or f.v_xp or f.v_lb        then p.xp            end     as xp,
  case when f.me or f.v_xp or f.v_lb        then p.xp_week       end     as xp_week,
  case when f.me or f.v_streak              then p.streak        end     as streak,
  case when f.me or f.v_streak              then p.engaged_days  end     as engaged_days,
  case when f.me or f.v_badges or f.v_lb    then p.badges        end     as badges,
  case when f.me or f.v_time                then p.clar_min_day  end     as clar_min_day,
  case when f.me or f.v_time                then p.clar_min_week end     as clar_min_week,
  case when f.me or f.v_goal                then p.goal_text     end     as goal_text,
  case when f.me or f.v_interests           then p.interests     end     as interests,
  (select count(*) from public.social_follows x where x.following_id = p.user_id)::int as followers,
  (select count(*) from public.social_follows x where x.follower_id  = p.user_id)::int as following,
  exists (select 1 from public.social_follows x where x.follower_id = auth.uid() and x.following_id = p.user_id) as i_follow,
  exists (select 1 from public.social_follows x where x.follower_id = p.user_id and x.following_id = auth.uid()) as follows_me
from public.social_profiles p
cross join lateral (
  select
    (p.user_id = auth.uid())                                        as me,
    coalesce((p.visibility ->> 'leaderboard')::boolean, false)      as v_lb,
    coalesce((p.visibility ->> 'xp')::boolean,          false)      as v_xp,
    coalesce((p.visibility ->> 'streak')::boolean,      false)      as v_streak,
    coalesce((p.visibility ->> 'badges')::boolean,      false)      as v_badges,
    coalesce((p.visibility ->> 'clar_time')::boolean,   false)      as v_time,
    coalesce((p.visibility ->> 'goal')::boolean,        false)      as v_goal,
    coalesce((p.visibility ->> 'interests')::boolean,   false)      as v_interests
) f
where auth.uid() is not null
  and ( p.user_id = auth.uid()
        or not exists (
          select 1 from public.social_blocks b
          where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
             or (b.blocked_id = auth.uid() and b.blocker_id = p.user_id)));

-- ── 8. VIEW: the feed = my own + people I follow, achievements only ─────────
create or replace view public.social_feed as
select
  a.id, a.user_id, a.badge_id, a.created_at,
  pp.handle, pp.display_name, pp.avatar_url,
  (select count(*) from public.social_cheers c where c.activity_id = a.id)::int as cheers,
  exists (select 1 from public.social_cheers c where c.activity_id = a.id and c.user_id = auth.uid()) as i_cheered
from public.social_activity a
join public.social_public_profiles pp on pp.user_id = a.user_id      -- inherits the block filter
where auth.uid() is not null
  and pp.badges is not null                                          -- owner must have badges public (or be me)
  and ( a.user_id = auth.uid()
        or exists (select 1 from public.social_follows f where f.follower_id = auth.uid() and f.following_id = a.user_id));

-- views: signed-in users only (never anon), service_role for support/debugging
revoke all on public.social_public_profiles from anon, public;
revoke all on public.social_feed            from anon, public;
grant select on public.social_public_profiles to authenticated, service_role;
grant select on public.social_feed            to authenticated, service_role;

-- Ask PostgREST to pick up the new tables/views immediately
notify pgrst, 'reload schema';

-- ═══ TO LAUNCH (when you are ready — everyone then sees the header button): ═══
--   update public.feature_flags set enabled = true, updated_at = now() where key = 'social_layer';
-- TO TURN OFF AGAIN:
--   update public.feature_flags set enabled = false, updated_at = now() where key = 'social_layer';
