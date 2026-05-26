import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import NavigationProgress from '@/components/NavigationProgress'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'ChronosLab — Controle de Ponto',
  description: 'Sistema de controle de ponto para estagiários do laboratório ChronosLab',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ChronosLab',
  },
}

export const viewport: Viewport = {
  themeColor: '#1e5c2d',
  width: 'device-width',
  initialScale: 1,
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
      <body className={`${inter.variable} font-sans min-h-full`}>
        <ThemeProvider>
          <NavigationProgress />
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              },
            }}
          />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  )
}
