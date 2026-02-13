import 'server-only'
import { createTrpcContext } from '@corphish/api/trpc/context'
import { appRouter } from '@corphish/api/trpc/router'
import { auth } from '@/lib/auth'

export async function getGreeting(name = 'world') {
  const session = await auth()
  const trpcContext = await createTrpcContext({ session })
  const caller = appRouter.createCaller(trpcContext)

  return await caller.greeting.hello({ name })
}
