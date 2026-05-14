import type { NextConfig } from 'next'

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

  // Habilita output standalone para Docker (opcional)
  // output: 'standalone',
}

export default nextConfig
