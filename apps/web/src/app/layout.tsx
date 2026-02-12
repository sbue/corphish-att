import type { Metadata } from 'next'
import '@corphish/ui/globals.css'

export const metadata: Metadata = {
  title: 'Corphish App Template',
  description: 'Turbo + Next.js + Nest + tRPC + Prisma boilerplate',
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
