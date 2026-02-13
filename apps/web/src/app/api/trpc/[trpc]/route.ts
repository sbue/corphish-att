import type { NextRequest } from 'next/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTrpcContext } from '@corphish/api/trpc/context'
import { appRouter } from '@corphish/api/trpc/router'
import { auth } from '@/lib/auth'

const handler = async (req: NextRequest): Promise<Response> => {
  const session = await auth()
  const organizationId = req.cookies.get('orgId')?.value ?? null

  return fetchRequestHandler({
    router: appRouter,
    endpoint: '/api/trpc',
    req,
    createContext: () => createTrpcContext({ req, session, organizationId }),
  })
}

export const GET = handler
export const POST = handler
