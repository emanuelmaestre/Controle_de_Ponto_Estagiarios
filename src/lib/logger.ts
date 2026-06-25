import * as Sentry from '@sentry/nextjs'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    }
  }

  return error
}

function write(level: LogLevel, scope: string, message: string, context: LogContext = {}) {
  const entry = {
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.info(line)
  }
}

export function createLogger(scope: string) {
  return {
    info(message: string, context?: LogContext) {
      write('info', scope, message, context)
    },

    warn(message: string, context?: LogContext) {
      write('warn', scope, message, context)
      Sentry.addBreadcrumb({ level: 'warning', category: scope, message, data: context })
    },

    error(message: string, error?: unknown, context: LogContext = {}) {
      write('error', scope, message, { ...context, error: normalizeError(error) })

      Sentry.withScope((sentryScope) => {
        sentryScope.setTag('scope', scope)
        sentryScope.setExtras(context)
        if (error instanceof Error) {
          Sentry.captureException(error)
        } else {
          Sentry.captureMessage(`[${scope}] ${message}`, 'error')
        }
      })
    },

    // Eventos de segurança — filtráveis no Sentry pela tag security_event=true
    security(message: string, context: LogContext = {}) {
      write('warn', scope, `[SECURITY] ${message}`, context)
      Sentry.withScope((sentryScope) => {
        sentryScope.setTag('scope', scope)
        sentryScope.setTag('security_event', 'true')
        sentryScope.setLevel('warning')
        sentryScope.setExtras(context)
        Sentry.captureMessage(`[SECURITY] [${scope}] ${message}`, 'warning')
      })
    },
  }
}
