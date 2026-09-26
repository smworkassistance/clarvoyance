// T-061 (B8) — sound on all three devices. The "Tap for sound" pill appears ONLY while a video plays muted although sound is wanted; one tap unmutes;
// when the browser refuses (iPhone: cross-origin iframe) the pill points at YouTube's own speaker. Feed inline Bunny video: same. Android app: WebView setting.
const fs = require('fs'), path = require('path');
const { test, expect } = require('./harness');
const { mockCommunity, JSON_H } = require('./community-mock');

const VIDS = ['AAAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC', 'DDDDDDDDDDD', 'EEEEEEEEEEE', 'FFFFFFFFFFF'];
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
// fake YouTube player; window.__ytMode: 'allow' (unMute works), 'refuse' (unMute is ignored, like a cross-origin iframe on iOS), 'startMuted' (starts muted, unMute works)
const FAKE_YT = () => {
  window.__yt = { players: [] };
  function Player(host, opts) {
    const me = this; me.vid = opts.videoId; me.state = -1; me.muted = opts.playerVars && opts.playerVars.mute === 1; me.unmuteCalls = 0;
    const f = document.createElement('div'); f.className = 'fake-yt'; f.style.cssText = 'width:100%;height:100%;background:#123'; host.replaceWith(f);
    const emit = st => { me.state = st; opts.events && opts.events.onStateChange && opts.events.onStateChange({ data: st, target: me }); };
    me.playVideo = () => { if (me.state === 1) return; setTimeout(() => emit(1), 20); };
    me.pauseVideo = () => { if (me.state !== 2) emit(2); }; me.seekTo = () => {};
    const mode = () => window.__ytMode || 'allow';
    me.mute = () => { me.muted = true; };
    me.unMute = () => { me.unmuteCalls++; if (mode() === 'refuse') return; me.muted = false; };
    me.isMuted = () => me.muted; me.setVolume = () => {};
    // 'startMuted'/'refuse': the browser refused sound at autoplay -> the player is muted whatever we asked
    const origPlay = me.playVideo; me.playVideo = () => { if (mode() !== 'allow') me.muted = true; origPlay(); };
    me.getDuration = () => 20; me.getCurrentTime = () => 0; me.getPlayerState = () => me.state; me.destroy = () => f.remove(); me.loadVideoById = () => {};
    window.__yt.players.push(me);
    setTimeout(() => opts.events && opts.events.onReady && opts.events.onReady({ target: me }), 20);
  }
  window.YT = { Player, PlayerState: { PLAYING: 1 } };
};

async function toVideoCard(app, mode) {
  const { page } = app;
  await page.route(/clar-youtube\.smworkassistance\.workers\.dev/, route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    return route.fulfill({ status: 200, headers: JSON_H, body: JSON.stringify({ source: 'cache', videos: VIDS.map((v, i) => ({ video_id: v, title: 'Test video ' + i, topic: 'business' })) }) });
  });
  await page.route(/i\.ytimg\.com|youtube\.com|ytimg/, route => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await page.addInitScript(FAKE_YT);
  await page.addInitScript(m => { window.__ytMode = m; try { localStorage.setItem('clv_user_profile', JSON.stringify({ vision_topics: ['business'] })); localStorage.removeItem('clv_video_seen_ids'); localStorage.removeItem('clv_vf_sound'); } catch (e) {} }, mode);
  await app.boot();
  await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="vibe"]').click());
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(600);
    if (await page.evaluate(() => !!document.querySelector('.vfv-slot.active'))) break;
    await page.evaluate(() => { window._vfvDebug.forceNextVideo(); vfRender(); });
  }
  await expect.poll(() => page.evaluate(() => !!document.querySelector('.vfv-slot.active')), { timeout: 5000 }).toBe(true);
}
const pillVisible = (page, sel) => page.evaluate(s => { const b = document.querySelector(s); return !!b && !b.hidden && getComputedStyle(b).display !== 'none'; }, sel);

test.describe('sound (v253)', () => {
  test('Vibe: no pill when sound is playing', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await toVideoCard(app, 'allow');
    await expect(page.locator('.vfv-slot.active .vfv-stage.playing')).toHaveCount(1, { timeout: 5000 });
    await page.waitForTimeout(1500);
    expect(await pillVisible(page, '.vfv-slot.active .vfv-snd-pill')).toBe(false);
  });

  test('Vibe: browser started it muted -> pill appears; one tap unmutes and hides the pill', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await toVideoCard(app, 'startMuted');
    await expect.poll(() => pillVisible(page, '.vfv-slot.active .vfv-snd-pill'), { timeout: 6000 }).toBe(true);
    await page.evaluate(() => { window.__ytMode = 'allow'; }); // the tap is a real gesture: unMute() now works
    await page.click('.vfv-slot.active .vfv-snd-pill');
    await expect.poll(() => pillVisible(page, '.vfv-slot.active .vfv-snd-pill'), { timeout: 4000 }).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('clv_vf_sound'))).toBe('1');
    expect(await page.evaluate(() => window.__yt.players.find(p => p.state === 1 || p.state === 2).unmuteCalls)).toBeGreaterThanOrEqual(1);
  });

  test('Vibe (iPhone-style refusal): the tap cannot unmute -> the pill points at YouTube\'s own speaker', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await toVideoCard(app, 'refuse');
    await expect.poll(() => pillVisible(page, '.vfv-slot.active .vfv-snd-pill'), { timeout: 6000 }).toBe(true);
    await page.click('.vfv-slot.active .vfv-snd-pill');
    await expect(page.locator('.vfv-slot.active .vfv-snd-pill')).toContainText('speaker', { timeout: 4000 });
  });

  test('Vibe: a viewer who muted on purpose never sees the pill', async ({ app }) => {
    const { page } = app;
    await mockCommunity(page, { navV2: true });
    await page.addInitScript(() => { try { localStorage.setItem('clv_vf_sound', '0'); } catch (e) {} });
    await toVideoCard(app, 'startMuted');
    await page.evaluate(() => localStorage.setItem('clv_vf_sound', '0'));
    await page.waitForTimeout(2500);
    expect(await pillVisible(page, '.vfv-slot.active .vfv-snd-pill')).toBe(false);
  });

  test('Feed inline video: play() refused with sound -> plays muted + pill; tap unmutes', async ({ app }) => {
    const { page } = app;
    const GUID = '11111111-2222-4333-8444-555555555555';
    const mp4 = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.mp4'));
    await page.addInitScript(() => { // a browser that only allows muted autoplay (Chrome before the first tap, every iPhone)
      const orig = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { if (!this.muted && !window.__gesture) return Promise.reject(Object.assign(new Error('NotAllowedError'), { name: 'NotAllowedError' })); return orig.apply(this, arguments); };
      document.addEventListener('click', () => { window.__gesture = true; }, true);
    });
    await page.route(/b-cdn\.net/, route => {
      const u = route.request().url();
      if (/thumbnail\.jpg/.test(u)) return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
      if (/play_\d+p\.mp4/.test(u)) return route.fulfill({ status: 200, contentType: 'video/mp4', body: mp4, headers: { 'access-control-allow-origin': '*' } });
      return route.fulfill({ status: 404, body: '' });
    });
    await mockCommunity(page, { navV2: true, achFeed: [{ id: 'a1', user_id: '00000000-0000-4000-8000-000000000002', handle: 'friend', display_name: 'Friend Person', avatar_url: null, title: null, message: 'Morning run', images: [], video: { guid: GUID, duration: 12 }, created_at: new Date().toISOString(), cheers: 3, comments: 0, i_cheered: false }] });
    await app.boot();
    await page.evaluate(() => document.querySelector('.nv2-tab[data-nv2="feed"]').click());
    await expect(page.locator('.soc-vin')).toHaveCount(1, { timeout: 15000 });
    await page.evaluate(() => { window.__gesture = false; document.querySelector('.soc-vin').scrollIntoView({ block: 'center' }); }); // no gesture yet: sound autoplay is refused
    // (the test browser cannot decode H.264, so we assert the app's own decision — muted fallback + pill — not real playback)
    await expect.poll(() => pillVisible(page, '.soc-vin-pill'), { timeout: 15000 }).toBe(true);
    expect(await page.evaluate(() => document.querySelector('.soc-vin video').muted)).toBe(true);
    await page.click('.soc-vin-pill');
    await expect.poll(() => pillVisible(page, '.soc-vin-pill'), { timeout: 3000 }).toBe(false);
    expect(await page.evaluate(() => document.querySelector('.soc-vin video').muted)).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('clv_vf_sound'))).toBe('1');
  });

  test('Android app: the WebView is told to allow videos to start with sound', async () => {
    const java = fs.readFileSync(path.join(__dirname, '..', '..', 'android', 'app', 'src', 'main', 'java', 'com', 'smworkassistance', 'clar', 'MainActivity.java'), 'utf8');
    expect(java).toContain('setMediaPlaybackRequiresUserGesture(false)');
  });
});
