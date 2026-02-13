import { Button } from '@corphish/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@corphish/ui/components/card'
import { auth, signIn, signOut } from '@/lib/auth'
import { getGreeting } from '@/lib/trpc/server'

export default async function HomePage() {
  const session = await auth()
  const greeting = await getGreeting('world')

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
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Corphish Login</CardTitle>
          <CardDescription>Passwordless sign-in with a Resend magic link</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">{greeting.message}</p>
          {session?.user?.email ? (
            <div className="space-y-3">
              <p className="text-sm">
                Signed in as <span className="font-medium">{session.user.email}</span>
              </p>
              <form action={handleSignOut}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <form action={sendMagicLink} className="space-y-3">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              />
              <Button type="submit">Send magic link</Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="text-muted-foreground text-xs">
          You will receive a one-time sign-in link by email.
        </CardFooter>
      </Card>
    </main>
  )
}
