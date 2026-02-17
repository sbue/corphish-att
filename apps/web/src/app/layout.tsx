import type { Metadata } from 'next'
import '@corphish/ui/globals.css'
import '@xterm/xterm/css/xterm.css'

export const metadata: Metadata = {
  title: 'SANTIAGO | BUENAHORA Terminal',
  description: 'Interactive terminal-style homepage for Buenahora',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className='min-h-screen bg-background text-foreground antialiased'>{children}</body>
    </html>
  )
}
