/** แปลง error จาก API เป็นข้อความตามภาษา (ApiError มี code + status) */
export function describeError(error, t) {
  if (!error) return ''
  switch (error.code) {
    case 'timeout':
      return t('errors.timeout')
    case 'http_error':
      return t('errors.http', { status: error.status })
    case 'network':
      return t('errors.network')
    default:
      return t('errors.unknown')
  }
}
