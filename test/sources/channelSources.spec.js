/**
 * อ่านแหล่งสตรีมจากข้อมูลช่อง (ฟังก์ชันบริสุทธิ์)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasResolver, nextSourceUrl, rankSources, resolverSource } from '../../src/services/sources/channelSources.js'

const ch = {
  sources: [
    { id: 'p', url: 'https://p.test/a.m3u8', priority: 0, status: 'down' },
    { id: 'r', url: '', resolver: 'ch3plus', priority: 1, status: 'unknown' },
    { id: 'm1', url: 'https://m1.test/a.m3u8', priority: 2, status: 'unknown' },
    { id: 'm2', url: 'https://m2.test/a.m3u8', priority: 3, status: 'up' },
  ],
}

test('เรียงแหล่ง: up → unknown → down แล้วตาม priority · ตัดแหล่งที่ไม่มี url', () => {
  assert.deepEqual(rankSources(ch).map((s) => s.id), ['m2', 'm1', 'p'])
})

test('แหล่งถัดไปข้ามที่ลองแล้ว · ลองครบคืน null', () => {
  assert.equal(nextSourceUrl(ch, new Set()), 'https://m2.test/a.m3u8')
  assert.equal(nextSourceUrl(ch, new Set(['https://m2.test/a.m3u8'])), 'https://m1.test/a.m3u8')
  assert.equal(nextSourceUrl(ch, new Set(rankSources(ch).map((s) => s.url))), null)
})

test('รู้ว่าช่องใช้ resolver อะไรจากข้อมูล (ไม่ใช่ชื่อช่อง)', () => {
  assert.equal(resolverSource(ch, 'ch3plus').id, 'r')
  assert.ok(hasResolver(ch, 'ch3plus'))
  assert.ok(!hasResolver({ name: '3HD', sources: [] }, 'ch3plus'), 'ชื่อ 3HD อย่างเดียวไม่นับ')
  assert.ok(!hasResolver(null, 'ch3plus'))
})
