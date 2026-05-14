import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Controle de Ponto — Estagiários',
  description: 'Sistema de controle de ponto para estagiários do laboratório',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ponto Estagiários',
  },
}

export const viewport: Viewport = {
  themeColor: '#1F4E79',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${inter.className} min-h-full`}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
