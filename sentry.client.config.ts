import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Captura 10% das sessões em produção (evita quota excessiva)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Não envia erros em desenvolvimento
  enabled: process.env.NODE_ENV === 'production',

  // Ignora erros comuns e irrelevantes
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    /ChunkLoadError/,
  ],
})
