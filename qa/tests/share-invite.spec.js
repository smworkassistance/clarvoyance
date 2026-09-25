// T-043 / T-044 — sharing a video (feed + WhatsApp invitation), inline playing in the feed, landing links, referral registration + XP claim, saved videos.
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const VIDS = ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD'];
const FAKE_YT = () => {
  window.__yt = { players: [], speed: 10 };
  function Player(host, opts) {
    const me = this; me.vid = opts.videoId; me.state = -1; me.t = 0; me.dur = 20; me.muted = false; me.destroyed = false; me.opts = opts;
    const f = document.createElement('div'); f.className = 'fake-yt'; f.setAttribute('data-vid', me.vid); f.style.cssText = 'width:100%;height:100%;background:#123'; host.replaceWith(f);
    const emit = st => { me.state = st; opts.events && opts.events.onStateChange && opts.events.onStateChange({ data: st, target: me }); };
    me.playVideo = () => setTimeout(() => { if (!me.destroyed) emit(1); }, 20); me.pauseVideo = () => emit(2); me.seekTo = () => {};
    me.mute = () => { me.muted = true; }; me.unMute = () => { me.muted = false; }; me.isMuted = () => me.muted; me.setVolume = () => {};
    me.getDuration = () => me.dur; me.getCurrentTime = () => me.t; me.getPlayerState = () => me.state; me.destroy = () => { me.destroyed = true; f.remove(); };
    window.__yt.players.push(me);
    setTimeout(() => { if (me.destroyed) return; opts.events && opts.events.onReady && opts.events.onReady({ target: me }); if (opts.playerVars && opts.playerVars.autoplay) me.playVideo(); }, 20);
  }
  window.YT = { Player, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } };
};
async function common(page) {
  await page.route(/clar-youtube\.smworkassistance\.workers\.dev/, route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ source: 'cache', videos: VIDS.map((v, i) => ({ video_id: v, title: 'Test video ' + i, topic: 'business' })) }) });
  });
  await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') }));
  await page.addInitScript(FAKE_YT);
}
async function toVideoCard(page) {
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(600);
    if (await page.evaluate(() => !!document.querySelector('.vfv-slot.active'))) return;
    await page.evaluate(() => { window._vfvDebug.forceNextVideo(); vfRender(); });
  }
}
const seed = { clv_user_profile: JSON.stringify({ vision_topics: ['business'] }), clv_my_handle: 'videh' };
const init = obj => page => page.addInitScript(o => { try { Object.keys(o).forEach(k => localStorage.setItem(k, o[k])); } catch (e) {} }, obj);

test.describe('share + invite + referral (v250)', () => {
  test('Vibe Share: 3 options; WhatsApp opens the approved invitation with my ref and the video id', async ({ app }) => {
    const { page } = app;
    await common(page); await mockCommunity(page); await init(seed)(page);
    await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
    await app.boot(); await toVideoCard(page);
    await page.locator('.vfv-slot.active [data-vfv="share"]').click();
    await expect(page.locator('#vfv-share')).toBeVisible();
    await expect(page.locator('#vfv-share .vfv-share-b')).toHaveCount(3);
    await page.locator('#vfv-share [data-s="wa"]').click();
    const url = await page.evaluate(() => window.__opened[0]);
    expect(url).toContain('https://wa.me/?text=');
    const text = decodeURIComponent(url.split('text=')[1]);
    const vid = await page.evaluate(() => document.querySelector('.vfv-slot.active').getAttribute('data-vid'));
    expect(text).toContain("I'm transforming my life with Clar. Let's grow together 🌱 What are the first few goals or desires you want to fulfil?");
    expect(text).toContain('Join me: https://clar.co.in/?ref=videh&v=' + vid);
    expect(text, 'no outcome promises').not.toMatch(/guarantee|will (change|transform)|multifold/i);
    await expect(page.locator('#vfv-share')).toHaveCount(0);
    // sharing pays interaction XP once and records the signal
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('clv_vid_prefs')).affinity.business.share)).toBe(1);
  });

  test('Vibe Share → More apps uses the phone\'s share sheet', async ({ app }) => {
    const { page } = app;
    await common(page); await mockCommunity(page); await init(seed)(page);
    await page.addInitScript(() => { window.__shared = null; navigator.share = d => { window.__shared = d; return Promise.resolve(); }; });
    await app.boot(); await toVideoCard(page);
    await page.locator('.vfv-slot.active [data-vfv="share"]').click();
    await page.locator('#vfv-share [data-s="more"]').click();
    await expect.poll(() => page.evaluate(() => window.__shared && window.__shared.url)).toContain('ref=videh');
  });

  test('Vibe Share → Post to my feed saves a yt_video post (validated shape) and returns to the video', async ({ app }) => {
    const { page } = app;
    await common(page); await init(seed)(page);
    const { inserts } = await mockCommunity(page);
    await app.boot(); await toVideoCard(page);
    const vid = await page.evaluate(() => document.querySelector('.vfv-slot.active').getAttribute('data-vid'));
    await page.locator('.vfv-slot.active [data-vfv="share"]').click();
    await page.locator('#vfv-share [data-s="feed"]').click();
    await expect(page.locator('#soc-sheet-host [data-act="post-yt"]')).toBeVisible({ timeout: 15000 });
    await page.fill('#soc-ach-msg', 'worth watching');
    await page.locator('[data-act="post-yt"]').click();
    await expect.poll(() => inserts.length).toBe(1);
    expect(inserts[0].yt_video.id).toBe(vid);
    expect(inserts[0].message).toBe('worth watching');
    await expect.poll(() => page.evaluate(() => document.getElementById('soc-screen').classList.contains('hidden')), { timeout: 5000 }).toBe(true);
  });

  test('a shared video plays INSIDE the feed post (muted, when in view, one at a time)', async ({ app }) => {
    const { page } = app;
    await common(page);
    const rows = ['AAAAAAAAAAA', 'BBBBBBBBBBB'].map((id, i) => ({ id: 100 + i, user_id: '00000000-0000-4000-8000-0000000000f' + i, title: null, images: [], date_set: null, date_achieved: null, created_at: new Date(Date.now() - i * 3600000).toISOString(), handle: 'friend' + i, display_name: 'Friend ' + i, avatar_url: null, cheers: 0, i_cheered: false, message: 'watch this ' + i, comments: 0, video: null, yt_video: { id, title: 'Shared video ' + i } }));
    await mockCommunity(page, { achFeed: rows }); await init(seed)(page);
    await app.boot();
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
    await expect(page.locator('.soc-yt')).toHaveCount(2, { timeout: 15000 });
    await page.evaluate(() => document.querySelectorAll('.soc-yt')[0].scrollIntoView({ block: 'center' }));
    await expect(page.locator('.soc-yt.live')).toHaveCount(1, { timeout: 5000 });
    const first = await page.evaluate(() => ({ vid: document.querySelector('.soc-yt.live').getAttribute('data-yt'), muted: window.__yt.players.at(-1).opts.playerVars.mute, controls: window.__yt.players.at(-1).opts.playerVars.controls }));
    expect(first.vid).toBe('AAAAAAAAAAA'); expect(first.muted).toBe(1); expect(first.controls).toBe(1);
    // nothing of ours over the video: the centre pixel belongs to the player
    expect(await page.evaluate(() => { const r = document.querySelector('.soc-yt.live').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(e && e.closest('.fake-yt')); })).toBe(true);
    await page.evaluate(() => document.querySelectorAll('.soc-yt')[1].scrollIntoView({ block: 'center' }));
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.soc-yt.live')].map(b => b.getAttribute('data-yt')).join(',')), { timeout: 5000 }).toBe('BBBBBBBBBBB');
  });

  test('landing on ?ref=&v= remembers the inviter and opens Vibe on the shared video', async ({ app }) => {
    const { page } = app;
    await common(page); await init({ clv_user_profile: seed.clv_user_profile })(page);
    await page.route('**/', route => route.fallback());
    await page.addInitScript(() => { if (!sessionStorage.getItem('__once')) { sessionStorage.setItem('__once', '1'); history.replaceState(null, '', '/?ref=alice&v=DDDDDDDDDDD'); } });
    await app.boot();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('clv_ref'))).toBe('alice');
    await expect.poll(() => page.evaluate(() => { const s = document.querySelector('.vfv-slot.active'); return s ? s.getAttribute('data-vid') : null; }), { timeout: 20000 }).toBe('DDDDDDDDDDD');
  });

  test('referral: a signed-in visitor with a stored ref is registered, then owed XP is claimed and added once', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page); await init({ clv_ref: 'alice', clar_xp: '10' })(page);
    const calls = [];
    await page.route(/\/rest\/v1\/rpc\/referral_register/, route => { calls.push('register:' + route.request().postData()); return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ ok: true }) }); });
    await page.route(/\/rest\/v1\/rpc\/referral_claim/, route => { calls.push('claim'); return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ xp: 150, as_invitee: 50, as_inviter: 100 }) }); });
    await app.boot();
    await expect.poll(() => calls.length, { timeout: 30000 }).toBeGreaterThanOrEqual(2);
    expect(calls[0]).toContain('"p_handle":"alice"');
    expect(calls[1]).toBe('claim');
    expect(await page.evaluate(() => localStorage.getItem('clv_ref'))).toBeNull();
    await expect(page.locator('#clv-toast-x')).toContainText('+150 XP');
    expect(await page.evaluate(() => Number(localStorage.getItem('clar_xp')))).toBeGreaterThanOrEqual(160);
    // running again within 10 minutes does not call again (no double claim from the client either)
    await page.evaluate(() => window._refRun());
    await page.waitForTimeout(500);
    expect(calls.length).toBe(2);
  });

  test('You dashboard: "Grow your circle" shows the invitation; "Saved videos" lists and removes', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page);
    await init({ ...seed, clv_vid_prefs: JSON.stringify({ affinity: {}, liked: {}, xpOnce: {}, saved: [{ id: 'AAAAAAAAAAA', title: 'Saved one', topic: 'business', ts: 1 }, { id: 'BBBBBBBBBBB', title: 'Saved two', topic: 'business', ts: 2 }] }) })(page);
    await app.boot();
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="you"]').click());
    await expect(page.locator('.v2-mini')).toHaveCount(2, { timeout: 15000 });
    await page.locator('[data-act="v2-invite"]').click();
    await expect(page.locator('#soc-inv-t')).toContainText("I'm transforming my life with Clar. Let's grow together");
    await expect(page.locator('#soc-inv-t')).toContainText('ref=qa_user'); // the signed-in member's own handle from the profile
    await page.evaluate(() => document.querySelector('#soc-sheet-host').innerHTML = '');
    await page.locator('[data-act="v2-saved"]').click();
    await expect(page.locator('.soc-sv')).toHaveCount(2);
    await page.locator('.soc-sv [data-act="saved-rm"]').first().click();
    await expect(page.locator('.soc-sv')).toHaveCount(1);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('clv_vid_prefs')).saved.length)).toBe(1);
  });
});
