import type { Metadata } from 'next'
import '@corphish/ui/globals.css'
import '@xterm/xterm/css/xterm.css'

export const metadata: Metadata = {
  title: 'Santiago Buenahora',
  description: 'Interactive terminal-style personal website',
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
