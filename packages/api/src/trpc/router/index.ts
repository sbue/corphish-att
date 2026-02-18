import { router } from '@corphish/api/trpc/server'
import { authRouter } from './auth'
import { greetingRouter } from './greeting'
import { terminalRouter } from './terminal'

export const appRouter = router({
  auth: authRouter,
  greeting: greetingRouter,
  terminal: terminalRouter,
})

export type AppRouter = typeof appRouter
