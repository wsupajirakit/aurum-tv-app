/**
 * พฤติกรรมของตัวเล่นวิดีโอ (usePlayerController) — รันได้โดยไม่ต้องมีทีวี
 *
 * ทุกสถานการณ์ตรวจ 2 ชั้น:
 *   1. assert พฤติกรรมที่ต้องเป็นตรงๆ (retry backoff, timeout 15 วิ, watchdog, ...)
 *   2. เทียบไทม์ไลน์ทั้งหมด (player.replace/play/pause, state, callback, log) กับ snapshot
 *      ที่บันทึกจากโค้ดก่อน refactor → แตกไฟล์แล้วพฤติกรรมต้องเหมือนเดิมทุกจังหวะ
 *
 * อัปเดต snapshot (เฉพาะเมื่อตั้งใจเปลี่ยนพฤติกรรม): UPDATE_SNAPSHOTS=1 npm test
 */
import { after, afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { usePlayerController } from 'player-under-test'
import { mountPlayer, restoreClock } from '../support/harness.js'
import { trace } from '../support/trace.js'
import { ch3Control } from '../support/stubs/ch3.js'

// ---------- snapshot ----------

const SNAPSHOT_FILE = path.resolve('test/__snapshots__/player-trace.json')
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1'
const snapshots = fs.existsSync(SNAPSHOT_FILE) ? JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) : {}

function matchTimeline(name) {
  const actual = JSON.parse(JSON.stringify(trace.entries()))
  if (UPDATE) {
    snapshots[name] = actual
    return
  }
  assert.ok(snapshots[name], `ยังไม่มี snapshot ของ "${name}" — รัน UPDATE_SNAPSHOTS=1 npm test`)
  assert.deepEqual(actual, snapshots[name], `ไทม์ไลน์ของ "${name}" ไม่ตรงกับ snapshot (พฤติกรรมเปลี่ยน)`)
}

after(() => {
  if (UPDATE) fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(snapshots, null, 1)}\n`)
})
afterEach(restoreClock)

// ---------- ข้อมูลทดสอบ ----------

const FAKE_NOW_SEC = Date.UTC(2026, 9, 27, 12, 0, 0) / 1000
const A = { id: 'ch-a', name: 'One 31', group: 'ฟรีทีวี', url: 'https://cdn.example.com/one/playlist.m3u8' }
const A_RENEWED = { ...A, url: 'https://cdn.example.com/one/playlist.m3u8?v=2' }
const A_FRESH = 'https://cdn.example.com/one/fresh.m3u8'
const B = { id: 'ch-b', name: 'Workpoint 23', group: 'ฟรีทีวี', url: 'https://cdn.example.com/wp/playlist.m3u8' }
const CH3_URL = `https://ch3-33-web.cdn.byteark.com/live/playlist.m3u8?x_ark_expires=${FAKE_NOW_SEC + 1200}`
// ช่องที่ใช้ resolver ch3plus — ระบุในข้อมูล (sources) ไม่ใช่จำจากชื่อ
const CH3 = {
  id: 'ch-3',
  name: '3HD',
  group: 'ฟรีทีวี',
  url: CH3_URL,
  sources: [{ id: 'ch3plus', resolver: 'ch3plus', url: CH3_URL, priority: 0, status: 'up' }],
}
const SRC = (id, priority, status) => ({ id, label: id, url: `https://cdn-${id}.example.com/live.m3u8`, resolver: 'static', priority, status })
/** ช่องที่มีแหล่งสำรอง — url ของช่อง = แหล่งที่ backend กำลังใช้ */
const MULTI = {
  id: 'ch-multi',
  name: 'Workpoint 23',
  group: 'ฟรีทีวี',
  url: SRC('a', 0).url,
  sources: [SRC('a', 0, 'up'), SRC('b', 1, 'unknown'), SRC('c', 2, 'up')],
}
const MAIN = { id: 'main-channel', isMain: true, type: 'image', enabled: true, name: 'Home' }

const mount = (channel, opts) => mountPlayer(usePlayerController, { channel, ...opts })
const count = (kind, pred = () => true) => trace.ofKind(kind).filter(pred).length
const logged = (level, state) => trace.ofKind(`log.${level}`).some((e) => e[2] === state)
const replaceTimes = () => trace.ofKind('player.replace').map((e) => e[0])

/** เลื่อนเวลาจน player.replace ครบ n ครั้ง (ไม่เกิน maxMs) */
async function untilReplaceCount(h, n, maxMs = 15_000) {
  for (let waited = 0; count('player.replace') < n && waited < maxMs; waited += 100) await h.advance(100)
}

// ---------- สถานการณ์ ----------

test('เปิดช่อง → ภาพแรกมา → ซ่อนจอโหลด, แจ้งเล่นครั้งเดียว, heartbeat ทุก 60 วิ', async () => {
  const h = await mount(A)
  assert.equal(h.result.loading, true)
  assert.deepEqual(trace.ofKind('player.replace')[0].slice(2), [1, A.url])

  await h.advance(300)
  await h.emit('statusChange', { status: 'loading' })
  await h.emit('statusChange', { status: 'readyToPlay' })
  await h.emit('playingChange', { isPlaying: true }, { playing: true })
  await h.play(3)
  assert.equal(h.result.loading, false)
  assert.equal(count('cb.playState', (e) => e[2] === true), 1)

  await h.play(62, { from: 3 })
  assert.ok(logged('info', 'PLAYING_HEARTBEAT'))
  assert.equal(h.result.timedOut, false)
  matchTimeline('load-first-frame-heartbeat')
  await h.unmount()
})

test('readyToPlay แต่ภาพไม่ขยับ → watchdog ปลดจอโหลดที่ 4.5 วิ และไม่ขึ้นข้อความ timeout', async () => {
  const h = await mount(A)
  await h.emit('statusChange', { status: 'readyToPlay' })
  await h.advance(4400)
  assert.equal(h.result.loading, true)
  await h.advance(200)
  assert.equal(h.result.loading, false)
  assert.ok(logged('info', 'SAFETY_DISMISS_LOADING'))
  await h.advance(15_000)
  assert.equal(h.result.timedOut, false)
  matchTimeline('safety-watchdog')
  await h.unmount()
})

test('ภาพไม่มาใน 15 วิ → ข้อความ timeout, หยุด retry, pause · กด OK → โหลดใหม่และนับใหม่', async () => {
  const h = await mount(A)
  await h.advance(14_900)
  assert.equal(h.result.timedOut, false)
  await h.advance(200)
  assert.equal(h.result.timedOut, true)
  assert.equal(h.result.loading, false)
  assert.ok(logged('warn', 'LOAD_TIMEOUT_PROMPT'))
  assert.equal(count('player.pause'), 1)

  const replacesBefore = count('player.replace')
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await h.advance(20_000)
  assert.equal(count('player.replace'), replacesBefore, 'หลัง timeout ต้องไม่ retry เอง')

  await h.manualRetry()
  assert.equal(h.result.timedOut, false)
  assert.equal(h.result.loading, true)
  assert.equal(count('player.replace'), replacesBefore + 1)
  await h.play(3)
  assert.equal(h.result.loading, false)
  await h.advance(15_000)
  assert.equal(h.result.timedOut, false, 'เล่นได้แล้วต้องไม่ขึ้น timeout')
  matchTimeline('load-timeout-then-ok')
  await h.unmount()
})

test('สตรีม error ซ้ำ → retry ห่างขึ้น 2/4/6 วิ แล้วขึ้น timeout ที่ 15 วิ', async () => {
  const h = await mount(A)
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await h.advance(100)
    await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
    await untilReplaceCount(h, attempt + 1)
  }
  const t = replaceTimes()
  assert.equal(t.length, 4)
  assert.deepEqual([t[1] - t[0], t[2] - t[1], t[3] - t[2]].map((d) => Math.round(d / 1000)), [2, 4, 6])
  await h.advance(15_000 - t[3])
  assert.equal(h.result.timedOut, true)
  matchTimeline('error-backoff-then-timeout')
  await h.unmount()
})

test('retry ครั้งที่ 2 ขอ URL ใหม่จาก backend แล้วใช้ตัวนั้น', async () => {
  const h = await mount(A, { refreshResult: { id: A.id, url: A_FRESH } })
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await untilReplaceCount(h, 2)
  assert.equal(count('cb.refreshChannel'), 0)
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await untilReplaceCount(h, 3)
  assert.equal(count('cb.refreshChannel'), 1)
  assert.equal(trace.ofKind('player.replace').at(-1)[3], A_FRESH)
  matchTimeline('backend-refresh-on-second-retry')
  await h.unmount()
})

test('กู้กลับได้หลัง retry → เล่นต่อเนื่อง 60 วิ แล้ว reset ตัวนับ retry', async () => {
  const h = await mount(A)
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await untilReplaceCount(h, 2)
  await h.play(65)
  assert.ok(logged('info', 'PLAYBACK_STABLE_60S'))
  assert.equal(h.result.loading, false)
  assert.equal(h.result.timedOut, false)
  matchTimeline('recover-and-stable-reset')
  await h.unmount()
})

test('ดูอยู่แล้วภาพหยุด → ยืนยันค้างที่ 15 วิ → reconnect → ไม่กลับมาใน 15 วิ ขึ้น timeout', async () => {
  const h = await mount(A)
  await h.play(5)
  await h.emit('playingChange', { isPlaying: false }, { playing: false })
  await h.advance(15_100)
  assert.ok(logged('warn', 'PLAYBACK_STALL_CONFIRMED'))
  await untilReplaceCount(h, 2)
  await h.advance(14_000)
  assert.equal(h.result.timedOut, true)
  matchTimeline('stall-reconnect-timeout')
  await h.unmount()
})

test('เปลี่ยนช่อง → player ใหม่ + โหลดใหม่ + นับ 15 วิ ใหม่', async () => {
  const h = await mount(A)
  await h.play(3)
  await h.setChannel(B)
  assert.equal(h.result.loading, true)
  assert.equal(trace.ofKind('player.replace').at(-1)[3], B.url)
  await h.advance(14_000)
  await h.play(2)
  assert.equal(h.result.loading, false)
  await h.advance(5_000)
  assert.equal(h.result.timedOut, false)
  matchTimeline('switch-channel')
  await h.unmount()
})

test('ช่องเดิมได้ URL ต่ออายุระหว่างดูปกติ → ไม่ขึ้นจอโหลด', async () => {
  const h = await mount(A)
  await h.play(3)
  const loadsBefore = count('log.info', (e) => e[2] === 'CHANNEL_LOAD_INITIATED')
  await h.setChannel(A_RENEWED)
  assert.equal(h.result.loading, false)
  assert.equal(count('log.info', (e) => e[2] === 'CHANNEL_LOAD_INITIATED'), loadsBefore)
  matchTimeline('same-channel-url-renewed')
  await h.unmount()
})

test('หน้าหลักภาพนิ่ง → ไม่โหลดวิดีโอ · สลับไปช่องแล้วกลับหน้าหลัก ล้าง timer', async () => {
  const h = await mount(MAIN)
  assert.equal(h.result.isMain, true)
  assert.equal(h.result.loading, false)
  assert.ok(logged('info', 'MAIN_STILL_CHANNEL_ACTIVE'))
  assert.equal(count('player.replace'), 0)

  await h.setChannel(A)
  assert.equal(h.result.loading, true)
  await h.advance(3_000)
  await h.setChannel(MAIN)
  await h.advance(20_000)
  assert.equal(h.result.timedOut, false)
  assert.equal(h.result.loading, false)
  matchTimeline('main-still')
  await h.unmount()
})

test('reconnect แล้วหา URL ไม่ได้ → error noUrl', async () => {
  const h = await mount(A)
  ch3Control.onResolve(async () => null)
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await h.advance(2_500)
  assert.equal(h.result.error, 'noUrl')
  assert.equal(h.result.loading, false)
  matchTimeline('reconnect-no-url')
  await h.unmount()
})

test('กลับจากสแตนด์บายแล้วภาพไม่เล่น → สั่ง play', async () => {
  const h = await mount(A)
  await h.play(3)
  h.player.playing = false
  const playsBefore = count('player.play')
  await h.appState('active')
  assert.equal(count('player.play'), playsBefore + 1)
  assert.ok(logged('info', 'APP_STATE_ACTIVE'))
  matchTimeline('resume-from-standby')
  await h.unmount()
})

test('ช่อง 3: ต่ออายุตอนเริ่มเล่น + ตรวจทุก 5 นาที ต่ออายุเมื่อใกล้หมด', async () => {
  const h = await mount(CH3)
  assert.ok(trace.ofKind('ch3.renew').some((e) => e[2] === 'player_channel_load'))
  await h.play(3)
  await h.advance(300_000)
  assert.ok(trace.ofKind('ch3.renew').some((e) => e[2] === 'player_heartbeat_proactive' && e[3] === true))
  matchTimeline('ch3-proactive-renew')
  await h.unmount()
})

test('unmount แล้วไม่มี timer ค้างทำงานต่อ', async () => {
  const h = await mount(A)
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await h.unmount()
  const after = trace.entries().length
  await h.advance(70_000)
  assert.equal(trace.entries().length, after)
  matchTimeline('unmount-clears-timers')
})

test('แหล่งหลักพัง → สลับไปแหล่งสำรองที่สถานะดีที่สุด (up ก่อน unknown) · แจ้ง backend ครั้งเดียว', async () => {
  const h = await mount(MULTI, { reportFailures: true })
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  await untilReplaceCount(h, 2)
  assert.equal(trace.ofKind('player.replace').at(-1)[3], MULTI.sources[2].url, 'ต้องเลือก c (up) ก่อน b (unknown)')
  assert.ok(logged('warn', 'SOURCE_FAILOVER'))
  assert.deepEqual(trace.ofKind('cb.playbackFailure').map((e) => e.slice(2)), [['ch-multi', MULTI.url, 'Source error']])

  await h.play(3)
  assert.equal(h.result.loading, false)
  assert.equal(count('cb.playbackFailure'), 1, 'แจ้งครั้งเดียวต่อการโหลด')
  matchTimeline('source-failover-best-status')
  await h.unmount()
})

test('สำรองพังต่อ → ลองแหล่งที่เหลือ · ลองครบทุกแหล่งแล้ว → เริ่มวนใหม่และถาม backend', async () => {
  const h = await mount(MULTI, { refreshResult: null })
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await h.advance(100)
    await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
    await untilReplaceCount(h, attempt + 1)
  }
  const urls = trace.ofKind('player.replace').map((e) => e[3])
  assert.deepEqual(urls.slice(0, 3), [MULTI.sources[0].url, MULTI.sources[2].url, MULTI.sources[1].url])
  assert.equal(count('cb.refreshChannel'), 1, 'ลองครบทุกแหล่ง → ถาม backend')
  matchTimeline('source-failover-exhausted')
  await h.unmount()
})

test('ภาพไม่มาใน 15 วิ (ไม่มี error) → แจ้ง backend ด้วยเหตุผล load_timeout', async () => {
  const h = await mount(MULTI, { reportFailures: true })
  await h.advance(15_100)
  assert.equal(h.result.timedOut, true)
  assert.deepEqual(trace.ofKind('cb.playbackFailure').map((e) => e[4]), ['load_timeout'])
  matchTimeline('timeout-reports-failure')
  await h.unmount()
})

test('backend สลับแหล่งให้ (url ของช่องเปลี่ยน) ระหว่างที่จอยังโหลดไม่ขึ้น → โหลดแหล่งใหม่ทันที', async () => {
  const h = await mount(MULTI)
  await h.advance(3_000)
  await h.setChannel({ ...MULTI, url: MULTI.sources[2].url })
  assert.equal(trace.ofKind('player.replace').at(-1)[3], MULTI.sources[2].url)
  await h.play(2)
  assert.equal(h.result.loading, false)
  matchTimeline('server-failover-while-loading')
  await h.unmount()
})

test('พังหลายครั้งในการโหลดเดียว → แจ้ง backend ครั้งเดียว · เปลี่ยนช่องแล้วแจ้งใหม่ได้', async () => {
  const h = await mount(MULTI, { reportFailures: true })
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await h.advance(100)
    await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
    await untilReplaceCount(h, attempt + 1)
  }
  assert.equal(count('cb.playbackFailure'), 1)

  await h.setChannel({ ...MULTI, id: 'ch-other' })
  await h.emit('statusChange', { status: 'error', error: { message: 'Source error' } })
  assert.equal(count('cb.playbackFailure'), 2, 'โหลดใหม่ (ช่องใหม่) แจ้งได้อีกครั้ง')
  matchTimeline('report-once-per-load')
  await h.unmount()
})
