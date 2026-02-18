import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { PrismaService } from '@corphish/api/platform/database/application/prisma.service'
import { publicProcedure, router } from '@corphish/api/trpc/server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ABOUT_PROFILE = {
  bioPrefix: 'I (Santiago Buenahora) am the Co-Founder and CTO of ',
  company: {
    label: 'Primero AI',
    url: 'https://primero.ai/',
  },
  links: {
    linkedin: 'https://www.linkedin.com/in/santiago-buenahora/',
    twitter: 'https://x.com/santizilla',
  },
} as const

export const terminalRouter = router({
  about: publicProcedure.query(() => {
    return ABOUT_PROFILE
  }),
  contact: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        message: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const name = input.name.trim()
      const email = input.email.trim().toLowerCase()
      const message = input.message.trim()

      if (!name) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Name is required.',
        })
      }

      if (!EMAIL_PATTERN.test(email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please provide a valid email.',
        })
      }

      if (message.length < 8) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message is too short.',
        })
      }

      const prismaService = ctx.app.get<PrismaService>(PrismaService)

      await prismaService.client.contactSubmission.create({
        data: {
          name,
          email,
          message,
        },
      })

      console.info('[terminal.contact]', { name, email })

      return {
        ok: true,
      } as const
    }),
})
