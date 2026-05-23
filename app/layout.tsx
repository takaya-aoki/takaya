import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './SessionProvider'

export const metadata: Metadata = {
  title: 'Claude Mail',
  description: 'Claudeが学習するスマートメールアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
