import { AUTH_ALLOWED_EMAIL } from '@corphish/config'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '@corphish/api/trpc/server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const authRouter = router({
  requestPasswordlessLogin: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const email = input.email.trim().toLowerCase()

      if (!EMAIL_PATTERN.test(email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please provide a valid email address.',
        })
      }

      if (!AUTH_ALLOWED_EMAIL) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login is unavailable. Allowed email is not configured.',
        })
      }

      if (email !== AUTH_ALLOWED_EMAIL) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Nice try. This inbox is not on the guest list.',
        })
      }

      return { email }
    }),
})
