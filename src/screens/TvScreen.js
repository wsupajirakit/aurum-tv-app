import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StatusBar, StyleSheet, useTVEventHandler, View } from 'react-native'
import { fetchChannel, reportPlaybackFailure } from '../api'
import { LAYOUT, MAIN_CHANNEL_ID } from '../config'
import { useChannelBadge } from '../hooks/useChannelBadge'
import { useChannels } from '../hooks/useChannels'
import { useI18n } from '../i18n'
import { isCh3, renewCh3Auto, onCh3UrlUpdated, getCh3CachedUrl } from '../services/ch3'
import { logState } from '../services/logger'
import { colors } from '../theme'
import { ChannelBadge } from '../components/common/ChannelBadge'
import { Player } from '../components/player'
import { SettingsPanel } from '../components/settings'
import { AppSplash } from '../components/splash'
import { Sidebar } from '../components/sidebar'

/** ช่องภาพนิ่งหน้าหลัก — ชื่อ/กลุ่มเติมตามภาษาตอนแสดงผล (state เก็บแค่ตัวนี้ ไม่ผูกกับภาษา) */
const MAIN_CHANNEL = {
  id: MAIN_CHANNEL_ID,
  isMain: true,
  type: 'image',
  enabled: true,
}

/**
 * หน้าจอหลักของทีวี: ตัวเล่น (เต็มจอ) + แถบช่องด้านซ้าย + ป้ายชื่อช่อง + หน้าตั้งค่า
 * รีโมต: ▲▼ เลื่อน · OK เลือกช่อง · CH+/CH- สลับช่อง · ⚙️ บนสุดเปิดตั้งค่า
 */
export function TvScreen() {
  const { t } = useI18n()
  const { channels: remoteChannels, status, error, reload } = useChannels()
  const mainChannel = useMemo(
    () => ({ ...MAIN_CHANNEL, name: t('main.name'), group: t('main.group') }),
    [t],
  )
  const channels = useMemo(
    () => [mainChannel, ...(remoteChannels || [])],
    [mainChannel, remoteChannels],
  )

  // เข้ามาครั้งแรกจะอยู่หน้าหลักที่เป็นภาพนิ่งเสมอจนกว่าจะเลือกช่องใหม่
  const [playing, setPlaying] = useState(MAIN_CHANNEL)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const badge = useChannelBadge()
  const showBadgeBriefly = badge.showBriefly

  const settingsOpenRef = useRef(settingsOpen)
  settingsOpenRef.current = settingsOpen
  const playingRef = useRef(playing)
  playingRef.current = playing
  // callback ที่ส่งให้ Player ต้องคงที่ → อ่านรายการช่องล่าสุดผ่าน ref (ไม่ใส่ใน deps)
  const remoteChannelsRef = useRef(remoteChannels)
  remoteChannelsRef.current = remoteChannels

  useEffect(() => {
    logState('APP_MOUNTED', 'TV App started', { channelCount: remoteChannels?.length || 0 })
  }, [remoteChannels?.length])

  // ซิงค์ URL ช่อง 3 ทันทีเมื่อมีการต่ออายุสำเร็จจากเบื้องหลัง
  useEffect(() => {
    return onCh3UrlUpdated((newUrl) => {
      if (!newUrl) return
      setPlaying((current) => {
        if (current && isCh3(current) && current.url !== newUrl) {
          logState('PLAYING_CH3_URL_SYNCED', 'Updated playing Channel 3 with newly renewed URL', {
            oldUrl: current.url,
            newUrl,
          }, current)
          return { ...current, url: newUrl }
        }
        return current
      })
    })
  }, [])

  const commit = useCallback(
    (channel) => {
      if (!channel) return

      let targetChannel = channel

      // ทุกครั้งที่มีการสั่งเล่นช่อง 3 ให้ต่ออายุอัตโนมัติทันที
      if (isCh3(channel)) {
        const cached = getCh3CachedUrl()
        if (cached && cached !== channel.url) {
          targetChannel = { ...channel, url: cached }
        }
        renewCh3Auto({
          channelId: channel.id,
          currentUrl: targetChannel.url,
          trigger: 'play_select_card',
          force: true,
        }).catch(() => {})
      }

      // ถ้าเป็นช่องเดิมที่กำลังเล่นอยู่แล้ว ไม่ต้องรีเซ็ต epoch ป้องกันการ reload โดยไม่จำเป็น
      if (playingRef.current?.id === targetChannel.id && !targetChannel.isMain) {
        showBadgeBriefly()
        return
      }

      logState('CHANNEL_COMMITTED', `Switching to ${targetChannel.name}`, {
        channelId: targetChannel.id,
        url: targetChannel.url,
      }, targetChannel)

      setPlaying({ ...targetChannel, _loadEpoch: Date.now() })
      showBadgeBriefly()
    },
    [showBadgeBriefly],
  )

  const zap = useCallback(
    (delta) => {
      if (channels.length === 0) return
      const current = channels.findIndex((channel) => channel.id === playing?.id)
      const base = current < 0 ? 0 : current
      const next = channels[(base + delta + channels.length) % channels.length]
      commit(next)
    },
    [channels, playing, commit],
  )

  const handleTVEvent = useCallback(
    (event) => {
      const type = event?.eventType
      if (!type || type === 'blur' || type === 'focus') return
      if (event.eventKeyAction === 1) return
      // เปิดหน้าตั้งค่าอยู่ → ปุ่ม CH+/CH- ไม่เปลี่ยนช่อง
      if (settingsOpenRef.current) return

      if (type === 'channelUp') {
        zap(1)
        return
      }
      if (type === 'channelDown') {
        zap(-1)
        return
      }
    },
    [zap],
  )

  useTVEventHandler(handleTVEvent)

  // ซิงค์การเปลี่ยนแปลงของช่องปัจจุบันเมื่อ backend อัพเดท (เช่น มีการแก้ URL หรือช่องถูกลบ)
  // จะอัพเดทเฉพาะเมื่อ URL หรือชื่อช่องเปลี่ยนจริงๆ เท่านั้น เพื่อไม่ให้กระทบการเล่นต่อเนื่อง
  useEffect(() => {
    if (!playing || playing.isMain) return
    const found = remoteChannels.find((channel) => channel.id === playing.id)
    if (!found) {
      setPlaying(MAIN_CHANNEL)
    } else if (found.url !== playing.url || found.name !== playing.name) {
      logState('CHANNEL_BACKEND_UPDATED', `Channel URL or name changed on backend: ${found.name}`, {
        oldUrl: playing.url,
        newUrl: found.url,
      }, found)

      setPlaying((current) => ({
        ...found,
        _loadEpoch: current?._loadEpoch || Date.now(),
      }))
    }
  }, [remoteChannels, playing?.id, playing?.url, playing?.name, playing?.isMain])

  const handleFocusChannel = useCallback(
    (channel) => {
      if (!channel) return

      // เมื่อเลื่อนมาโฟกัสที่การ์ดช่อง 3 ให้กระตุ้นการต่ออายุอัตโนมัติล่วงหน้าทันทีในเบื้องหลัง
      if (isCh3(channel)) {
        renewCh3Auto({
          channelId: channel.id,
          currentUrl: channel.url,
          trigger: 'focus_card',
        }).catch(() => {})
      }

      // UX: เวลาเลื่อนดูรายการช่อง จะไม่สลับช่องอัตโนมัติเด็ดขาด
      // ผู้ใช้ต้องกดปุ่มตรงกลางรีโมต (OK / Select / Center) ก่อนเท่านั้น ถึงจะสลับไปเล่นช่องนั้น
    },
    [],
  )

  const handleSelectChannel = useCallback(
    (channel) => {
      // เมื่อผู้ใช้กดปุ่มตรงกลางรีโมต (OK / Select / Center) ให้สลับไปเล่นช่องที่เลือกทันที 0ms
      commit(channel)
    },
    [commit],
  )

  // ดึง URL ล่าสุดกรณีสตรีมหลุดและสงสัยว่าลิงก์เดิมหมดอายุ
  const handleRefreshChannel = useCallback(async (channelId) => {
    if (!channelId || channelId === MAIN_CHANNEL.id) return null
    try {
      logState('FETCH_FRESH_URL_REQUEST', `Requesting fresh channel URL for ${channelId}`, { channelId })

      let freshUrl = null
      const known = remoteChannelsRef.current.find((c) => c.id === channelId)
      if (isCh3(known)) {
        freshUrl = await renewCh3Auto({
          channelId,
          trigger: 'handle_refresh_channel',
          force: true,
        })
      }

      if (!freshUrl) {
        const fresh = await fetchChannel(channelId, { refresh: true })
        freshUrl = fresh?.url
      }

      if (freshUrl) {
        setPlaying((current) => {
          if (current?.id === channelId) {
            return { ...current, url: freshUrl }
          }
          return current
        })
        logState('FETCH_FRESH_URL_SUCCESS', `Obtained fresh URL for ${channelId}`, { url: freshUrl })
        return { id: channelId, url: freshUrl }
      }
    } catch (err) {
      logState('FETCH_FRESH_URL_FAILED', `Failed to fetch fresh URL: ${err?.message}`, { error: err?.message })
    }
    return null
  }, [])

  // เล่นไม่ได้ → แจ้ง backend ให้ตรวจแหล่งจริงและสลับให้ทุกเครื่อง (ตัว player สลับแหล่งเองอยู่แล้ว)
  const handlePlaybackFailure = useCallback(({ channelId, url, reason }) => {
    reportPlaybackFailure(channelId, { url, reason })
  }, [])

  // ช่องที่กำลังเล่นแบบพร้อมแสดงผล (หน้าหลักใช้ชื่อตามภาษาปัจจุบัน)
  const playingView = playing?.isMain ? mainChannel : playing
  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* ตัวเล่นวิดีโอเต็มจอ (เว้นซ้ายเท่า rail ตอนย่อ) */}
      <View style={styles.playerWrap}>
        <Player
          channel={playingView}
          onPlayStateChange={badge.onPlayStateChange}
          onRefreshChannel={handleRefreshChannel}
          onPlaybackFailure={handlePlaybackFailure}
        />
      </View>

      {/* แถบรายการช่องทางซ้าย */}
      <Sidebar
        channels={channels}
        remoteCount={remoteChannels?.length || 0}
        status={status}
        error={error}
        playingId={playing?.id}
        onFocusChannel={handleFocusChannel}
        onSelectChannel={handleSelectChannel}
        onRetry={reload}
        onOpenSettings={openSettings}
      />

      {/* ป้ายบอกช่องมุมขวาบน — ซ่อนเองเมื่อ player เล่นแล้ว */}
      <ChannelBadge channel={playingView} visible={badge.visible} />

      <SettingsPanel visible={settingsOpen} onClose={closeSettings} />

      {/* หน้าเปิดแอป 4K — จางหายเมื่อรายการช่องพร้อม */}
      <AppSplash ready={status !== 'loading'} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  playerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: LAYOUT.playerInsetLeft, // safe margin ไม่ให้ rail ทับวิดีโอ (overlay เฉพาะตอนกาง sidebar)
    backgroundColor: colors.black,
  },
})
