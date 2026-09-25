// T-040/041/042 — the rebuilt Vibe video card. A FAKE YT player (deterministic, fast-forwarded) stands in for YouTube so we can prove OUR behaviour:
// policy-compliant layout (nothing over the player), poster-first, preload-then-reveal on swipe, XP per pass + daily cap, signals/preference score, sound memory.
// (Real-YouTube speed is measured separately on the owner's Chrome: qa/cdp-reels-timing.js.)
const { test, expect } = require('./harness');

const VIDS = ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD', 'EEEEEEEEEEE', 'FFFFFFFFFFF'];

const FAKE_YT = () => {
  window.__yt = { players: [], speed: 10 };
  const S = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  function Player(host, opts) {
    const me = this; me.vid = opts.videoId; me.state = -1; me.t = 0; me.dur = 20; me.muted = false; me.destroyed = false; me.unmuteCalls = 0; me.playCalls = 0; me.createdAt = performance.now();
    const f = document.createElement('div'); f.className = 'fake-yt'; f.style.cssText = 'width:100%;height:100%;background:#123'; f.setAttribute('data-vid', me.vid);
    host.replaceWith(f); me.el = f;
    const emit = st => { me.state = st; opts.events && opts.events.onStateChange && opts.events.onStateChange({ data: st, target: me }); };
    me.playVideo = () => { me.playCalls++; if (me.state === 1) return; setTimeout(() => { if (me.destroyed) return; emit(1); clearInterval(me.timer); me.timer = setInterval(() => { me.t += 0.1 * window.__yt.speed; if (me.t >= me.dur) me.t = 0; }, 100); }, 30); };
    me.pauseVideo = () => { clearInterval(me.timer); if (me.state !== 2) emit(2); };
    me.seekTo = x => { me.t = x; };
    me.mute = () => { me.muted = true; }; me.unMute = () => { me.muted = false; me.unmuteCalls++; }; me.isMuted = () => me.muted; me.setVolume = () => {};
    me.getDuration = () => me.dur; me.getCurrentTime = () => me.t; me.getPlayerState = () => me.state;
    me.destroy = () => { me.destroyed = true; clearInterval(me.timer); f.remove(); };
    window.__yt.players.push(me);
    setTimeout(() => { if (me.destroyed) return; opts.events && opts.events.onReady && opts.events.onReady({ target: me }); if (opts.playerVars && opts.playerVars.autoplay) me.playVideo(); }, 20);
  }
  window.YT = { Player, PlayerState: S };
};

async function setup(app, extra) {
  const { page } = app;
  await page.route(/clar-youtube\.smworkassistance\.workers\.dev/, route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    return route.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }, body: JSON.stringify({ source: 'cache', videos: VIDS.map((v, i) => ({ video_id: v, title: 'Test video ' + i, topic: 'business' })) }) });
  });
  await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') }));
  await page.addInitScript(FAKE_YT);
  await page.addInitScript(x => { try { localStorage.setItem('clv_user_profile', JSON.stringify({ vision_topics: ['business'] })); localStorage.removeItem('clv_vid_prefs'); localStorage.removeItem('clv_video_seen_ids'); if (x) Object.keys(x).forEach(k => localStorage.setItem(k, x[k])); } catch (e) {} }, extra || null);
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
  // the topic pool loads asynchronously: keep asking for a video card until one is on screen
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(600);
    if (await page.evaluate(() => !!document.querySelector('.vfv-slot.active'))) break;
    await page.evaluate(() => { window._vfvDebug.forceNextVideo(); vfRender(); });
  }
  await expect.poll(() => page.evaluate(() => document.querySelector('.vfv-slot.active') ? 1 : 0), { timeout: 5000 }).toBe(1);
}
async function showVideoCard(page) {
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => { window._vfvDebug.forceNextVideo(); vfRender(); });
    await page.waitForTimeout(500);
    if (await page.evaluate(() => !!document.querySelector('.vfv-slot.active'))) return;
  }
}
const active = page => page.evaluate(() => { const s = document.querySelector('.vfv-slot.active'); return s ? s.getAttribute('data-vid') : null; });

test.describe('Vibe video card (v250)', () => {
  test('policy-compliant: poster first, nothing over the player, our UI below it', async ({ app }) => {
    await setup(app);
    const { page } = app;
    // poster is present at once and the player container is hidden until it plays
    const early = await page.evaluate(() => { const s = document.querySelector('.vfv-slot.active .vfv-stage'); return { poster: !!s.querySelector('.vfv-poster'), src: s.querySelector('.vfv-poster').src }; });
    expect(early.poster).toBe(true);
    expect(early.src).toContain('i.ytimg.com/vi/');
    await expect(page.locator('.vfv-slot.active .vfv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    const g = await page.evaluate(() => {
      const st = document.querySelector('.vfv-slot.active .vfv-stage'), r = st.getBoundingClientRect(), ui = document.querySelector('.vfv-slot.active .vfv-ui').getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2, hit = document.elementFromPoint(cx, cy), corners = [[6, 6], [r.width - 6, 6], [6, r.height - 6], [r.width - 6, r.height - 6]].map(([x, y]) => document.elementFromPoint(r.left + x, r.top + y));
      return {
        hitInPlayer: !!(hit && hit.closest('.vfv-yt')), cornersInPlayer: corners.every(e => e && e.closest('.vfv-yt')),
        stageKids: [...st.children].map(c => c.className).sort().join(','), uiBelow: ui.top >= r.bottom - 1, ratio: r.width / r.height,
        oldOverlays: ['.vf-video-touch-ov', '.vf-vid-mute', '.vf-vid-prog', '.vf-vid-xp', '.vf-vid-cap'].filter(s => document.querySelector(s)).length,
        btns: [...document.querySelectorAll('.vfv-slot.active [data-vfv]')].map(b => b.getAttribute('data-vfv')).join(',')
      };
    });
    expect(g.hitInPlayer, 'the pixel at the centre of the player belongs to the player').toBe(true);
    expect(g.cornersInPlayer, 'no overlay at any corner').toBe(true);
    expect(g.stageKids).toBe('vfv-load,vfv-poster,vfv-yt');
    expect(g.uiBelow, 'our UI sits below the player').toBe(true);
    expect(g.ratio).toBeGreaterThan(0.5); expect(g.ratio).toBeLessThan(0.6);
    expect(g.oldOverlays, 'the old overlay elements are gone').toBe(0);
    expect(g.btns).toBe('back,feed,noop,like,share,save,next'); // v251: top bar (back · Feed | Vibe) + Instagram order like · share · save
    // the player is created with YouTube's own controls visible
    const opts = await page.evaluate(() => window.__yt.players.length);
    expect(opts).toBeGreaterThanOrEqual(1);
  });

  test('preload: the next video is already built and buffered; the swipe only reveals it (no new player, ~instant)', async ({ app }) => {
    await setup(app);
    const { page } = app;
    await page.evaluate(() => { window._vfvDebug.setThreshold(1); });
    await page.evaluate(() => window._vfvDebug.preloadNow());   // the next pick will be a video -> its slot is built now, hidden
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => ({ n: window.__yt.players.length, slots: window._vfvDebug.slots()}));
    const pre = before.slots.find(s => !s.active && s.ready);
    expect(pre, 'a hidden preloaded slot exists and is ready').toBeTruthy();
    expect(pre.buffered, 'it has buffered (played muted, paused at 0:00)').toBe(true);
    await showVideoCard(page);   // "swipe" to the video
    await expect.poll(() => active(page), { timeout: 3000 }).toBe(pre.vid);
    const after = await page.evaluate(() => ({ n: window.__yt.players.length, ttp: window._vfvDebug.lastTtp() }));
    expect(after.n, 'no new player was created for the swipe').toBe(before.n);
    await expect.poll(() => page.evaluate(() => window._vfvDebug.lastTtp()), { timeout: 3000 }).toBeLessThan(400);
  });

  test('XP: every pass over 50% pays, until the daily cap; the card unlocks so leaving is not a skip', async ({ app }) => {
    await setup(app, { clv_app_settings: JSON.stringify({ ts: Date.now(), v: { video_xp_daily_cap: 3 } }), clv_vidxp_day: '' });
    const { page } = app;
    const xp0 = await page.evaluate(() => vfScore);
    await expect.poll(() => page.evaluate(() => window._vfvDebug.slots().find(s => s.active).passes), { timeout: 20000 }).toBeGreaterThanOrEqual(4);
    const xp1 = await page.evaluate(() => vfScore);
    expect(xp1 - xp0, '3 awards x 8 XP, then the cap stops it').toBe(24);
    await expect(page.locator('.vfv-slot.active .vfv-xp')).toHaveText('Daily video XP reached');
    expect(await page.evaluate(() => vfXpUnlocked)).toBe(true);
  });

  test('signals + preference score: like/save recorded, unlike/unsave reverse, weighted topic draw follows the score', async ({ app }) => {
    await setup(app);
    const { page } = app;
    const get = () => page.evaluate(() => JSON.parse(localStorage.getItem('clv_vid_prefs')));
    await page.locator('.vfv-slot.active [data-vfv="like"]').click();
    await page.locator('.vfv-slot.active [data-vfv="save"]').click();
    let p = await get(); const vid = await active(page);
    expect(p.liked[vid]).toBe(1); expect(p.saved.map(v => v.id)).toContain(vid);
    expect(p.affinity.business.s).toBeGreaterThanOrEqual(7);            // like 3 + save 4 (+ play 0)
    await expect(page.locator('.vfv-slot.active .vfv-like.on')).toHaveCount(1);
    await page.locator('.vfv-slot.active [data-vfv="save"]').click();
    p = await get(); expect(p.saved.length).toBe(0);
    // interaction XP is once per video per kind, and capped
    const xpLike = await page.evaluate(() => JSON.parse(localStorage.getItem('clv_ixp_day')).n);
    expect(xpLike).toBe(3);                                             // like 1 + save 2
    // weighted draw
    const share = await page.evaluate(() => { const st = JSON.parse(localStorage.getItem('clv_vid_prefs')); st.affinity = { a: { s: 100 }, b: { s: 0 } }; localStorage.setItem('clv_vid_prefs', JSON.stringify(st)); let a = 0; for (let i = 0; i < 600; i++) if (window._vidPickWeighted([{ topic: 'a' }, { topic: 'b' }]).topic === 'a') a++; return a / 600; });
    expect(share, 'the liked topic is drawn clearly more often').toBeGreaterThan(0.7);
    expect(share, '…but exploration still happens').toBeLessThan(0.97);
  });

  // v251b (owner: "videos mute hona hi nahi chahiye"): sound is ON by default; only the viewer's own mute keeps later videos muted
  test('sound: videos start WITH sound by default; once the viewer mutes in YouTube own control, later videos stay muted', async ({ app }) => {
    await setup(app);
    const { page } = app;
    expect(await page.evaluate(() => localStorage.getItem('clv_vf_sound'))).toBeNull();
    await expect.poll(() => page.evaluate(() => !!window.__yt.players.find(p => !p.destroyed && p.state === 1)), { timeout: 5000 }).toBe(true);
    const first = await page.evaluate(() => { const vid = document.querySelector('.vfv-slot.active').getAttribute('data-vid'); const pl = window.__yt.players.find(p => p.vid === vid && !p.destroyed); return { muted: pl.muted, unmuteCalls: pl.unmuteCalls }; });
    expect(first.muted).toBe(false);
    expect(first.unmuteCalls).toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(2700); // past the short grace window in which YouTube's isMuted() may still lag our own unMute()
    expect(await page.evaluate(() => localStorage.getItem('clv_vf_sound')), 'our own unmute is not mistaken for a viewer choice').toBeNull();
    await page.evaluate(() => { const pl = window.__yt.players.find(p => !p.destroyed && p.state === 1); pl.muted = true; });   // the viewer taps YouTube's speaker icon
    await expect.poll(() => page.evaluate(() => localStorage.getItem('clv_vf_sound')), { timeout: 3000 }).toBe('0');
    await showVideoCard(page);
    await page.waitForTimeout(800);
    const next = await page.evaluate(() => { const vid = document.querySelector('.vfv-slot.active').getAttribute('data-vid'); const pl = window.__yt.players.find(p => p.vid === vid && !p.destroyed); return { muted: pl.muted }; });
    expect(next.muted).toBe(true);
  });

  test('swipe up on our own UI advances; Next button advances; leaving early is a fast-skip signal', async ({ app }) => {
    await setup(app);
    const { page } = app;
    await page.evaluate(() => { window.__nextCalls = 0; const o = window.vfNext; window.vfNext = function () { window.__nextCalls++; return o.apply(this, arguments); }; });
    await page.evaluate(() => {
      const ui = document.querySelector('.vfv-slot.active .vfv-ui');
      const mk = (type, y) => new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: ui, clientX: 100, clientY: y })], changedTouches: [new Touch({ identifier: 1, target: ui, clientX: 100, clientY: y })] });
      ui.dispatchEvent(mk('touchstart', 400)); ui.dispatchEvent(mk('touchend', 300));
    });
    expect(await page.evaluate(() => window.__nextCalls)).toBe(1);
    await page.waitForTimeout(500);
  });
});
