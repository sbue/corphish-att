import type { Metadata } from 'next'
import '@corphish/ui/globals.css'

export const metadata: Metadata = {
  title: 'SANTIAGO | BUENAHORA',
  description: 'ASCII art login experience for Buenahora',
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
