import { Button } from '@corphish/ui/components/button'
import { auth, signIn, signOut } from '@/lib/auth'

const SANTIAGO_ASCII = String.raw` ####   ###   #   #  #####  #####   ###    ####   ###
#      #   #  ##  #    #      #    #   #  #      #   #
 ###   #####  # # #    #      #    #####  #  ##  #   #
    #  #   #  #  ##    #      #    #   #  #   #  #   #
####   #   #  #   #    #    #####  #   #   ####   ### `

const BUENAHORA_ASCII = String.raw`####   #   #  #####  #   #   ###   #   #   ###   ####    ###
#   #  #   #  #      ##  #  #   #  #   #  #   #  #   #  #   #
####   #   #  ####   # # #  #####  #####  #   #  ####   #####
#   #  #   #  #      #  ##  #   #  #   #  #   #  #  #   #   #
####    ###   #####  #   #  #   #  #   #   ###   #   #  #   #`

export default async function HomePage() {
  const session = await auth()

  async function sendMagicLink(formData: FormData) {
    'use server'

    const emailInput = formData.get('email')
    const email = typeof emailInput === 'string' ? emailInput.trim().toLowerCase() : ''

    if (!email) {
      throw new Error('Email is required')
    }

    await signIn('resend', {
      email,
      redirectTo: '/',
    })
  }

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <main className='relative min-h-screen overflow-hidden bg-[#040705] text-[#b6ff9f]'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(152,255,117,0.15),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(71,142,255,0.12),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(34,197,94,0.14),transparent_50%)]' />
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(168,255,145,0.07)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40' />

      <section className='relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-5 p-4 sm:p-8'>
        <pre
          aria-label='SANTIAGO ascii banner'
          className='ascii-banner w-full overflow-x-auto rounded-2xl border border-[#245626] bg-black/45 p-4 text-[9px] leading-[1.35] tracking-[0.08em] text-[#d2ffc4] shadow-[0_0_45px_rgba(132,255,112,0.15)] sm:text-[11px] md:text-[14px]'
          style={{ fontFamily: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", monospace' }}
        >
          {SANTIAGO_ASCII}
        </pre>

        <pre
          aria-label='BUENAHORA ascii subtitle'
          className='ascii-subtitle w-full overflow-x-auto rounded-2xl border border-[#1e4230] bg-black/35 p-4 text-[8px] leading-[1.35] tracking-[0.08em] text-[#93ffd5] shadow-[0_0_32px_rgba(130,255,210,0.14)] sm:text-[10px] md:text-[12px]'
          style={{ fontFamily: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", monospace' }}
        >
          {BUENAHORA_ASCII}
        </pre>

        <div className='w-full max-w-2xl rounded-xl border border-[#2f5730] bg-black/60 p-4 sm:p-6'>
          {session?.user?.email ? (
            <div className='space-y-4'>
              <p className='text-xs tracking-[0.1em] text-[#8fd88a] sm:text-sm'>
                AUTHENTICATED AS <span className='text-[#ddffcf]'>{session.user.email}</span>
              </p>
              <form action={handleSignOut}>
                <Button
                  type='submit'
                  variant='outline'
                  className='border-[#66bd5e] bg-transparent text-[#caffb3] hover:bg-[#66bd5e]/15 hover:text-[#e4ffd9]'
                >
                  SIGN OUT
                </Button>
              </form>
            </div>
          ) : (
            <form action={sendMagicLink} className='space-y-4'>
              <label className='block text-xs tracking-[0.1em] text-[#8fd88a] sm:text-sm' htmlFor='email'>
                {'>'} ENTER EMAIL FOR MAGIC LINK
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='you@example.com'
                required
                className='h-10 w-full rounded-md border border-[#3d6d3a] bg-[#060b07] px-3 text-sm text-[#dbffd0] outline-none placeholder:text-[#678f63] focus-visible:border-[#83d47b] focus-visible:ring-2 focus-visible:ring-[#6abe63]/40'
              />
              <Button className='bg-[#7fe46f] text-[#052a04] hover:bg-[#98ff89]' type='submit'>
                SEND MAGIC LINK
              </Button>
              <p className='text-xs text-[#7ca67a]'>A one-time sign-in link will be sent to your inbox.</p>
            </form>
          )}
        </div>

        <p className='text-xs tracking-[0.2em] text-[#6e9f6d] sm:text-sm'>
          <span className='animate-pulse text-[#9cff84]'>_</span> LIVE ASCII LOGIN
        </p>
      </section>

      <style>{`
        @keyframes asciiGlow {
          0%, 100% {
            text-shadow: 0 0 12px rgba(136, 255, 110, 0.34);
            opacity: 0.98;
          }
          50% {
            text-shadow: 0 0 20px rgba(165, 255, 148, 0.55);
            opacity: 1;
          }
        }

        .ascii-banner {
          animation: asciiGlow 3.8s ease-in-out infinite;
        }

        .ascii-subtitle {
          animation: asciiGlow 5.2s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
