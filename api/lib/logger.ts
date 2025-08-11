const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

class Logger {
  private level: number

  constructor() {
    const env = process.env.LOG_LEVEL || 'info'
    this.level = logLevels[env as keyof typeof logLevels] || logLevels.info
  }

  private log(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    }

    if (process.env.NODE_ENV === 'production') {
      // In production, use structured logging
      console.log(JSON.stringify(logEntry))
    } else {
      // In development, use readable format
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, meta || '')
    }
  }

  error(message: string, error?: any) {
    if (this.level >= logLevels.error) {
      this.log('error', message, { error: error?.message || error })
    }
  }

  warn(message: string, meta?: any) {
    if (this.level >= logLevels.warn) {
      this.log('warn', message, meta)
    }
  }

  info(message: string, meta?: any) {
    if (this.level >= logLevels.info) {
      this.log('info', message, meta)
    }
  }

  debug(message: string, meta?: any) {
    if (this.level >= logLevels.debug) {
      this.log('debug', message, meta)
    }
  }
}

export const logger = new Logger()