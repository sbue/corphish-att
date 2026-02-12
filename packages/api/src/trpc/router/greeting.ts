import { z } from 'zod'
import { GreetingService } from '@corphish/api/greeting/greeting.service'
import { publicProcedure, router } from '@corphish/api/trpc/server'

export const greetingRouter = router({
  hello: publicProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const greetingService = ctx.app.get(GreetingService)

      return {
        message: greetingService.getGreeting(input?.name),
      }
    }),
})
