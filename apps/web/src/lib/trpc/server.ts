import 'server-only'
import { createTrpcContext } from '@corphish/api/trpc/context'
import { appRouter } from '@corphish/api/trpc/router'

export async function getGreeting(name = 'world') {
  const trpcContext = await createTrpcContext()
  const caller = appRouter.createCaller(trpcContext)

  return await caller.greeting.hello({ name })
}
