import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Permite imagens do Supabase Storage e avatares externos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Headers de segurança adicionais (complementa vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Não sobe source maps automaticamente (requer SENTRY_AUTH_TOKEN)
  silent: true,
  disableLogger: true,

  // Sem tunelamento — usa o endpoint padrão do Sentry
  tunnelRoute: undefined,

  // Desativa tree-shaking de logs para manter o logger funcionando
  hideSourceMaps: true,
})
