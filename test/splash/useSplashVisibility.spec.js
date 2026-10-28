/**
 * หน้าเปิดแอป: โชว์อย่างน้อย min · ซ่อนเมื่อพร้อม · ไม่พร้อมก็ซ่อนเองที่ max
 */
import { afterEach, mock, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { act, create } from 'react-test-renderer'
import { useSplashVisibility } from '../../src/components/splash/useSplashVisibility.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const OPTS = { minMs: 1500, maxMs: 6000 }

async function mount(ready) {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
  let visible
  let props = { ready }
  function Probe(p) {
    visible = useSplashVisibility(p.ready, OPTS)
    return null
  }
  let renderer
  await act(async () => {
    renderer = create(createElement(Probe, props))
  })
  return {
    get visible() {
      return visible
    },
    async advance(ms) {
      await act(async () => mock.timers.tick(ms))
    },
    async setReady(value) {
      props = { ready: value }
      await act(async () => renderer.update(createElement(Probe, props)))
    },
  }
}

afterEach(() => mock.timers.reset())

test('รายการช่องมาเร็ว → ยังโชว์จนครบเวลาขั้นต่ำ', async () => {
  const s = await mount(false)
  await s.advance(200)
  await s.setReady(true)
  await s.advance(1200)
  assert.equal(s.visible, true)
  await s.advance(200)
  assert.equal(s.visible, false)
})

test('พร้อมหลังเวลาขั้นต่ำ → ซ่อนทันที', async () => {
  const s = await mount(false)
  await s.advance(3000)
  assert.equal(s.visible, true)
  await s.setReady(true)
  await s.advance(0)
  assert.equal(s.visible, false)
})

test('เซิร์ฟเวอร์ไม่ตอบ → ซ่อนเองที่เวลาสูงสุด', async () => {
  const s = await mount(false)
  await s.advance(5900)
  assert.equal(s.visible, true)
  await s.advance(200)
  assert.equal(s.visible, false)
})

test('ซ่อนแล้วไม่กลับมาอีกแม้ ready เปลี่ยนไปมา', async () => {
  const s = await mount(true)
  await s.advance(1600)
  assert.equal(s.visible, false)
  await s.setReady(false)
  await s.setReady(true)
  await s.advance(10_000)
  assert.equal(s.visible, false)
})
