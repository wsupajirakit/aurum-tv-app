import { Image, StyleSheet, View } from 'react-native'
import { MAIN_IMAGE } from '../../config'
import { colors } from '../../theme'

const AMBIENT_BLUR = 28

/** หน้าหลักเป็นภาพนิ่ง + พื้นหลังเบลอจากภาพเดียวกัน */
export function MainStill() {
  return (
    <View style={styles.container}>
      <Image source={MAIN_IMAGE} style={[StyleSheet.absoluteFill, styles.ambient]} blurRadius={AMBIENT_BLUR} resizeMode="cover" />
      <Image source={MAIN_IMAGE} style={styles.still} resizeMode="contain" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  still: {
    width: '100%',
    height: '100%',
  },
  ambient: {
    width: '100%',
    height: '100%',
    opacity: 0.22,
  },
})
