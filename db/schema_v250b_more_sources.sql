-- v250b — more allow-listed feeds so each guide has a wider pool of real sources (all verified: HTTP 200 with items on 2026-09-25).
-- Additive and idempotent: safe to run more than once. Editable later from admin.html → 🧭 Guides → Source allowlist.
insert into public.guide_sources (name, url, tags) values
  ('Mark Manson',        'https://markmanson.net/feed',              '{growth,wisdom,relationships,positivity}'),
  ('Gottman Institute',  'https://www.gottman.com/blog/feed/',       '{relationships,peace}'),
  ('Entrepreneur',       'https://www.entrepreneur.com/latest.rss',  '{business,startup}'),
  ('Ryan Holiday',       'https://ryanholiday.net/feed/',            '{wisdom,thinking,habits}'),
  ('Art of Manliness',   'https://www.artofmanliness.com/feed/',     '{habits,growth,wisdom}'),
  ('Develop Good Habits','https://www.developgoodhabits.com/feed/',  '{habits,growth,positivity}'),
  ('Happier Human',      'https://www.happierhuman.com/feed/',       '{positivity,mindfulness,growth,peace}')
on conflict (url) do nothing;
