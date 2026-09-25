// Mocks a signed-in Community member so authenticated UI flows can be tested without a real Google account.
// Reads of Community tables are answered locally; every write is captured or faked (harness.isolate already fakes Supabase writes).
const PROFILE = {
  user_id: '00000000-0000-4000-8000-000000000001', handle: 'qa_user', display_name: 'QA User', avatar_url: null, is_me: true,
  bio: '', goal_text: null, interests: {}, badges: ['joined'], xp: 10, xp_week: 5, streak: 1, engaged_days: 1,
  clar_min_day: null, clar_min_week: null, followers: 0, following: 0, i_follow: false, follows_me: false,
  visibility: { leaderboard: true, xp: true, streak: true, badges: true, clar_time: false, goal: false, interests: false },
  listed: true, rank: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
};
const JSON_H = { 'content-type': 'application/json', 'access-control-allow-origin': '*' };

async function mockCommunity(page, opts = {}) {
  await page.addInitScript(() => {
    Object.defineProperty(window, '_isGoogleUser', { get: () => true, set() {}, configurable: true });
    // anonymous sign-in is not guaranteed inside the isolated test network, so present a fixed signed-in user id
    Object.defineProperty(window, '_sbUid', { get: () => '00000000-0000-4000-8000-000000000001', set() {}, configurable: true });
    try { localStorage.setItem('clv_social_dev', '1'); } catch (e) {}
  });
  const wantsObject = r => (r.request().headers()['accept'] || '').includes('vnd.pgrst.object');
  const notFound = { code: 'PGRST116', details: 'The result contains 0 rows', hint: null, message: 'JSON object requested, multiple (or no) rows returned' };
  await page.route(/\/rest\/v1\/social_public_profiles/, route => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (wantsObject(route)) return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify(PROFILE) });
    // newer supabase-js maybeSingle() sends a plain Accept and unwraps an array itself
    if (/is_me=eq\.true/.test(route.request().url())) return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify([PROFILE]) });
    return route.fulfill({ status: 200, headers: JSON_H, body: '[]' });
  });
  for (const t of ['social_feed', 'social_achievement_feed', 'social_clar_posts', 'social_comments_feed']) {
    await page.route(new RegExp('/rest/v1/' + t), route => {
      if (route.request().method() !== 'GET') return route.fallback();
      return route.fulfill({ status: 200, headers: JSON_H, body: '[]' });
    });
  }
  await page.route(/\/rest\/v1\/feature_flags/, route => {
    if (route.request().method() !== 'GET') return route.fallback();
    const u = route.request().url();
    const key = (u.match(/key=eq\.([a-z_0-9]+)/) || [])[1];
    const on = key === 'social_layer' || (key === 'nav_v2' && opts.navV2);
    if (wantsObject(route)) return on ? route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ enabled: true }) }) : route.fulfill({ status: 406, headers: JSON_H, body: JSON.stringify(notFound) });
    return route.fulfill({ status: 200, headers: JSON_H, body: on ? JSON.stringify([{ key, enabled: true }]) : '[]' });
  });
  // capture inserts into social_achievements (the harness would otherwise just fake-accept them)
  const inserts = [];
  await page.route(/\/rest\/v1\/social_achievements/, route => {
    if (route.request().method() !== 'POST') return route.fallback();
    try { inserts.push(JSON.parse(route.request().postData() || 'null')); } catch (e) { inserts.push({ unparsable: true }); }
    return route.fulfill({ status: 201, headers: JSON_H, body: '[]' });
  });
  return { inserts, PROFILE };
}
module.exports = { mockCommunity, PROFILE, JSON_H };
