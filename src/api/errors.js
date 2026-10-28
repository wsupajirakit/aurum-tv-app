/**
 * error จากการคุยกับ backend — UI แปลงเป็นข้อความตามภาษาด้วย i18n/describeError
 * code: 'timeout' | 'network' | 'http_error'
 */
export class ApiError extends Error {
  constructor(code, { status = 0, body = null, cause } = {}) {
    super(status ? `${code} (${status})` : code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.body = body
    if (cause) this.cause = cause
  }
}
