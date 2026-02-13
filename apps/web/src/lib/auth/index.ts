import { PrismaAdapter } from '@auth/prisma-adapter'
import {
  AUTH_GITHUB_ID,
  AUTH_GITHUB_SECRET,
  AUTH_SECRET,
  AUTH_TRUST_HOST,
} from '@corphish/config'
import { prisma } from '@corphish/db/client'
import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import GitHub from 'next-auth/providers/github'

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'database',
  },
  trustHost: AUTH_TRUST_HOST,
  secret: AUTH_SECRET || undefined,
  providers: [
    GitHub({
      clientId: AUTH_GITHUB_ID || 'github-client-id',
      clientSecret: AUTH_GITHUB_SECRET || 'github-client-secret',
    }),
  ],
}

const result = NextAuth(config)

export const handlers = result.handlers
export const signIn: NextAuthResult['signIn'] = (...args) => result.signIn(...args)
export const signOut: NextAuthResult['signOut'] = (...args) => result.signOut(...args)
export const auth: NextAuthResult['auth'] = result.auth
