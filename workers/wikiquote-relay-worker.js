/* ═══════════════════════════════════════════════════════════════════
  Clarvoyance — Wikiquote Relay (Cloudflare Worker)
  Deploy as a NEW Worker (e.g. "clar-wikiquote") — dashboard → Workers &
  Pages → Create → paste this file → Deploy.

  Required Worker secret:
    SUPABASE_SERVICE_KEY — Supabase service_role key (Project Settings →
                            API → service_role). Bypasses RLS — server-
                            side only, same rule as every other worker.

  Deliberately NOT token-gated like admin-relay-worker.js — called from
  the main app by every regular user, not a private admin action.

  Why this exists (v216, replacing the abandoned v215 approach): v215
  tried a one-time bulk import of ~20,814 quotes as literal SQL INSERT
  rows — a 4MB migration file that made the migration itself unworkable
  to ever safely read/edit/verify again, and is why that version was
  scrapped. Instead, this Worker fetches REAL quotes LIVE from
  Wikiquote's free, keyless, CC BY-SA public API on demand (author name
  or topic word), parses the real wikitext, and caches the result in
  Supabase's `wikiquote_cache` table (db/schema_v216_wikiquote.sql) —
  so no quote content ever lives in this repo at all.

  Verified live against real Wikiquote pages before writing this parser
  (not guessed): a biographical person page (Isaac Newton — flat
  "== Quotes ==" section, bullet quote + "**" source sub-line), a
  modern figure (David Goggins — confirms modern names often DO have
  real pages, "== Quotes ==" with "===decade===" > "====book===="
  subsections, "== Quotes about Goggins ==" section that must be
  excluded), and a topic page (Discipline — organizes quotes under
  alphabetical "== B==", "== C==" headers instead of one "Quotes"
  section, no "==Quotes==" heading at all). The parser below is written
  to handle all three shapes with one rule: track only the nearest
  LEVEL-2 (==) heading, walk into its level-3/4 subsections freely, and
  skip bullets entirely under any level-2 heading on the exclude list
  (Quotes about X / Disputed / Misattributed / External links / etc.).

  Real quotes from real (especially modern, blunter) people can contain
  profanity — confirmed live in Goggins' own page. A plain-word
  blocklist filters those out before caching, since this is a
  self-development app, not a general quote archive.
  ═══════════════════════════════════════════════════════════════════ */

const SB_URL = 'https://unvwjuceuyruqdnmvxlc.supabase.co';
const WIKIQUOTE_API = 'https://en.wikiquote.org/w/api.php';
const UA = 'ClarvoyanceApp/1.0 (self-development PWA; contact: videhp95@gmail.com)';
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — page content is stable, unlike a 24h video feed
const MIN_LEN = 15, MAX_LEN = 240;
const MAX_QUOTES_STORED = 60;

// Level-2 headings whose bullets must never be treated as this person/topic's
// own quotes, matched case-insensitively as a substring of the heading text.
const EXCLUDE_HEADINGS = ['quotes about', 'disputed', 'misattributed', 'unsourced',
  'unverified', 'external link', 'see also', 'reference', 'source', 'further reading', 'note'];

// Modest, plain-word blocklist — not exhaustive, just enough to keep the
// common cases out of a self-development app's feed.
const PROFANITY = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt', 'motherfucker', 'goddamn'];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
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

async function getCached(env, queryKey) {
  const rows = await sbFetch(env, 'wikiquote_cache?query_key=eq.' + encodeURIComponent(queryKey) + '&limit=1');
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function saveCache(env, queryKey, queryType, matchedTitle, quotes, notFound) {
  await sbFetch(env, 'wikiquote_cache?on_conflict=query_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{
      query_key: queryKey, query_type: queryType, matched_title: matchedTitle || null,
      quotes: quotes || [], not_found: !!notFound, fetched_at: new Date().toISOString(),
    }]),
  });
}

async function wikiquoteOpenSearch(term) {
  const url = WIKIQUOTE_API + '?action=opensearch&search=' + encodeURIComponent(term)
    + '&limit=1&namespace=0&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  const titles = data && data[1];
  return (Array.isArray(titles) && titles[0]) ? titles[0] : null;
}

async function wikiquoteWikitext(title) {
  const url = WIKIQUOTE_API + '?action=query&prop=revisions&titles=' + encodeURIComponent(title)
    + '&rvprop=content&rvslots=main&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  const pages = data && data.query && data.query.pages;
  if (!pages) return null;
  const pid = Object.keys(pages)[0];
  const page = pages[pid];
  if (!page || page.missing !== undefined) return null;
  try { return page.revisions[0].slots.main['*'] || null; } catch (e) { return null; }
}

// Strips MediaWiki markup down to plain, readable text.
function cleanWikitext(raw) {
  let t = raw;
  t = t.replace(/<!--[\s\S]*?-->/g, ' ');           // HTML comments
  t = t.replace(/\{\{[^{}]*\}\}/g, ' ');             // templates (one level)
  t = t.replace(/\{\{[^{}]*\}\}/g, ' ');             // second pass for nested
  t = t.replace(/\[\[File:[^\]]*\]\]/gi, ' ');       // stray inline images
  t = t.replace(/\[\[([^\]]+)\]\]/g, (m, inner) => { // [[Page|Display]] -> Display, [[Page]] -> Page
    const parts = inner.split('|');
    return parts[parts.length - 1];
  });
  t = t.replace(/\[(https?:\/\/[^\s\]]+)\s*([^\]]*)\]/g, (m, url, label) => label || ''); // external links
  t = t.replace(/<br\s*\/?>/gi, ' ');
  t = t.replace(/<[^>]+>/g, ' ');                    // any remaining HTML tags
  t = t.replace(/'{2,}/g, '');                       // ''italic'' / '''bold'''
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function containsProfanity(text) {
  const lower = text.toLowerCase();
  return PROFANITY.some((w) => new RegExp('\\b' + w + '\\w*\\b', 'i').test(lower));
}

// Not every Wikiquote topic page is as rigorously curated as a classic
// biography — verified live against the real "Gratitude" page, which mixed
// genuine quotes with meta-lines like "Abdelnasser Abdelfattah and his
// sayings about Gratitude." and "Meister Eckhart، Gratitude Quotes" (a
// page-index/attribution artifact, not an actual quote). These two patterns
// reliably catch that class of junk without risking a real quote that just
// happens to mention the word "quotes" mid-sentence.
function isJunkLine(text) {
  if (/\bsayings about\b/i.test(text)) return true;
  if (/\bquotes\b\s*\.?$/i.test(text)) return true;
  return false;
}

// Real quotes vary wildly in length by page — a carefully-curated classic
// (Newton) tends to already be a short, punchy line; a page built from a
// modern memoir (verified live against David Goggins' own page: all 8 of
// his top-level bullets were 322-1379 chars, whole paragraphs, none under
// 240) can be entirely too long for a photo card as-is. Rather than either
// discarding those wholesale or crudely cutting a quote off mid-sentence
// (which would misrepresent it), this falls back to the quote's own first
// complete sentence — still their real, unaltered words, just a shorter
// genuine excerpt — and only uses it if THAT falls in the card-friendly
// range; otherwise the whole bullet is skipped rather than risk a bad cut.
function cardFriendlyQuote(full) {
  if (full.length >= MIN_LEN && full.length <= MAX_LEN) return full;
  const m = full.match(/^.*?[.!?](?=\s|$)/);
  const firstSentence = m ? m[0].trim() : null;
  if (firstSentence && firstSentence.length >= MIN_LEN && firstSentence.length <= MAX_LEN) return firstSentence;
  return null;
}

// A TOPIC page (e.g. "Discipline") lists quotes from many different real
// people, each one's actual author named on the very next "**" line (e.g.
// "* Discipline is the soul of an army..." / "** [[George Washington]]") —
// verified live against the real Discipline page (16/16 correctly matched
// in an isolated test before this went into the Worker). Without this, every
// quote on a topic page would be misattributed to the topic name itself
// instead of who actually said it. An AUTHOR page (a person's own biography)
// deliberately does NOT use this — its "**" lines are citations (e.g.
// "Letter to [[Robert Hooke]]"), and blindly grabbing the first wikilink
// there would misattribute the page owner's own words to whoever they were
// writing to instead.
function extractAuthorFromSource(line) {
  const wikiLink = line.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
  const wTemplate = line.match(/\{\{w\|([^}|]+)/i);
  const wikiIdx = wikiLink ? line.indexOf(wikiLink[0]) : Infinity;
  const wIdx = wTemplate ? line.indexOf(wTemplate[0]) : Infinity;
  if (wikiIdx === Infinity && wIdx === Infinity) return null;
  const name = wikiIdx <= wIdx ? wikiLink[1].replace(/^w:/, '').trim() : wTemplate[1].trim();
  return name || null;
}

// Walks the wikitext line-by-line, tracking only the nearest level-2 (==)
// heading. Level-3/4 subheadings inherit whatever level-2 section they're
// under and never reset the exclude state — this is what correctly handles
// both a person page's "== Quotes ==" > "=== 2010s ===" nesting and a topic
// page's flat alphabetical "== B==" / "== C==" sections in one pass.
function extractQuotes(wikitext, queryType, pageTitle) {
  const lines = wikitext.split('\n');
  let excluded = false;
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2 = line.match(/^==\s*([^=]+?)\s*==\s*$/);
    if (h2) {
      const name = h2[1].toLowerCase();
      excluded = EXCLUDE_HEADINGS.some((kw) => name.indexOf(kw) !== -1);
      continue;
    }
    if (excluded) continue;
    const bullet = line.match(/^\*(?!\*)\s*(.+)$/); // top-level "* " only, never "**"
    if (!bullet) continue;
    const cleaned = cardFriendlyQuote(cleanWikitext(bullet[1]));
    if (!cleaned) continue;
    if (containsProfanity(cleaned)) continue;
    if (isJunkLine(cleaned)) continue;
    let author = pageTitle;
    if (queryType === 'topic') {
      const nextLine = lines[i + 1];
      const srcLine = nextLine && /^\*\*(?!\*)/.test(nextLine) ? nextLine.replace(/^\*\*\s*/, '') : null;
      const realAuthor = srcLine ? extractAuthorFromSource(srcLine) : null;
      if (realAuthor) author = realAuthor;
    }
    found.push({ quote: cleaned, author });
    if (found.length >= MAX_QUOTES_STORED) break;
  }
  return found;
}

async function fetchLive(env, queryKey, queryType) {
  const title = await wikiquoteOpenSearch(queryKey);
  if (!title) {
    await saveCache(env, queryKey, queryType, null, [], true);
    return { source: 'live', not_found: true, quotes: [] };
  }
  const wikitext = await wikiquoteWikitext(title);
  if (!wikitext) {
    await saveCache(env, queryKey, queryType, title, [], true);
    return { source: 'live', not_found: true, quotes: [] };
  }
  const rawQuotes = extractQuotes(wikitext, queryType, title);
  const quotes = rawQuotes.map((q) => ({ quote: q.quote, source: q.author }));
  await saveCache(env, queryKey, queryType, title, quotes, quotes.length === 0);
  return { source: 'live', not_found: quotes.length === 0, matched_title: title, quotes };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'invalid JSON' }, 400); }

    const queryKey = String(body.query || '').trim().toLowerCase();
    const queryType = body.type === 'author' ? 'author' : 'topic';
    if (!queryKey) return json({ error: 'query is required' }, 400);

    try {
      const cached = await getCached(env, queryKey);
      const fresh = cached && (Date.now() - new Date(cached.fetched_at).getTime()) < CACHE_MAX_AGE_MS;
      if (fresh) {
        return json({ source: 'cache', not_found: cached.not_found, matched_title: cached.matched_title, quotes: cached.quotes });
      }
      const result = await fetchLive(env, queryKey, queryType);
      return json(result);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};
