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

   v184 — push notifications. Two more secrets, both generated once and
   never rotated unless compromised (rotating invalidates every existing
   subscription, which would need everyone to re-subscribe):
     VAPID_PRIVATE_KEY_JWK — the VAPID signing key, as a JWK JSON string.
                             Server-side only, same rule as SUPABASE_SERVICE_KEY.
     VAPID_SUBJECT         — a mailto: or https: contact URL, e.g.
                             'mailto:you@example.com' — required by the
                             Web Push spec, shown to push services only.
   The matching VAPID_PUBLIC_KEY is NOT a secret (it's meant to be public —
   it's the applicationServerKey the client uses to subscribe) — it does
   NOT need a Worker variable entry; it's hardcoded as a const below
   (search VAPID_PUBLIC_KEY) and separately embedded in the client HTML
   as window.CLV_VAPID_PUBLIC_KEY. Both must stay the exact same value.

   Also needs a Cron Trigger added (dashboard → this Worker → Triggers →
   Cron Triggers → Add), schedule "0,15,30,45 * * * *" (fires at :00, :15,
   :30 and :45 every hour) — this is what actually runs the notification
   rule engine; without it, scheduled() below never fires and nothing
   gets sent.

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

/* v184/fix: not a secret — this is the public half of the VAPID keypair,
   the same value embedded in index.html as window.CLV_VAPID_PUBLIC_KEY.
   Hardcoded here (rather than read from env.VAPID_PUBLIC_KEY) so it
   doesn't need its own dashboard entry — only VAPID_PRIVATE_KEY_JWK
   (the actual secret) needs to be set as a Worker variable. */
const VAPID_PUBLIC_KEY = 'BHp8v_x-FNtbuG3HMYyZ7Z6cIJ9HoPydch4thpicFDUUL9iJSyaH0nRgDnRz84AGSkaX-K2h0tNW-cK9xM-DzZE';

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

/* ═══ v184 — Web Push (RFC 8291 payload encryption + RFC 8292 VAPID auth),
   implemented with only the standard Web Crypto API (btoa/atob/crypto.subtle) —
   no npm package, so this stays a single paste-into-dashboard file like the
   rest of this project. Verified correct via a real encrypt→decrypt round
   trip against these exact functions before shipping, not just written and
   assumed. ═══ */
function b64url(buf) {
  let str = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function concatBytes(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}
async function hmacSha256(keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, dataBytes));
}
async function hkdfExpand(prk, info, length) {
  const t1 = await hmacSha256(prk, concatBytes(info, new Uint8Array([1])));
  return t1.slice(0, length);
}

/* Encrypts one push payload for one subscription (RFC 8291 aes128gcm). */
async function encryptWebPush(plaintextStr, uaPublicB64url, authSecretB64url) {
  const uaPublicRaw = unb64url(uaPublicB64url);
  const authSecret = unb64url(authSecretB64url);

  const uaPublicKey = await crypto.subtle.importKey('raw', uaPublicRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const asKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey));

  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPublicKey }, asKeyPair.privateKey, 256));

  const keyInfo = concatBytes(new TextEncoder().encode('WebPush: info\0'), uaPublicRaw, asPublicRaw);
  const prkKey = await hmacSha256(authSecret, sharedSecret); // HKDF-Extract(salt=authSecret, ikm=sharedSecret)
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmacSha256(salt, ikm); // HKDF-Extract(salt, ikm)
  const cek = await hkdfExpand(prk, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  const padded = concatBytes(new TextEncoder().encode(plaintextStr), new Uint8Array([2])); // 0x02 = last-record delimiter

  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, cekKey, padded));

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  const header = concatBytes(salt, recordSize, new Uint8Array([asPublicRaw.length]), asPublicRaw);
  return concatBytes(header, ciphertext);
}

/* Builds the VAPID ES256 JWT + sends one encrypted push to one subscription.
   Returns {status:'sent'} / {status:'gone'} (expired/revoked — caller should
   delete the subscription) / throws on any other failure. */
async function sendWebPush(env, subscription, payloadObj) {
  /* Fail with a diagnostic message instead of a cryptic JSON.parse error
     when a secret is genuinely missing from this Worker's environment —
     JSON.parse(undefined) coerces to JSON.parse("undefined") and throws
     '"undefined" is not valid JSON", which gives no hint which secret
     is the actual problem. */
  if (!env.VAPID_PRIVATE_KEY_JWK) {
    throw new Error('VAPID_PRIVATE_KEY_JWK secret is not set on this Worker (Settings → Variables and Secrets)');
  }
  if (!env.VAPID_SUBJECT) {
    throw new Error('VAPID_SUBJECT secret is not set on this Worker (Settings → Variables and Secrets)');
  }
  const aud = new URL(subscription.endpoint).origin;
  const vapidPriv = await crypto.subtle.importKey(
    'jwk', JSON.parse(env.VAPID_PRIVATE_KEY_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const header = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT,
  })));
  const signingInput = header + '.' + claims;
  const sig = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, vapidPriv, new TextEncoder().encode(signingInput)
  ));
  const jwt = signingInput + '.' + b64url(sig);

  const body = await encryptWebPush(JSON.stringify(payloadObj), subscription.p256dh, subscription.auth);

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Authorization': 'vapid t=' + jwt + ', k=' + VAPID_PUBLIC_KEY,
    },
    body,
  });
  if (res.status === 404 || res.status === 410) return { status: 'gone' };
  if (!res.ok) throw new Error('push send failed: HTTP ' + res.status);
  return { status: 'sent' };
}

/* ═══ v184 — notification rule engine, run on a Cron Trigger (see header
   comment). Every timing/repeat/cap knob comes from the notification_rules
   row, not from code — adding a third rule of either existing type never
   needs a redeploy. ═══ */
function nowInTz(tz) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(new Date());
  const hh = parts.find(p => p.type === 'hour').value;
  const mm = parts.find(p => p.type === 'minute').value;
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.find(p => p.type === 'weekday').value];
  return { hhmm: hh + ':' + mm, isoWeekday: wd };
}
function minutesSinceMidnight(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/* Checks notification_send_log for this rule+user against cooldown_minutes
   and the day/week/month caps — the actual enforcement, not just a log. */
async function capsOk(env, rule, user_id) {
  if (rule.cooldown_minutes) {
    const since = new Date(Date.now() - rule.cooldown_minutes * 60000).toISOString();
    const recent = await sbFetch(env, 'notification_send_log?select=id&rule_id=eq.' + rule.id
      + '&user_id=eq.' + encodeURIComponent(user_id) + '&sent_at=gt.' + encodeURIComponent(since)
      + '&status=eq.sent&limit=1');
    if (recent.length) return false;
  }
  const capChecks = [
    [rule.max_sends_per_day, 24 * 60],
    [rule.max_sends_per_week, 7 * 24 * 60],
    [rule.max_sends_per_month, 30 * 24 * 60],
  ];
  for (const [cap, minutes] of capChecks) {
    if (!cap) continue;
    const since = new Date(Date.now() - minutes * 60000).toISOString();
    const rows = await sbFetch(env, 'notification_send_log?select=id&rule_id=eq.' + rule.id
      + '&user_id=eq.' + encodeURIComponent(user_id) + '&sent_at=gt.' + encodeURIComponent(since)
      + '&status=eq.sent');
    if (rows.length >= cap) return false;
  }
  return true;
}

async function sendToSubscription(env, rule, sub) {
  const payload = { title: rule.title, body: rule.body, target_tab: rule.target_tab || null };
  try {
    if (sub.platform !== 'web') {
      /* Android/iOS native tokens land here once Capacitor push is built
         (v184 is web-only) — logged rather than silently dropped, so a
         subscribed native device isn't a silent no-op forever. */
      await sbFetch(env, 'notification_send_log', {
        method: 'POST', body: JSON.stringify({ rule_id: rule.id, user_id: sub.user_id, status: 'skipped_native_not_implemented' }),
      });
      return { user_id: sub.user_id, status: 'skipped_native_not_implemented' };
    }
    const result = await sendWebPush(env, sub, payload);
    await sbFetch(env, 'notification_send_log', {
      method: 'POST', body: JSON.stringify({ rule_id: rule.id, user_id: sub.user_id, status: result.status }),
    });
    if (result.status === 'gone') {
      await sbFetch(env, 'user_push_subscriptions?id=eq.' + sub.id, { method: 'DELETE' });
    }
    return { user_id: sub.user_id, status: result.status };
  } catch (e) {
    await sbFetch(env, 'notification_send_log', {
      method: 'POST', body: JSON.stringify({ rule_id: rule.id, user_id: sub.user_id, status: 'failed', error: String(e.message || e) }),
    }).catch(() => {});
    return { user_id: sub.user_id, status: 'failed', error: e.message };
  }
}

/* schedule-type: broadcasts to every subscribed user when the current
   time (in the rule's own timezone) falls in this tick's window. */
async function runScheduleRule(env, rule) {
  const { hhmm, isoWeekday } = nowInTz(rule.timezone || 'Asia/Kolkata');
  if (Array.isArray(rule.days_of_week) && rule.days_of_week.length && !rule.days_of_week.includes(isoWeekday)) return [];
  const curMin = minutesSinceMidnight(hhmm);
  const matches = (rule.schedule_times || []).some(t => {
    const tMin = minutesSinceMidnight(t);
    return curMin >= tMin && curMin < tMin + 15; // matches this 15-min cron tick's window
  });
  if (!matches) return [];

  const subs = await sbFetch(env, 'user_push_subscriptions?select=*');
  const out = [];
  for (const sub of subs) {
    if (!(await capsOk(env, rule, sub.user_id))) continue;
    out.push(await sendToSubscription(env, rule, sub));
  }
  return out;
}

/* inactivity-type: per-user check against last_clar_active_at / last_app_active_at
   on user_progress (see schema_v184_notifications.sql). */
async function runInactivityRule(env, rule) {
  const col = rule.signal_source === 'app' ? 'last_app_active_at' : 'last_clar_active_at';
  const minCol = rule.signal_source === 'app' ? 'app_daily_min' : 'clar_daily_min';
  const thresholdIso = new Date(Date.now() - (rule.inactivity_threshold_minutes || 120) * 60000).toISOString();

  const rows = await sbFetch(env, 'user_progress?select=user_id,' + col + ',' + minCol
    + '&' + col + '=not.is.null&' + col + '=lt.' + encodeURIComponent(thresholdIso));
  const out = [];
  for (const row of rows) {
    if (rule.min_prior_engagement_minutes && (row[minCol] || 0) < rule.min_prior_engagement_minutes) continue;
    if (!(await capsOk(env, rule, row.user_id))) continue;
    const subs = await sbFetch(env, 'user_push_subscriptions?select=*&user_id=eq.' + encodeURIComponent(row.user_id));
    for (const sub of subs) out.push(await sendToSubscription(env, rule, sub));
  }
  return out;
}

async function evaluateAndSendAll(env) {
  const rules = await sbFetch(env, 'notification_rules?select=*&enabled=eq.true');
  const results = [];
  for (const rule of rules) {
    try {
      const out = rule.trigger_type === 'schedule' ? await runScheduleRule(env, rule) : await runInactivityRule(env, rule);
      results.push(...out.map(r => ({ rule: rule.name, ...r })));
    } catch (e) {
      results.push({ rule: rule.name, status: 'rule_error', error: e.message });
    }
  }
  return results;
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

  /* v211: video_seed_topics — admin-managed "always seed a bit of this"
     video topics (e.g. Abraham Hicks / Law of Attraction content), shown
     to users as pre-toggled-on chips in a dedicated "Admin Recommended"
     section of My Interests, so they're visible and opt-out-able rather
     than silently injected. See db/schema_v211_video_seed_topics.sql. */
  async 'video_seed_topics.select'(env) {
    return sbFetch(env, 'video_seed_topics?select=*&order=label.asc');
  },
  async 'video_seed_topics.upsert'(env, p) {
    return sbFetch(env, 'video_seed_topics?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'video_seed_topics.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'video_seed_topics?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
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

  /* v184 — push notification rule CRUD for admin.html's new Notifications
     tab. Same upsert-by-id / delete-by-id pattern as every other table above. */
  async 'notification_rules.select'(env) {
    return sbFetch(env, 'notification_rules?select=*&order=id.asc');
  },
  async 'notification_rules.upsert'(env, p) {
    return sbFetch(env, 'notification_rules?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  async 'notification_rules.delete'(env, p) {
    if (!p.id) throw new Error('id required');
    return sbFetch(env, 'notification_rules?id=eq.' + encodeURIComponent(p.id), { method: 'DELETE' });
  },
  async 'notification_send_log.select'(env, p) {
    var limit = parseInt(p && p.limit, 10) || 50;
    var q = 'notification_send_log?select=*&order=id.desc&limit=' + limit;
    if (p && p.rule_id) q += '&rule_id=eq.' + encodeURIComponent(p.rule_id);
    return sbFetch(env, q);
  },
  /* Sends one real push immediately, outside the rule engine, so the owner
     can verify end-to-end delivery from admin.html without waiting for a
     cron tick or a real trigger condition. Targets a user by email — same
     lookup pattern as user_profile.findByEmail above. */
  async 'notifications.testSend'(env, p) {
    if (!p.email) throw new Error('email required');
    const users = await sbFetch(env, 'user_profile?select=user_id,email&email=eq.'
      + encodeURIComponent(p.email) + '&order=updated_at.desc&limit=1');
    if (!users.length) throw new Error('no user found with that email');
    const subs = await sbFetch(env, 'user_push_subscriptions?select=*&user_id=eq.' + encodeURIComponent(users[0].user_id));
    if (!subs.length) throw new Error('that user has no push subscription registered (they need to enable Reminders in Profile first)');
    const payload = { title: p.title || 'Test notification', body: p.body || 'This is a test push from admin.html.', target_tab: p.target_tab || null };
    const results = [];
    for (const sub of subs) {
      if (sub.platform !== 'web') { results.push('skipped_native_not_implemented'); continue; }
      const r = await sendWebPush(env, sub, payload);
      results.push(r.status);
    }
    return { sent_to_devices: subs.length, results };
  },

  /* v186 — Engagement Engine config CRUD for admin.html's new "📊 Engagement"
     tab. Both tables are public-SELECT for the main app (like feature_gates)
     but writes still go through this relay, same lockdown pattern as
     everything since v178. */
  async 'section_engagement_targets.select'(env) {
    return sbFetch(env, 'section_engagement_targets?select=*&order=section.asc');
  },
  async 'section_engagement_targets.upsert'(env, p) {
    return sbFetch(env, 'section_engagement_targets?on_conflict=section', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
    });
  },
  /* engagement_settings is a single-row table (id is always literally
     `true`) — select just returns that one row, upsert always targets it. */
  async 'engagement_settings.select'(env) {
    return sbFetch(env, 'engagement_settings?select=*&limit=1');
  },
  async 'engagement_settings.upsert'(env, p) {
    p.id = true;
    return sbFetch(env, 'engagement_settings?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(p),
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

  /* v184 — Cron Trigger entry point (see header comment for the schedule
     to add in the dashboard). Not token-gated like fetch() above — Cron
     Triggers invoke this directly, there's no incoming request to check. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(evaluateAndSendAll(env));
  },
};
