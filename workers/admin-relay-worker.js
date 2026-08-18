/* ═══════════════════════════════════════════════════════════════════
   Clarvoyance — Admin Write Relay (Cloudflare Worker)
   Deploy: paste this whole file into a new Cloudflare Worker (dashboard
   → Workers & Pages → Create → paste into the editor → Deploy), same way
   the existing Sheets/Gemini workers were set up.

   Required Worker secrets (Settings → Variables → encrypt):
     ADMIN_TOKEN          — shared secret admin.html must send. Use the
                             value given alongside this file; do not reuse
                             it anywhere else, and never commit it to git.
     SUPABASE_SERVICE_KEY — Supabase service_role key (Project Settings →
                             API → service_role, "secret" one, NOT anon).
                             This key bypasses RLS entirely — it must only
                             ever live here, never in any client-side file.

   Purpose: admin.html previously wrote directly to Supabase using the
   public anon key, which required opening ai_context/admin_commands/
   admin_insights/tools/chargers to anon writes — meaning anyone who
   extracted that anon key (trivial; it's already client-side in the main
   app) could rewrite Clar's live prompts. This worker is the only thing
   that holds real write credentials now; admin.html calls it instead of
   Supabase directly, and the matching db/schema_v178_*.sql migration
   revokes the anon grants this worker replaces.
   ═══════════════════════════════════════════════════════════════════ */

const SB_URL = 'https://unvwjuceuyruqdnmvxlc.supabase.co';

/* Only these tables may be touched by the generic ai_best_for updater —
   an allowlist even though the request is already token-gated, so a
   leaked/misused token still can't be pointed at an arbitrary table. */
const ALLOWED_CONTENT_TABLES = ['tools', 'chargers'];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function sbFetch(env, path, init = {}) {
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    ...init,
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) throw new Error((data && data.message) || ('Supabase error ' + res.status));
  return data;
}

const ACTIONS = {
  async 'ai_context.upsert'(env, p) {
    return sbFetch(env, 'ai_context?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'ai_context.delete'(env, p) {
    if (!p.key) throw new Error('key required');
    return sbFetch(env, 'ai_context?key=eq.' + encodeURIComponent(p.key), { method: 'DELETE' });
  },
  async 'content.updateAiBestFor'(env, p) {
    if (!ALLOWED_CONTENT_TABLES.includes(p.table)) throw new Error('table not allowed');
    if (!p.id) throw new Error('id required');
    return sbFetch(env, p.table + '?id=eq.' + encodeURIComponent(p.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ai_best_for: p.text || '' }),
    });
  },
  async 'admin_commands.select'(env) {
    return sbFetch(env, 'admin_commands?select=*&order=id.desc');
  },
  async 'admin_commands.insert'(env, p) {
    return sbFetch(env, 'admin_commands', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ type: p.type, text: p.text }),
    });
  },
  async 'admin_commands.update'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'admin_commands?id=eq.' + encodeURIComponent(p.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(p.fields || {}),
    });
  },
  async 'admin_commands.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'admin_commands?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
  },
  async 'admin_insights.select'(env, p) {
    var limit = parseInt(p && p.limit, 10) || 50;
    var q = 'admin_insights?select=*&order=id.desc&limit=' + limit;
    if (p && p.insight_key) q += '&insight_key=eq.' + encodeURIComponent(p.insight_key);
    return sbFetch(env, q);
  },

  /* v181: chargers/charger_categories/charger_rules/tools CRUD from
     admin.html — previously went to Google Sheets, which the live app
     (index.html) no longer reads unless Supabase itself is down, so admin
     edits were silently invisible to real users. Same upsert-by-id /
     delete-by-id pattern as ai_context above, just one handler pair per
     table (id is always the primary key text/int column on each table). */
  async 'chargers.upsert'(env, p) {
    return sbFetch(env, 'chargers?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'chargers.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'chargers?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
  },
  async 'charger_categories.upsert'(env, p) {
    return sbFetch(env, 'charger_categories?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'charger_categories.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'charger_categories?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
  },
  async 'charger_rules.upsert'(env, p) {
    return sbFetch(env, 'charger_rules?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'charger_rules.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'charger_rules?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
  },
  async 'tools.upsert'(env, p) {
    return sbFetch(env, 'tools?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'tools.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'tools?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
  },

  /* v182: feature_gates — admin-adjustable AI usage limits (free vs
     premium, per feature). Composite primary key (feature_key, tier),
     so on_conflict names both columns. See db/schema_v182_feature_gates.sql. */
  async 'feature_gates.select'(env) {
    return sbFetch(env, 'feature_gates?select=*&order=feature_key.asc,tier.asc');
  },
  async 'feature_gates.upsert'(env, p) {
    return sbFetch(env, 'feature_gates?on_conflict=feature_key,tier', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'feature_gates.delete'(env, p) {
    if (!p.feature_key || !p.tier) throw new Error('feature_key and tier required');
    return sbFetch(env, 'feature_gates?feature_key=eq.' + encodeURIComponent(p.feature_key)
      + '&tier=eq.' + encodeURIComponent(p.tier), { method: 'DELETE' });
  },

  /* v182: manual tier assignment — no payment webhook exists yet, so the
     owner grants/changes a specific account's tier by email from
     admin.html until Razorpay integration lands. */
  async 'user_profile.findByEmail'(env, p) {
    if (!p.email) throw new Error('email required');
    /* order by updated_at desc: when the same self-entered email matches
       multiple accounts (a real, confirmed case — leftover fragmented
       accounts from before the manual-linking fix), the most recently
       active one sorts first, so the admin UI isn't guessing blind. */
    return sbFetch(env, 'user_profile?select=user_id,email,nick,subscription_tier,updated_at&email=eq.'
      + encodeURIComponent(p.email) + '&order=updated_at.desc');
  },
  async 'user_profile.setTier'(env, p) {
    if (!p.user_id) throw new Error('user_id required');
    if (!p.tier) throw new Error('tier required');
    return sbFetch(env, 'user_profile?user_id=eq.' + encodeURIComponent(p.user_id), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ subscription_tier: p.tier }),
    });
  },
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '');
    if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
      return json({ error: 'unauthorized' }, 401);
    }

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'invalid JSON' }, 400); }

    const handler = ACTIONS[body.action];
    if (!handler) return json({ error: 'unknown action: ' + body.action }, 400);

    try {
      const data = await handler(env, body.payload || {});
      return json({ data });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
