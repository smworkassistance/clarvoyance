-- ═══════════════════════════════════════════════════════════════════════════
-- v244 — Community: general posts, real comments, richer achievement sharing
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
--
-- DESIGN
--  * social_achievements is extended, not replaced, to also carry a
--    Facebook-style free post (text + photos, no goal attached): `title`
--    becomes nullable (an achievement share still sets it; a plain post
--    leaves it null) and a new `message` column carries the longer body
--    text either kind of post can have. A check constraint stops a
--    genuinely empty post (no title, no message, no images) from being
--    created either way.
--  * social_comments (schema-only since v243) now actually ships: its
--    read policy was deliberately narrow (own rows) until real UI +
--    audience logic existed. It now gets the same self+follows masking
--    view pattern as social_achievement_feed/social_public_profiles —
--    still nobody's comment is ever exposed to someone who can't already
--    see the post it's on.
--  * social_achievement_feed gains a `comments` count column (same
--    pattern as the existing `cheers` count) so the feed can show
--    "💬 3" without a second round-trip per post.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. social_achievements: nullable title + new message column ───────────
alter table public.social_achievements alter column title drop not null;
alter table public.social_achievements add column if not exists message text;
alter table public.social_achievements drop constraint if exists sach_message_len;
alter table public.social_achievements add constraint sach_message_len check (message is null or char_length(message) <= 2000);
alter table public.social_achievements drop constraint if exists sach_not_empty;
alter table public.social_achievements add constraint sach_not_empty check (
  (title is not null and char_length(title) > 0)
  or (message is not null and char_length(message) > 0)
  or jsonb_array_length(images) > 0
);

-- ── 2. VIEW: comments feed — visible to whoever can see the underlying
--       achievement/post (self + the people who follow them), same audience
--       social_achievement_feed already uses. ──────────────────────────────
create or replace view public.social_comments_feed as
select
  c.id, c.target_type, c.target_id, c.user_id, c.body, c.created_at,
  pp.handle, pp.display_name, pp.avatar_url
from public.social_comments c
join public.social_public_profiles pp on pp.user_id = c.user_id   -- inherits the block filter
where auth.uid() is not null
  and c.target_type = 'achievement'
  and exists (
    select 1 from public.social_achievements a
    where a.id = c.target_id
      and ( a.user_id = auth.uid()
            or exists (select 1 from public.social_follows f where f.follower_id = auth.uid() and f.following_id = a.user_id))
  );

revoke all on public.social_comments_feed from anon, public;
grant select on public.social_comments_feed to authenticated, service_role;

-- ── 3. social_achievement_feed: add message + a comments count alongside
--       cheers — both appended AFTER every pre-existing column in its
--       original order. Postgres's CREATE OR REPLACE VIEW can only add
--       columns at the end; it errors (42P16) if an existing column's
--       position shifts, which splicing `message` in earlier already hit. ──
create or replace view public.social_achievement_feed as
select
  a.id, a.user_id, a.title, a.images, a.date_set, a.date_achieved, a.created_at,
  pp.handle, pp.display_name, pp.avatar_url,
  (select count(*) from public.social_reactions r where r.target_type='achievement' and r.target_id=a.id)::int as cheers,
  exists (select 1 from public.social_reactions r where r.target_type='achievement' and r.target_id=a.id and r.user_id=auth.uid()) as i_cheered,
  a.message,
  (select count(*) from public.social_comments c where c.target_type='achievement' and c.target_id=a.id)::int as comments
from public.social_achievements a
join public.social_public_profiles pp on pp.user_id = a.user_id   -- inherits the block filter
where auth.uid() is not null
  and ( a.user_id = auth.uid()
        or exists (select 1 from public.social_follows f where f.follower_id = auth.uid() and f.following_id = a.user_id));

revoke all on public.social_achievement_feed from anon, public;
grant select on public.social_achievement_feed to authenticated, service_role;

notify pgrst, 'reload schema';
