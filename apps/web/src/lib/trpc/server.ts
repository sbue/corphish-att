import 'server-only'
import { createTrpcContext } from '@corphish/api/trpc/context'
import { appRouter } from '@corphish/api/trpc/router'
import { auth, signIn } from '@/lib/auth'

export async function getGreeting(name = 'world') {
  const session = await auth()
  const trpcContext = await createTrpcContext({ session })
  const caller = appRouter.createCaller(trpcContext)

  return await caller.greeting.hello({ name })
}

export async function requestPasswordlessLogin(emailInput: string) {
  const session = await auth()
  const trpcContext = await createTrpcContext({ session })
  const caller = appRouter.createCaller(trpcContext)
  const { email } = await caller.auth.requestPasswordlessLogin({ email: emailInput })

  await signIn('resend', {
    email,
    redirect: false,
    redirectTo: '/logged-in',
  })

  return { email }
}
