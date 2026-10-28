/**
 * expo-video จำลอง
 * - useVideoPlayer สร้าง player ใหม่ทุกครั้งที่ source เปลี่ยน (เหมือนของจริง: useReleasingSharedObject
 *   ผูก deps กับ JSON.stringify(source)) แล้วเรียก setup(player) ทันที
 * - player ไม่ยิง event เอง — เทสเป็นคนสั่ง emit ทุกจังหวะ (ควบคุมได้ 100%)
 */
import { useEffect, useMemo, useRef } from 'react'
import { trace } from '../trace.js'

let seq = 0
export const players = []

export class FakePlayer {
  constructor(source) {
    this.id = ++seq
    this.source = source
    this.playing = false
    this.listeners = new Map()
    this.released = false
    players.push(this)
    trace.push('player.create', this.id, source?.uri ?? null)
  }
  addListener(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(cb)
    return { remove: () => this.listeners.get(event)?.delete(cb) }
  }
  emit(event, payload) {
    for (const cb of [...(this.listeners.get(event) || [])]) cb(payload)
  }
  replace(source) {
    this.source = source
    trace.push('player.replace', this.id, source?.uri ?? null)
  }
  play() {
    trace.push('player.play', this.id)
  }
  pause() {
    trace.push('player.pause', this.id)
  }
  release() {
    this.released = true
    trace.push('player.release', this.id)
  }
  set bufferOptions(value) {
    trace.push('player.bufferOptions', this.id, value)
  }
  set timeUpdateEventInterval(value) {
    trace.push('player.timeUpdateInterval', this.id, value)
  }
  set loop(value) {
    trace.push('player.loop', this.id, value)
  }
}

export function useVideoPlayer(source, setup) {
  const key = JSON.stringify(source)
  const toRelease = useRef(null)
  const current = useRef(null)
  const player = useMemo(() => {
    toRelease.current = current.current
    const created = new FakePlayer(source)
    setup?.(created)
    current.current = created
    return created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  useEffect(() => {
    if (toRelease.current) {
      toRelease.current.release()
      toRelease.current = null
    }
  }, [player])
  return player
}

export const latestPlayer = () => players[players.length - 1]
export function resetPlayers() {
  players.length = 0
  seq = 0
}
