import { router } from '@corphish/api/trpc/server'
import { authRouter } from './auth'
import { greetingRouter } from './greeting'

export const appRouter = router({
  auth: authRouter,
  greeting: greetingRouter,
})

export type AppRouter = typeof appRouter
