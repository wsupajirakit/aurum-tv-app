/** ข้อความภาษาอังกฤษ (ภาษาเริ่มต้น) — key ต้องตรงกับ th.js ทุกตัว */
export const en = {
  common: {
    ok: 'OK',
    retry: 'Retry',
    close: 'Close',
  },
  main: {
    name: 'Home',
    group: 'Still image',
  },
  sidebar: {
    title: 'TV Channels',
    connecting: '⏳ Connecting...',
    serverDown: '⚠️ Server unreachable',
    channelCount: '{count} channels',
    reload: 'Reload channels',
    reloading: 'Fetching list...',
    settings: 'Settings',
    errorNotice: 'Cannot reach the server. Press reload to try again.',
    emptyErrorTitle: 'Cannot reach the server',
    emptyTitle: 'No channels yet',
    emptyText: 'Add channels via the API and they will appear instantly',
    hint: '▲ ▼ Browse • Press OK to select',
  },
  errors: {
    timeout: 'Cannot connect to the server (timed out)',
    http: 'Server responded with {status}',
    network: 'Network error — check your connection',
    unknown: 'Something went wrong',
  },
  loading: {
    defaultGroup: 'Live stream',
    connectingTo: 'Connecting to {name}...',
    connecting: 'Connecting to the live broadcast',
    liveBroadcast: 'LIVE BROADCAST',
  },
  player: {
    errorTitle: 'Cannot play this channel',
    signalLost: 'The live signal was interrupted or temporarily disconnected',
    noUrl: 'Stream address not found',
    timeoutTitle: 'This channel is taking too long to load',
    timeoutMessage: 'Please press OK or choose another channel',
  },
  badge: {
    live: 'LIVE',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    hint: 'Press Back to close',
  },
  splash: {
    tagline: 'Live Thai TV  •  Full HD  •  Anytime',
  },
  language: {
    en: 'English',
    th: 'ไทย',
  },
}
