import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { TIMING } from '../../config'
import { theme } from '../../theme'

function format(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const msToNextTick = (date) => TIMING.clockTickMs - (date.getSeconds() * 1000 + date.getMilliseconds())

/** นาฬิกามุมบน (24 ชม. ใช้รูปแบบเดียวกันทั้งสองภาษา) — เดินตรงนาทีพอดี ไม่ต้องตื่นทุกวินาที */
export function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer
    const tick = () => {
      const date = new Date()
      setNow(date)
      timer = setTimeout(tick, msToNextTick(date))
    }
    timer = setTimeout(tick, msToNextTick(new Date()))
    return () => clearTimeout(timer)
  }, [])

  return <Text style={styles.clock}>{format(now)}</Text>
}

const styles = StyleSheet.create({
  clock: {
    color: theme.color.textDim,
    fontSize: theme.font.row,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
})
