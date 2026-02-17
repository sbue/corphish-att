import { TerminalShell } from '@/components/terminal-shell'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const session = await auth()

  if (session?.user?.email) {
    redirect('/logged-in')
  }

  return (
    <main className='relative min-h-screen overflow-hidden bg-[#02050a] px-4 py-8 text-[#dcf2ff] sm:px-8 sm:py-12'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(123,242,192,0.08),transparent_35%),radial-gradient(circle_at_90%_5%,rgba(95,151,255,0.15),transparent_35%),radial-gradient(circle_at_70%_100%,rgba(138,100,255,0.14),transparent_40%)]' />
      <div className='pointer-events-none absolute inset-0 opacity-35 [background:linear-gradient(to_bottom,rgba(134,180,255,0.08)_1px,transparent_1px)] [background-size:100%_4px]' />
      <div className='relative mx-auto w-full max-w-6xl'>
        <TerminalShell />
      </div>
    </main>
  )
}
