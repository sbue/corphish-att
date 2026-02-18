import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoggedInPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/')
  }

  async function handleSignOut() {
    'use server'

    await signOut({ redirectTo: '/' })
  }

  return (
    <main className='relative min-h-screen overflow-hidden bg-[#02050a] px-4 py-8 text-[#dcf2ff] sm:px-8 sm:py-12'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(123,242,192,0.08),transparent_35%),radial-gradient(circle_at_90%_5%,rgba(95,151,255,0.15),transparent_35%),radial-gradient(circle_at_70%_100%,rgba(138,100,255,0.14),transparent_40%)]' />
      <div className='pointer-events-none absolute inset-0 opacity-35 [background:linear-gradient(to_bottom,rgba(134,180,255,0.08)_1px,transparent_1px)] [background-size:100%_4px]' />
      <section className='relative mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-[#30537a] bg-[#05080f]/95 p-8 shadow-[0_0_80px_rgba(90,165,255,0.15)]'>
        <p className='text-xs tracking-[0.32em] text-[#8fd5ff]'>SANTIAGO BUENAHORA</p>
        <h1 className='text-3xl font-semibold text-[#dff4ff] sm:text-4xl'>You are logged in</h1>
        <p className='text-base text-[#b8def4]'>
          Signed in as <span className='font-semibold text-[#e9f7ff]'>{session.user.email}</span>
        </p>
        <div className='flex flex-wrap gap-3'>
          <a
            href='/'
            className='inline-flex h-10 items-center rounded-md border border-[#3a6088] px-4 text-sm text-[#d8ecff] transition hover:border-[#5a8fc7] hover:bg-[#102033]'
          >
            Back to terminal
          </a>
          <form action={handleSignOut}>
            <button
              type='submit'
              className='inline-flex h-10 items-center rounded-md border border-[#3f7a56] bg-[#0f2c1d] px-4 text-sm text-[#bcffd6] transition hover:bg-[#13472c]'
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
