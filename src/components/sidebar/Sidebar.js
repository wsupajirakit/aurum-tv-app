import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, FlatList, StyleSheet, Text, TVFocusGuideView, useTVEventHandler, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LAYOUT, TIMING } from '../../config'
import { useI18n } from '../../i18n'
import { triggerCh3AutoRenew } from '../../services/ch3'
import { colors } from '../../theme'
import { ChannelRow } from './ChannelRow'
import { ListStatus } from './ListStatus'
import { SidebarHeader } from './SidebarHeader'
import { TopMenu } from './TopMenu'

const { expandedWidth, collapsedWidth, itemStride } = LAYOUT.sidebar
const NAV_EVENTS = ['up', 'down', 'left', 'right', 'select']
const SPRING = { useNativeDriver: false, speed: 22 }

/**
 * แถบช่องด้านซ้าย สไตล์ tvOS:
 * - ตอนเลื่อน/กดรีโมต: กางเต็ม แสดงชื่อช่อง
 * - ไม่ได้กดสักพัก: ย่อเหลือแค่โลโก้ (mini rail)
 * - เมนูบนสุด: รีโหลดช่อง + ⚙️ ตั้งค่า (ภาษา)
 */
export function Sidebar({
  channels,
  remoteCount,
  status,
  error,
  playingId,
  focusedId,
  onFocusChannel,
  onSelectChannel,
  onRetry,
  onOpenSettings,
}) {
  const { t } = useI18n()
  const listRef = useRef(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const collapseTimer = useRef(null)
  const widthAnim = useRef(new Animated.Value(expandedWidth)).current

  const collapse = useCallback(() => {
    setIsCollapsed(true)
    triggerCh3AutoRenew('sidebar_collapse')
    Animated.spring(widthAnim, { ...SPRING, toValue: collapsedWidth, bounciness: 0 }).start()
  }, [widthAnim])

  const collapseAfter = useCallback(
    (ms) => {
      clearTimeout(collapseTimer.current)
      collapseTimer.current = setTimeout(collapse, ms)
    },
    [collapse],
  )

  const expand = useCallback(() => {
    setIsCollapsed(false)
    triggerCh3AutoRenew('sidebar_expand')
    Animated.spring(widthAnim, { ...SPRING, toValue: expandedWidth, bounciness: 2 }).start()
    collapseAfter(TIMING.sidebarCollapseAfterExpandMs)
  }, [widthAnim, collapseAfter])

  // กดปุ่มรีโมตทิศทาง/เลือก → กาง sidebar ทันที (ไม่ดัก event focus กัน loop)
  const handleTVEvent = useCallback(
    (evt) => {
      if (NAV_EVENTS.includes(evt?.eventType)) {
        expand()
        triggerCh3AutoRenew('sidebar_tv_nav')
      }
    },
    [expand],
  )
  useTVEventHandler(handleTVEvent)

  // เปลี่ยนช่องที่เล่น → เริ่มนับถอยหลังย่อ sidebar
  useEffect(() => {
    collapseAfter(TIMING.sidebarCollapseAfterChannelChangeMs)
    return () => clearTimeout(collapseTimer.current)
  }, [playingId, collapseAfter])

  const handleFocus = useCallback(
    (channel) => {
      expand()
      onFocusChannel?.(channel)
    },
    [expand, onFocusChannel],
  )

  const handleSelect = useCallback(
    (channel) => {
      onSelectChannel?.(channel)
      // เลือกช่องแล้วย่อเร็วขึ้น ให้เห็นภาพเต็มจอ
      collapseAfter(TIMING.sidebarCollapseAfterSelectMs)
    },
    [onSelectChannel, collapseAfter],
  )

  // index เริ่มต้นคำนวณครั้งเดียวตอน mount — FlatList จะได้ไม่ re-render ยกแผงทุกครั้งที่เลื่อน
  const initialIndexRef = useRef(Math.max(0, channels.findIndex((channel) => channel.id === (focusedId || playingId))))
  const initialIndex = initialIndexRef.current

  const renderItem = useCallback(
    ({ item, index }) => (
      <ChannelRow
        channel={item}
        isPlaying={item.id === playingId}
        preferFocus={index === initialIndex}
        isCollapsed={isCollapsed}
        onFocus={handleFocus}
        onPress={handleSelect}
      />
    ),
    [handleFocus, handleSelect, playingId, initialIndex, isCollapsed],
  )

  return (
    <Animated.View style={[styles.container, { width: widthAnim }]}>
      <LinearGradient colors={colors.sidebarGradient} style={StyleSheet.absoluteFill} />

      <SidebarHeader
        collapsed={isCollapsed}
        status={status}
        count={remoteCount !== undefined ? remoteCount : channels.length}
      />

      <TVFocusGuideView style={styles.listWrap} trapFocusLeft>
        <TopMenu
          collapsed={isCollapsed}
          loading={status === 'loading'}
          onExpand={expand}
          onReload={onRetry}
          onOpenSettings={onOpenSettings}
        />

        <ListStatus
          status={status}
          error={error}
          collapsed={isCollapsed}
          isEmpty={channels.length === 0}
          onRetry={onRetry}
        />

        <FlatList
          ref={listRef}
          data={channels}
          keyExtractor={(item) => item.id}
          initialScrollIndex={initialIndex}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, isCollapsed && styles.listContentCollapsed]}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={false}
          overScrollMode="never"
          bounces={false}
          onScroll={() => triggerCh3AutoRenew('sidebar_scroll')}
          scrollEventThrottle={TIMING.sidebarScrollThrottleMs}
          getItemLayout={(_, index) => ({ length: itemStride, offset: itemStride * index, index })}
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({ offset: itemStride * index, animated: false })
          }}
        />
      </TVFocusGuideView>

      {!isCollapsed ? (
        <View style={styles.footer}>
          <Text style={styles.hint}>{t('sidebar.hint')}</Text>
        </View>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    overflow: 'hidden',
    zIndex: 10,
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 16,
  },
  listContentCollapsed: {
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  hint: {
    color: colors.textGhost,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
})
