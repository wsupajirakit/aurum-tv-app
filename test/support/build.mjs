/**
 * bundle เทส (test/<กลุ่ม>/*.spec.js) → test/.build/*.test.mjs ด้วย esbuild
 * แทน native module ด้วยตัวจำลองใน test/support/stubs (รันใน Node ได้ ไม่ต้องมีทีวี/emulator)
 *
 * PLAYER_IMPL=<path> ใช้สลับตัว hook ที่ทดสอบ (เช่นเทียบเวอร์ชันเก่า/ใหม่)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const testRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const appRoot = path.dirname(testRoot)
const outDir = path.join(testRoot, '.build')
const stub = (name) => path.join(testRoot, 'support', 'stubs', name)

const playerImpl = path.resolve(appRoot, process.env.PLAYER_IMPL || 'src/components/player/controller/index.js')

const STUBS = [
  { filter: /^react-native$/, path: stub('react-native.js') },
  { filter: /^expo$/, path: stub('expo.js') },
  { filter: /^expo-video$/, path: stub('expo-video.js') },
  { filter: /services\/logger(\/index(\.js)?)?$/, path: stub('logger.js') },
  { filter: /services\/ch3(\/index(\.js)?)?$/, path: stub('ch3.js') },
  { filter: /^player-under-test$/, path: playerImpl },
]

const stubPlugin = {
  name: 'tv-test-stubs',
  setup(b) {
    for (const { filter, path: target } of STUBS) b.onResolve({ filter }, () => ({ path: target }))
  },
}

const entries = fs
  .readdirSync(testRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !['support', '.build', '__snapshots__'].includes(d.name))
  .flatMap((d) =>
    fs
      .readdirSync(path.join(testRoot, d.name))
      .filter((f) => f.endsWith('.spec.js'))
      .map((f) => path.join(testRoot, d.name, f)),
  )

fs.rmSync(outDir, { recursive: true, force: true })
await build({
  entryPoints: Object.fromEntries(entries.map((f) => [path.basename(f, '.spec.js') + '.test', f])),
  outdir: outDir,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.jpg': 'empty', '.png': 'empty' },
  external: ['react', 'react/*', 'react-test-renderer', 'node:*'],
  plugins: [stubPlugin],
  logLevel: 'warning',
  define: { 'process.env.NODE_ENV': '"test"' },
})
console.log(`built ${entries.length} spec(s) → test/.build (player = ${path.relative(appRoot, playerImpl)})`)
