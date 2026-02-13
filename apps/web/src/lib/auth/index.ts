import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import Resend from 'next-auth/providers/resend'
import { prisma } from '@corphish/db/client'
import { AUTH_RESEND_FROM, AUTH_RESEND_KEY, AUTH_SECRET, AUTH_TRUST_HOST } from '@corphish/config'

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'database',
  },
  trustHost: AUTH_TRUST_HOST,
  secret: AUTH_SECRET || undefined,
  providers: [
    Resend({
      apiKey: AUTH_RESEND_KEY || undefined,
      from: AUTH_RESEND_FROM || 'onboarding@resend.dev',
    }),
  ],
}

const result = NextAuth(config)

export const handlers = result.handlers
export const signIn: NextAuthResult['signIn'] = (...args) => result.signIn(...args)
export const signOut: NextAuthResult['signOut'] = (...args) => result.signOut(...args)
export const auth: NextAuthResult['auth'] = result.auth
