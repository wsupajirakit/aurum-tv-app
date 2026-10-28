# Aurum TV — Android TV / Apple TV app

Expo SDK 57 · `react-native-tvos` 0.86 · `expo-video`

**[English](#english)** · **[ภาษาไทย](#ภาษาไทย)**

---

<a id="english"></a>

## English

A live-TV player for Android TV and Apple TV. It pairs with the **Aurum TV API** backend (Go), which serves the channel list, keeps stream links healthy and switches to backup sources automatically.

### Features

- **Channel rail:** a sidebar collapses to a slim avatar rail so it never covers the video, and expands while you browse.
- **Remote, mouse and air-mouse:** neon focus highlight, readable from across the room.
- **HLS playback with self-recovery:**
  - Automatic reconnect with back-off.
  - Stall detection and watchdogs.
  - **Switches to the channel's next backup source on its own.**
- **15-second load timeout:** if a channel shows no picture within 15 s, the app asks the user to press **OK** (reload) or choose another channel.
- **English / Thai:** every label is translated. Switch language in **⚙️ Settings** at the top of the sidebar; the default is English.
- **Signed API traffic:** every request is HMAC-signed, using a session token that renews itself, so the app never loses its connection to the backend.
- **4K brand artwork** for 55-inch screens: a full-screen splash and the home still image.

### Requirements

- Node.js 20+.
- **A native build is required.** Expo Go does not support TV (`react-native-tvos`).
- Android TV device or emulator, or Xcode for tvOS.
- A running Aurum TV API backend.

### Quick start

```bash
npm install
cp .env.example .env        # set the backend URL and HMAC key (see Configuration)
npm run android             # Android TV (sets EXPO_TV=1)
npm run ios                 # Apple TV (tvOS simulator or device)
```

- **Real TV box:** enable Developer options, run `adb connect <box-ip>:5555`, then `npm run android`.
- **After changing `app.json` or native dependencies:** run `npm run prebuild`.

### Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend URL. Emulator: `http://10.0.2.2:3000` · device on your LAN: `http://<computer-ip>:3000` · production: `https://<your-domain>` |
| `EXPO_PUBLIC_HMAC_KEY_ID` | Key id, matching the backend's `HMAC_KEYS` (e.g. `tv1`) |
| `EXPO_PUBLIC_HMAC_SECRET` | The same secret as the backend's `HMAC_KEYS` |

- Without the HMAC values the app cannot load channels from a backend running in its default `enforce` mode.
- Everything in `.env` is baked into the APK. **Never put the backend admin `API_KEY` there.**
- `localhost` does not work on a TV box (it points to the box itself).
- **Generating a key pair:** in the backend repository, `go run ./cmd/aurumctl genkey` prints `HMAC_KEYS` for the server and the matching `EXPO_PUBLIC_HMAC_*` values for this file.

### Backend contract

The app relies on this contract with the backend. The Go backend keeps it unchanged.

- **Signature v1:** `base64url(HMAC-SHA256(secret, "v1\n{METHOD}\n{path+query}\n{ts}\n{nonce}\n{sha256hex(body)}"))`, sent in the headers `X-TV-Key-Id`, `X-TV-Timestamp`, `X-TV-Nonce`, `X-TV-Signature`. `npm run verify:signer` checks it against the backend's test vector.
- **Clock:** the app adopts `serverTime` from the `X-Tv-Server-Time` header and from `401` bodies. On `clock_skew` or `replayed` it re-signs once.
- **Sessions:** `POST /api/session` starts a session, and `POST /api/session/refresh` rotates the tokens before they expire. On `access_token_invalid`, `access_token_missing` or `session_revoked` the app gets a fresh token and retries once. If the refresh fails, it opens a new session with its HMAC key.
- **Channels:** each channel carries `sources[]` with `status` and `priority`, plus `activeSourceId`. Change detection uses `updatedAt` from `/api/health`.
- **Fire-and-forget calls:** `sync`, `report` and `logs` never block playback; their errors are ignored by design.

This was verified by running the app's own `src/api` code (bundled for Node, with only the native storage and React Native stubbed) against the Go backend:
- session bootstrap
- signed reads and writes
- refusal of a foreign-host sync
- recovery from a 20-minute clock skew
- continued work after the access token expires

### Remote control

| Button | Action |
|---|---|
| ▲ ▼ | Browse channels (does not switch by itself) |
| OK | Play the focused channel |
| CH+ / CH− | Next / previous channel |
| ▲ from the first channel | Top menu: 🔄 Reload · ⚙️ Settings (press ▶ for the gear) |
| Back (in Settings) | Close Settings |

### Self-healing playback

- **Where sources come from:** the backend sends each channel with `sources[]` (primary + backups), each with a health `status` (`up` / `unknown` / `down`).
- **Local failover:** when the current link fails, the player moves to the next source, ranked by status and then priority. It skips links that already failed during this load.
- **When everything has failed:** once every source has been tried, it starts over and asks the backend for a fresh link.
- **Reporting:** the app reports a failure **once per load**. The backend re-checks the sources for real and switches every TV if needed.
- **No channel-specific code:** channel names, IDs and links never appear in the app's code; everything comes from data.

### Brand artwork

| Change | Where |
|---|---|
| Home screen still image | `src/config/brand.js` → `homeWallpaper` |
| Full-screen splash | `src/config/brand.js` → `splashImage` |
| Native splash logo (before JS loads) | `app.json` → `expo.splash.image` (needs a new APK) |
| Regenerate the artwork | `npm run assets:brand` (`scripts/render-brand-assets.mjs`; edit `BRAND_NAME` there) |

### Project structure

```
App.js                    LanguageProvider + session keeper → TvScreen
src/
  screens/                TvScreen (player, sidebar, badge, settings, splash)
  config/                 env · timing · player · channels · sources · layout · brand · splash · storageKeys
  theme/                  colors (named by purpose) · palette
  i18n/                   en · th (same keys) · LanguageProvider (useI18n)
  api/                    hmac · signer · clock · transport · session · client · channels · health · logs
  services/               sources (failover rules) · ch3 (ch3plus resolver) · logger · storage
  hooks/                  useChannels · useLoadTimeout · useChannelBadge
  components/             player (+ controller/ hooks) · loading · sidebar · settings · splash · common
scripts/                  verify-signer.mjs · render-brand-assets.mjs
test/                     behaviour tests (Node, no TV needed)
```

Rules for contributors:
- Values go in `config/`, colours in `theme/`, and text in `i18n/` (both languages).
- No channel-specific logic.

### Tests (no TV or emulator needed)

```bash
npm test                        # player, splash and source-selection tests
npm run test:update-snapshots   # only after an intended behaviour change
npm run verify:signer           # HMAC test vector must match the backend
```

CI (`.github/workflows/ci.yml`) runs `verify:signer` and `npm test` on every push.

- **How the player tests work:** they render the real hooks with `react-test-renderer`, against a fake `expo-video` player and a simulated clock.
- **Snapshot comparison:** each scenario's full timeline is compared with `test/__snapshots__/player-trace.json`.

### Build a standalone APK

```bash
npx expo export -p android --output-dir dist
cp dist/_expo/static/js/android/index-*.hbc android/app/src/main/assets/index.android.bundle
cp -r dist/assets android/app/src/main/assets/
cd android && ./gradlew assembleRelease --no-daemon
# → android/app/build/outputs/apk/release/app-release.apk  (install: adb install -r <apk>)
```

The app id is `tv.aurum.live`.

---

<a id="ภาษาไทย"></a>

## ภาษาไทย

แอปดูทีวีสดสำหรับ Android TV และ Apple TV ทำงานคู่กับ backend **Aurum TV API** (Go) ซึ่งให้รายการช่อง ดูแลให้ลิงก์สตรีมใช้งานได้ และสลับไปแหล่งสำรองให้อัตโนมัติ

### ความสามารถ

- **แถบช่อง:** ย่อเป็นแถบ avatar ไม่บังวิดีโอ และกางออกเมื่อเลื่อนดูช่อง
- **รีโมต เมาส์ และ air-mouse:** ไฮไลต์โฟกัสแบบนีออน มองเห็นชัดจากระยะไกล
- **เล่น HLS และกู้คืนตัวเอง:**
  - reconnect อัตโนมัติแบบเว้นระยะ
  - ตรวจจับภาพค้างและมี watchdog
  - **สลับไปแหล่งสำรองของช่องเอง**
- **timeout 15 วินาที:** ช่องไหนภาพไม่ขึ้นใน 15 วินาที แอปจะให้กด **ตกลง** (โหลดใหม่) หรือเลือกช่องอื่น
- **อังกฤษ / ไทย:** แปลครบทุกข้อความ เปลี่ยนภาษาได้ที่ **⚙️ ตั้งค่า** บนสุดของแถบช่อง ค่าเริ่มต้นเป็นภาษาอังกฤษ
- **คุยกับ API แบบมีลายเซ็น:** ทุก request เซ็นด้วย HMAC และใช้ session token ที่ต่ออายุเอง แอปจึงไม่หลุดการเชื่อมต่อกับ backend
- **ภาพแบรนด์ 4K** สำหรับจอ 55 นิ้ว ทั้งหน้าเปิดแอปเต็มจอและภาพนิ่งหน้าหลัก

### สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป
- **ต้อง build เป็นแอปจริง** Expo Go ไม่รองรับทีวี (`react-native-tvos`)
- กล่องหรือ emulator Android TV หรือ Xcode สำหรับ tvOS
- backend Aurum TV API ที่รันอยู่

### เริ่มใช้งาน

```bash
npm install
cp .env.example .env        # ตั้ง URL ของ backend และคีย์ HMAC (ดูหัวข้อการตั้งค่า)
npm run android             # Android TV (ตั้ง EXPO_TV=1 ให้แล้ว)
npm run ios                 # Apple TV (tvOS simulator หรือเครื่องจริง)
```

- **กล่องทีวีจริง:** เปิด Developer options แล้วรัน `adb connect <ไอพีกล่อง>:5555` ตามด้วย `npm run android`
- **แก้ `app.json` หรือ native dependency:** รัน `npm run prebuild`

### การตั้งค่า (`.env`)

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL ของ backend · emulator: `http://10.0.2.2:3000` · เครื่องในบ้าน: `http://<ไอพีเครื่อง>:3000` · production: `https://<โดเมนของคุณ>` |
| `EXPO_PUBLIC_HMAC_KEY_ID` | id ของคีย์ ตรงกับ `HMAC_KEYS` ของ backend (เช่น `tv1`) |
| `EXPO_PUBLIC_HMAC_SECRET` | secret ตัวเดียวกับใน `HMAC_KEYS` ของ backend |

- ถ้าไม่ตั้งค่า HMAC แอปจะดึงช่องจาก backend ที่รันด้วยค่าเริ่มต้น (`enforce`) ไม่ได้
- ทุกค่าใน `.env` ถูกฝังลงใน APK **ห้ามใส่ `API_KEY` แอดมินของ backend**
- `localhost` ใช้บนกล่องทีวีไม่ได้ เพราะจะหมายถึงตัวกล่องเอง
- **สร้างคู่คีย์:** ใน repo ของ backend รัน `go run ./cmd/aurumctl genkey` จะได้ `HMAC_KEYS` สำหรับเซิร์ฟเวอร์ และค่า `EXPO_PUBLIC_HMAC_*` ที่คู่กันสำหรับไฟล์นี้

### ข้อตกลงกับ backend

แอปพึ่งข้อตกลงต่อไปนี้กับ backend และ backend ที่เป็น Go คงไว้เหมือนเดิมทุกข้อ

- **ลายเซ็น v1:** `base64url(HMAC-SHA256(secret, "v1\n{METHOD}\n{path+query}\n{ts}\n{nonce}\n{sha256hex(body)}"))` ส่งใน header `X-TV-Key-Id`, `X-TV-Timestamp`, `X-TV-Nonce`, `X-TV-Signature` ตรวจกับ test vector ของ backend ได้ด้วย `npm run verify:signer`
- **นาฬิกา:** แอปปรับเวลาตาม `serverTime` จาก header `X-Tv-Server-Time` และจาก body ของ `401` ถ้าได้ `clock_skew` หรือ `replayed` จะเซ็นใหม่หนึ่งครั้ง
- **Session:** `POST /api/session` เปิด session และ `POST /api/session/refresh` หมุน token ก่อนหมดอายุ ถ้าได้ `access_token_invalid`, `access_token_missing` หรือ `session_revoked` แอปจะขอ token ใหม่แล้วลองอีกครั้ง ถ้า refresh ไม่ผ่านจะเปิด session ใหม่ด้วยคีย์ HMAC
- **ช่อง:** แต่ละช่องมี `sources[]` พร้อม `status` และ `priority` และมี `activeSourceId` ส่วนการตรวจว่ามีอะไรเปลี่ยนใช้ `updatedAt` จาก `/api/health`
- **คำสั่งที่ส่งแล้วไม่รอผล:** `sync`, `report` และ `logs` ไม่ขวางการเล่น และตั้งใจไม่สนใจ error ของคำสั่งเหล่านี้

ตรวจแล้วโดยนำโค้ด `src/api` ของแอปเอง (bundle ให้รันบน Node โดยจำลองเฉพาะ storage แบบ native และ React Native) ไปรันกับ backend ที่เป็น Go:
- การเปิด session
- การอ่านและเขียนแบบมีลายเซ็น
- การปฏิเสธ sync จากโฮสต์ภายนอก
- การกู้คืนเมื่อนาฬิกาคลาดไป 20 นาที
- การทำงานต่อได้หลัง access token หมดอายุ

### ปุ่มบนรีโมต

| ปุ่ม | ทำอะไร |
|---|---|
| ▲ ▼ | เลื่อนดูช่อง (ไม่สลับช่องเอง) |
| OK | เล่นช่องที่เลือก |
| CH+ / CH− | ช่องถัดไป / ก่อนหน้า |
| ▲ จากช่องแรก | เมนูบนสุด: 🔄 รีโหลด · ⚙️ ตั้งค่า (กด ▶ ไปที่ฟันเฟือง) |
| Back (ในหน้าตั้งค่า) | ปิดหน้าตั้งค่า |

### การเล่นที่กู้คืนตัวเอง

- **แหล่งสตรีมมาจากไหน:** backend ส่งช่องมาพร้อม `sources[]` (หลัก + สำรอง) แต่ละแหล่งมีสถานะ `up` / `unknown` / `down`
- **สลับเอง:** ลิงก์ที่เล่นอยู่พัง ตัวเล่นจะสลับไปแหล่งถัดไป เรียงตามสถานะแล้วตาม priority และข้ามลิงก์ที่พังไปแล้วในการโหลดครั้งนั้น
- **ถ้าพังทุกแหล่ง:** ลองครบแล้วจะเริ่มวนใหม่ และถาม backend หาลิงก์ใหม่
- **การแจ้ง backend:** แอปแจ้ง **ครั้งเดียวต่อการโหลด** แล้ว backend จะตรวจแหล่งจริงอีกรอบ และสลับให้ทีวีทุกเครื่องถ้าจำเป็น
- **ไม่มีโค้ดเฉพาะช่อง:** ไม่มีชื่อช่อง id หรือลิงก์ฝังอยู่ในโค้ดแอป ทุกอย่างอ่านจากข้อมูล

### ภาพแบรนด์

| อยากเปลี่ยน | แก้ที่ |
|---|---|
| ภาพนิ่งหน้าหลัก | `src/config/brand.js` → `homeWallpaper` |
| หน้าเปิดแอปเต็มจอ | `src/config/brand.js` → `splashImage` |
| โลโก้ native splash (ก่อน JS โหลด) | `app.json` → `expo.splash.image` (ต้อง build APK ใหม่) |
| สร้างภาพใหม่ | `npm run assets:brand` (`scripts/render-brand-assets.mjs` แก้ชื่อแบรนด์ที่ `BRAND_NAME`) |

### โครงสร้างโปรเจกต์

```
App.js                    LanguageProvider + session keeper → TvScreen
src/
  screens/                TvScreen (ตัวเล่น, แถบช่อง, ป้ายช่อง, ตั้งค่า, หน้าเปิด)
  config/                 env · timing · player · channels · sources · layout · brand · splash · storageKeys
  theme/                  colors (ตั้งชื่อตามหน้าที่) · palette
  i18n/                   en · th (key ต้องตรงกัน) · LanguageProvider (useI18n)
  api/                    hmac · signer · clock · transport · session · client · channels · health · logs
  services/               sources (กฎสลับแหล่ง) · ch3 (resolver ch3plus) · logger · storage
  hooks/                  useChannels · useLoadTimeout · useChannelBadge
  components/             player (+ hook ใน controller/) · loading · sidebar · settings · splash · common
scripts/                  verify-signer.mjs · render-brand-assets.mjs
test/                     เทสพฤติกรรม (รันใน Node ไม่ต้องมีทีวี)
```

กติกาสำหรับคนแก้โค้ด:
- ค่าต่าง ๆ อยู่ใน `config/` สีอยู่ใน `theme/` ข้อความอยู่ใน `i18n/` (ครบทั้งสองภาษา)
- ห้ามมีตรรกะเฉพาะช่อง

### เทส (ไม่ต้องมีทีวีหรือ emulator)

```bash
npm test                        # เทสตัวเล่น หน้าเปิด และการเลือกแหล่ง
npm run test:update-snapshots   # ใช้เมื่อตั้งใจเปลี่ยนพฤติกรรมเท่านั้น
npm run verify:signer           # test vector ของ HMAC ต้องตรงกับ backend
```

CI (`.github/workflows/ci.yml`) รัน `verify:signer` และ `npm test` ทุกครั้งที่ push

- **เทสตัวเล่นทำงานอย่างไร:** render hook จริงด้วย `react-test-renderer` กับ player `expo-video` จำลองและนาฬิกาจำลอง
- **เทียบ snapshot:** ไทม์ไลน์ทั้งหมดของแต่ละสถานการณ์ถูกเทียบกับ `test/__snapshots__/player-trace.json`

### Build APK แบบ standalone

```bash
npx expo export -p android --output-dir dist
cp dist/_expo/static/js/android/index-*.hbc android/app/src/main/assets/index.android.bundle
cp -r dist/assets android/app/src/main/assets/
cd android && ./gradlew assembleRelease --no-daemon
# → android/app/build/outputs/apk/release/app-release.apk  (ติดตั้ง: adb install -r <apk>)
```

รหัสแอปคือ `tv.aurum.live`
