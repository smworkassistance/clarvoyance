-- ═══════════════════════════════════════════════════════════════════
-- v260 — PLANS, SUBSCRIPTIONS, PAYMENTS, WAITLIST (NOT RUN YET — owner runs it in the Supabase SQL editor)
--
-- Design goals (owner, 2026-10-02):
--   * pricing is DATA, not code: plans/limits/XP-discount rules live in tables (seeded from pricing/plans.json)
--   * gateway-agnostic: Razorpay today, anything tomorrow — `provider` + `provider_*_id` columns, raw payload kept
--   * several apps/products in one database: every row carries product_id ('clar' now)
--   * staff can see any member's subscription status (admin_subscription_overview, service_role only; the
--     admin-relay Worker exposes it later) without any client ever being able to grant itself a plan
--   * the client can NEVER write subscriptions/payments (no INSERT/UPDATE policy for anon/authenticated):
--     only a Worker holding the service_role key (payment webhook / admin) changes them.
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT everywhere).
-- ═══════════════════════════════════════════════════════════════════

-- 1. products ------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  currency    text NOT NULL DEFAULT 'INR',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO products (id, name) VALUES ('clar', 'Clar') ON CONFLICT (id) DO NOTHING;

-- 2. plans (the rate chart) -----------------------------------------
-- limits: {"clar_chat_per_day":20,"goal_images":8,...}  null = unlimited, 0 = not included. New limit = new key, no migration.
CREATE TABLE IF NOT EXISTS plans (
  product_id           text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  id                   text NOT NULL,
  name                 text NOT NULL,
  tagline              text NOT NULL DEFAULT '',
  price_monthly        numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
  xp_discount_cap_pct  numeric(5,2) NOT NULL DEFAULT 0 CHECK (xp_discount_cap_pct BETWEEN 0 AND 100),
  badge                text,
  limits               jsonb NOT NULL DEFAULT '{}'::jsonb,
  features             jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort                 int NOT NULL DEFAULT 0,
  active               boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, id)
);

-- XP-discount rules, one row per product (same shape as pricing/plans.json -> xp_discount)
CREATE TABLE IF NOT EXISTS plan_settings (
  product_id   text PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  xp_discount  jsonb NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO plans (product_id, id, name, tagline, price_monthly, xp_discount_cap_pct, badge, limits, features, sort) VALUES
 ('clar','free','Free','Everything that builds the daily habit',0,0,NULL,
  '{"clar_chat_per_day":8,"fortune_progress_charts":2,"goal_images":5,"universal_guides":2,"private_guides":0,"private_guide_posts_per_week":0,"ai_fortune_reading":false,"ai_pulse_reflection":false}',
  '["Vibe feed with videos, quotes and photo cards","Chargers and Tools","Non-Negotiables","Goals with 5 vision images","Self practices","Community: follow, share, cheer","Clar AI: 8 messages a day","2 progress charts","2 universal guides"]',1),
 ('clar','plus','Plus','More of Clar, every day',99,50,'Most popular',
  '{"clar_chat_per_day":20,"fortune_progress_charts":null,"goal_images":8,"universal_guides":4,"private_guides":3,"private_guide_posts_per_week":3,"ai_fortune_reading":false,"ai_pulse_reflection":false}',
  '["Everything in Free","Clar AI: 20 messages a day","All progress charts (Fortune, Pulse numbers)","Goals with 8 vision images","4 universal guides","3 guides made just for you"]',2),
 ('clar','pro','Pro','Clar reads your progress and guides you',199,25,'Everything',
  '{"clar_chat_per_day":60,"fortune_progress_charts":null,"goal_images":12,"universal_guides":8,"private_guides":5,"private_guide_posts_per_week":3,"ai_fortune_reading":true,"ai_pulse_reflection":true}',
  '["Everything in Plus","Clar AI: 60 messages a day","Fortune report card with AI suggestions on your progress","Weekly AI reflection (Pulse)","Goals with 12 vision images","8 universal guides","5 guides made just for you","Early access to new features"]',3)
ON CONFLICT (product_id, id) DO NOTHING;

INSERT INTO plan_settings (product_id, xp_discount) VALUES
 ('clar','{"daily_cap":250,"base_target":5000,"ratchet":1.15,"ratchet_window_months":2,"max_target":7000,"invite":{"xp_each":100,"min_engaged_days":3}}')
ON CONFLICT (product_id) DO NOTHING;

-- 3. subscriptions (one live row per user+product; written ONLY by service_role) -------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id                text NOT NULL REFERENCES products(id),
  plan_id                   text NOT NULL,
  status                    text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','canceled','expired')),
  source                    text NOT NULL DEFAULT 'gateway' CHECK (source IN ('gateway','admin_grant','promo')),
  provider                  text,                     -- 'razorpay' | 'stripe' | ... (any gateway)
  provider_customer_id      text,
  provider_subscription_id  text,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean NOT NULL DEFAULT false,
  list_price                numeric(10,2),            -- price before the XP discount
  xp_discount_pct           numeric(5,2) NOT NULL DEFAULT 0,
  amount_charged            numeric(10,2),            -- what the gateway actually charged this period
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id, plan_id) REFERENCES plans(product_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_live ON subscriptions (user_id, product_id) WHERE status IN ('active','trialing','past_due');
CREATE INDEX IF NOT EXISTS subscriptions_provider_ref ON subscriptions (provider, provider_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_period_end ON subscriptions (current_period_end);

-- 4. payments (gateway events, append-only, service_role writes) -------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,   -- keep the financial record if the account is deleted
  subscription_id       uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  product_id            text NOT NULL DEFAULT 'clar',
  provider              text NOT NULL,
  provider_payment_id   text NOT NULL,
  amount_minor          bigint NOT NULL,          -- paise / cents
  currency              text NOT NULL DEFAULT 'INR',
  status                text NOT NULL CHECK (status IN ('created','authorized','captured','failed','refunded')),
  raw                   jsonb,                    -- the gateway's webhook payload, for audits and disputes
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)          -- webhooks are retried: makes them idempotent
);

-- 5. waitlist for the fake-door test (anon may INSERT only) --------------------------------------
CREATE TABLE IF NOT EXISTS plan_waitlist (
  id          bigserial PRIMARY KEY,
  email       text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' AND length(email) <= 254),
  plan_id     text NOT NULL CHECK (length(plan_id) <= 40),
  product_id  text NOT NULL DEFAULT 'clar',
  source      text NOT NULL DEFAULT 'landing' CHECK (length(source) <= 40),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS plan_waitlist_unique ON plan_waitlist (lower(email), plan_id, product_id);

-- 6. entitlement lookup: what plan does THIS user have right now? (used by the app and, later, the Gemini proxy) --------
CREATE OR REPLACE FUNCTION my_plan(p_product text DEFAULT 'clar')
RETURNS TABLE (plan_id text, status text, current_period_end timestamptz, xp_discount_pct numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.plan_id, s.status, s.current_period_end, s.xp_discount_pct
    FROM subscriptions s
   WHERE s.user_id = auth.uid() AND s.product_id = p_product
     AND s.status IN ('active','trialing','past_due')
     AND (s.current_period_end IS NULL OR s.current_period_end > now())
   ORDER BY s.created_at DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION my_plan(text) FROM public;
GRANT EXECUTE ON FUNCTION my_plan(text) TO authenticated;

-- 7. staff overview (service_role only): member + plan + status + renewal in one row ---------------
CREATE OR REPLACE VIEW admin_subscription_overview AS
SELECT s.id, s.product_id, s.user_id, up.email, up.nick AS name, s.plan_id, s.status, s.source, s.provider,
       s.current_period_end, s.cancel_at_period_end, s.list_price, s.xp_discount_pct, s.amount_charged, s.created_at
  FROM subscriptions s
  LEFT JOIN user_profile up ON up.user_id = s.user_id;
REVOKE ALL ON admin_subscription_overview FROM public, anon, authenticated;
GRANT SELECT ON admin_subscription_overview TO service_role;

-- 8. security: RLS + grants (explicit service_role grants are a standing need on this project) ---------
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_waitlist  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read products" ON products;
CREATE POLICY "public read products" ON products FOR SELECT USING (active);
DROP POLICY IF EXISTS "public read plans" ON plans;
CREATE POLICY "public read plans" ON plans FOR SELECT USING (active);
DROP POLICY IF EXISTS "public read plan_settings" ON plan_settings;
CREATE POLICY "public read plan_settings" ON plan_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "own subscriptions" ON subscriptions;
CREATE POLICY "own subscriptions" ON subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "own payments" ON payments;
CREATE POLICY "own payments" ON payments FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "anyone can join the waitlist" ON plan_waitlist;
CREATE POLICY "anyone can join the waitlist" ON plan_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT ON products, plans, plan_settings TO anon, authenticated;
GRANT SELECT ON subscriptions, payments TO authenticated;          -- RLS limits to own rows; no INSERT/UPDATE/DELETE for clients
GRANT INSERT ON plan_waitlist TO anon, authenticated;              -- insert only: nobody but staff can read the emails
GRANT USAGE, SELECT ON SEQUENCE plan_waitlist_id_seq TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products, plans, plan_settings, subscriptions, payments, plan_waitlist TO service_role;

INSERT INTO admin_commands (type, text)
SELECT 'feature', 'Plans & subscriptions (v260) -- the rate chart lives in the plans table (limits is a jsonb: a new limit is just a new key), XP-discount rules in plan_settings, every member''s plan in subscriptions, every gateway event in payments (idempotent on provider+payment id). Clients can only READ their own subscription; only a Worker with the service_role key (payment webhook / admin) can change one. Waitlist = anon insert-only. admin_subscription_overview shows member + plan + status + renewal for staff. my_plan() returns the caller''s live plan (for the app and the Gemini proxy).'
WHERE NOT EXISTS (SELECT 1 FROM admin_commands WHERE type='feature' AND text LIKE 'Plans & subscriptions (v260)%');

NOTIFY pgrst, 'reload schema';
