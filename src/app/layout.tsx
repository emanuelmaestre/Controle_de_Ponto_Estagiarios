import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import NavigationProgress from '@/components/NavigationProgress'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'ChronosLab — Controle de Ponto',
  description: 'Sistema de controle de ponto para estagiários do laboratório ChronosLab',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ChronosLab',
  },
}

export const viewport: Viewport = {
  themeColor: '#07170c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('cl-theme') || 'lab';
                document.documentElement.setAttribute('data-theme', t);
              } catch(e) { document.documentElement.setAttribute('data-theme','lab'); }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-full`} style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <ThemeProvider>
          <NavigationProgress />
          {children}
          <Toaster
            richColors
            position="top-right"
            gap={8}
            duration={4000}
            toastOptions={{
              style: {
                background: 'var(--surface-card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                fontSize: '13px',
                fontWeight: 500,
                padding: '12px 16px',
              },
              classNames: {
                toast: 'items-start',
                title: 'font-bold text-sm',
                description: 'text-xs opacity-75',
              },
            }}
          />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
