import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Nova Promotora — Plataforma Comercial',
  description: 'Segmentação de parceiros, campanhas e inteligência comercial',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={sora.variable}>
        {children}
      </body>
    </html>
  )
}
