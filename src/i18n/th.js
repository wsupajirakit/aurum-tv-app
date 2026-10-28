/** ข้อความภาษาไทย — key ต้องตรงกับ en.js ทุกตัว */
export const th = {
  common: {
    ok: 'ตกลง',
    retry: 'ลองใหม่',
    close: 'ปิด',
  },
  main: {
    name: 'หน้าหลัก',
    group: 'ภาพนิ่ง',
  },
  sidebar: {
    title: 'ช่องทีวี',
    connecting: '⏳ กำลังเชื่อมต่อ...',
    serverDown: '⚠️ ต่อเซิร์ฟเวอร์ไม่ได้',
    channelCount: '{count} ช่อง',
    reload: 'รีโหลดช่อง',
    reloading: 'กำลังดึงรายการ...',
    settings: 'ตั้งค่า',
    errorNotice: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กดปุ่มรีโหลดเพื่อลองใหม่',
    emptyErrorTitle: 'ต่อเซิร์ฟเวอร์ไม่ได้',
    emptyTitle: 'ยังไม่มีช่อง',
    emptyText: 'เพิ่มช่องผ่าน API แล้วรายการจะขึ้นทันที',
    hint: '▲ ▼ เลื่อนดู • กด OK เพื่อเลือกช่อง',
  },
  errors: {
    timeout: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (หมดเวลารอ)',
    http: 'เซิร์ฟเวอร์ตอบ {status}',
    network: 'เครือข่ายขัดข้อง ตรวจสอบการเชื่อมต่อ',
    unknown: 'เกิดข้อผิดพลาด',
  },
  loading: {
    defaultGroup: 'สตรีมสด',
    connectingTo: 'กำลังเชื่อมต่อ {name}...',
    connecting: 'กำลังเชื่อมต่อสัญญาณถ่ายทอดสด',
    liveBroadcast: 'ถ่ายทอดสด',
  },
  player: {
    errorTitle: 'เล่นช่องนี้ไม่ได้',
    signalLost: 'สัญญาณถ่ายทอดสดขัดข้อง หรือหลุดการเชื่อมต่อชั่วคราว',
    noUrl: 'ไม่พบที่อยู่ของสตรีม',
    timeoutTitle: 'ช่องนี้โหลดนานเกินไป',
    timeoutMessage: 'กรุณากด ตกลง หรือเลือกช่องอื่น',
  },
  badge: {
    live: 'สด',
  },
  settings: {
    title: 'ตั้งค่า',
    language: 'ภาษา',
    hint: 'กด Back เพื่อปิด',
  },
  splash: {
    tagline: 'ดูทีวีสดไทย  •  Full HD  •  ทุกที่ทุกเวลา',
  },
  language: {
    en: 'English',
    th: 'ไทย',
  },
}
