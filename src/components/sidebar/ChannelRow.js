import { memo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LAYOUT } from '../../config'
import { colors } from '../../theme'
import { Avatar } from '../common/Avatar'

function ChannelRowBase({
  channel,
  isPlaying,
  preferFocus,
  isCollapsed = false,
  onFocus,
  onPress,
}) {
  const initialFocusRef = useRef(preferFocus)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Pressable
      focusable
      hasTVPreferredFocus={initialFocusRef.current}
      onFocus={() => onFocus?.(channel)}
      onHoverIn={() => {
        setIsHovered(true)
        onFocus?.(channel)
      }}
      onHoverOut={() => setIsHovered(false)}
      onPress={() => onPress?.(channel)}
      style={styles.pressable}
    >
      {({ focused, hovered }) => {
        const isHighlighted = Boolean(focused || hovered || isHovered)

        return (
          <View
            style={[
              styles.row,
              isCollapsed && styles.rowCollapsed,
              isHighlighted && styles.rowFocused,
              isPlaying && !isHighlighted && styles.rowPlaying,
            ]}
          >
            {/* แถบนีออนบอกตำแหน่งโฟกัส/hover เด่นชัดทางซ้ายมือ สไตล์ Leanback TV */}
            {isHighlighted && !isCollapsed ? (
              <View style={styles.focusPill} />
            ) : null}

            {/* โลโก้ช่อง พร้อมกรอบเรืองแสงเมื่อโฟกัส/hover */}
            <View style={[styles.avatarWrap, isHighlighted && styles.avatarWrapFocused]}>
              <Avatar channel={channel} size={LAYOUT.sidebar.rowAvatar} />
            </View>

            {/* ซ่อนข้อความเมื่ออยู่ในโหมด mini rail */}
            {!isCollapsed ? (
              <View style={styles.info}>
                <Text
                  style={[styles.name, isHighlighted && styles.nameFocused]}
                  numberOfLines={1}
                >
                  {channel.name}
                </Text>
                {channel.group ? (
                  <Text
                    style={[styles.group, isHighlighted && styles.groupFocused]}
                    numberOfLines={1}
                  >
                    {channel.group}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {!isCollapsed && isPlaying ? (
              <View style={[styles.liveDot, isHighlighted && styles.liveDotFocused]} />
            ) : null}
          </View>
        )
      }}
    </Pressable>
  )
}

export const ChannelRow = memo(
  ChannelRowBase,
  (prev, next) =>
    prev.channel.id === next.channel.id &&
    prev.channel.name === next.channel.name &&
    prev.channel.group === next.channel.group &&
    prev.isPlaying === next.isPlaying &&
    prev.isCollapsed === next.isCollapsed,
)

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 6,
    cursor: 'pointer',
  },
  row: {
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.transparent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 11,
  },
  rowCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
    backgroundColor: colors.transparent,
  },
  rowFocused: {
    backgroundColor: colors.focusFill,
    borderColor: colors.focusRing, // นีออนหนา 4px เห็นชัดจากระยะ 3-4 เมตร
    borderWidth: 4,
    shadowColor: colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 20,
  },
  rowPlaying: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentTint,
  },
  focusPill: {
    position: 'absolute',
    left: 4,
    top: 8,
    bottom: 8,
    width: 7,
    borderRadius: 3.5,
    backgroundColor: colors.focusRing,
    shadowColor: colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  avatarWrap: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.transparent,
  },
  avatarWrapFocused: {
    borderColor: colors.focusRing,
    borderWidth: 3,
    shadowColor: colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.textBright,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  nameFocused: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: colors.textShadowStrong,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  group: {
    marginTop: 1,
    color: colors.textQuiet,
    fontSize: 11.5,
    fontWeight: '500',
  },
  groupFocused: {
    color: colors.textGroupFocused,
    fontWeight: '800',
    fontSize: 13,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.live,
    marginRight: 2,
  },
  liveDotFocused: {
    backgroundColor: colors.liveHot,
    shadowColor: colors.live,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
})

