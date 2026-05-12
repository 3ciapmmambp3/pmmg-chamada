import type { Metadata } from 'next'
import { Rajdhani, Share_Tech_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/Providers'

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
})

const shareTechMono = Share_Tech_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-share-tech-mono',
})

export const metadata: Metadata = {
  title: '3ª Cia PM MAmb - Controle de Chamada',
  description: 'Sistema de Controle de Presença em Instruções - Polícia Militar de Minas Gerais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${rajdhani.variable} ${shareTechMono.variable}`}>
      <body className="bg-[#111111] text-white font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
