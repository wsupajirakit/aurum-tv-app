/**
 * render hook จริงด้วย react-test-renderer + นาฬิกาจำลอง (node:test mock.timers)
 * ทุกการเลื่อนเวลาทำใน act() ทีละช่วงสั้น และ flush promise ระหว่างช่วง
 * → setTimeout / setInterval / Date.now / async ของ hook เดินตามลำดับเหมือนบนเครื่องจริง
 */
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { mock } from 'node:test'
import { trace } from './trace.js'
import { AppState } from './stubs/react-native.js'
import { latestPlayer, resetPlayers } from './stubs/expo-video.js'
import { ch3Control } from './stubs/ch3.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const FAKE_EPOCH_MS = Date.UTC(2026, 9, 27, 12, 0, 0)
const STEP_MS = 100
const MICROTASK_FLUSHES = 10

async function flushMicrotasks() {
  for (let i = 0; i < MICROTASK_FLUSHES; i += 1) await Promise.resolve()
}

/**
 * @param {Function} useHook hook ที่ทดสอบ
 * @param {{ channel: object, refreshResult?: object|null }} options
 */
/** คืนนาฬิกาจริง — เรียกใน afterEach */
export function restoreClock() {
  mock.timers.reset()
}

export async function mountPlayer(useHook, { channel, refreshResult = null, reportFailures = false }) {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: FAKE_EPOCH_MS })
  resetPlayers()
  ch3Control.reset()
  trace.reset()

  let output = null
  let lastSnapshot = ''
  let refreshValue = refreshResult
  const callbacks = {
    onPlayStateChange: (isPlaying) => trace.push('cb.playState', isPlaying),
    onRefreshChannel: async (id) => {
      trace.push('cb.refreshChannel', id)
      return refreshValue
    },
    // ส่งเฉพาะสถานการณ์ที่ทดสอบการแจ้ง backend (สถานการณ์เดิมไม่มี callback นี้ ไทม์ไลน์จึงคงเดิม)
    ...(reportFailures
      ? { onPlaybackFailure: ({ channelId, url, reason }) => trace.push('cb.playbackFailure', channelId, url, reason) }
      : {}),
  }

  function Probe(props) {
    output = useHook(props)
    const snapshot = JSON.stringify({
      isMain: output.isMain,
      loading: output.loading,
      error: output.error,
      timedOut: output.timedOut,
    })
    if (snapshot !== lastSnapshot) {
      lastSnapshot = snapshot
      trace.push('state', JSON.parse(snapshot))
    }
    return null
  }

  let props = { channel, ...callbacks }
  let renderer
  await act(async () => {
    renderer = create(createElement(Probe, props))
    await flushMicrotasks()
  })

  const h = {
    get result() {
      return output
    },
    get player() {
      return latestPlayer()
    },
    /** เลื่อนเวลาจำลองไปข้างหน้า */
    async advance(ms) {
      for (let elapsed = 0; elapsed < ms; elapsed += STEP_MS) {
        await act(async () => {
          mock.timers.tick(Math.min(STEP_MS, ms - elapsed))
          await flushMicrotasks()
        })
      }
    },
    /** ยิง event ของ player ปัจจุบัน */
    async emit(event, payload, { playing } = {}) {
      await act(async () => {
        if (playing !== undefined) latestPlayer().playing = playing
        latestPlayer().emit(event, payload)
        await flushMicrotasks()
      })
    },
    /** จำลองภาพเดินปกติ n วินาที (timeUpdate ทุกวินาทีเหมือน timeUpdateEventInterval = 1) */
    async play(seconds, { from = 0 } = {}) {
      latestPlayer().playing = true
      for (let i = 1; i <= seconds; i += 1) {
        await h.emit('timeUpdate', { currentTime: from + i })
        await h.advance(1000)
      }
    },
    async setChannel(next) {
      props = { ...props, channel: next }
      await act(async () => {
        renderer.update(createElement(Probe, props))
        await flushMicrotasks()
      })
    },
    async manualRetry() {
      await act(async () => {
        output.manualRetry()
        await flushMicrotasks()
      })
    },
    async appState(state) {
      await act(async () => {
        AppState.__emit(state)
        await flushMicrotasks()
      })
    },
    setRefreshResult(value) {
      refreshValue = value
    },
    async unmount() {
      await act(async () => {
        renderer.unmount()
        await flushMicrotasks()
      })
    },
  }
  return h
}
