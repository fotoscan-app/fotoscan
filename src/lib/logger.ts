type Level = 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
type Module = 'AUTH' | 'UPLOAD' | 'FACE_MATCH' | 'MODERATION' | 'STORAGE' | 'BRANDING' | 'BILLING' | 'LEADS' | 'SYSTEM'

interface LogContext {
  userId?: string
  eventId?: string
  photoId?: string
  file?: string
  errorCode?: string
  duration?: number
  [key: string]: unknown
}

function log(level: Level, module: Module, message: string, context: LogContext = {}) {
  const ts = new Date().toISOString()
  const ctx = Object.entries(context)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ')
  const line = `[${ts}] ${level.padEnd(5)} [${module.padEnd(10)}] ${message}${ctx ? ' | ' + ctx : ''}`

  if (level === 'ERROR' || level === 'FATAL') {
    console.error(line)
  } else if (level === 'WARN') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info:  (module: Module, message: string, ctx?: LogContext) => log('INFO',  module, message, ctx),
  warn:  (module: Module, message: string, ctx?: LogContext) => log('WARN',  module, message, ctx),
  error: (module: Module, message: string, ctx?: LogContext) => log('ERROR', module, message, ctx),
  fatal: (module: Module, message: string, ctx?: LogContext) => log('FATAL', module, message, ctx),
}
