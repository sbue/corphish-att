import type { NextRequest } from 'next/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTrpcContext } from '@corphish/api/trpc/context'
import { appRouter } from '@corphish/api/trpc/router'

const handler = async (req: NextRequest): Promise<Response> => {
  const trpcContext = await createTrpcContext({ req })

  return await fetchRequestHandler({
    router: appRouter,
    endpoint: '/api/trpc',
    req,
    createContext: () => trpcContext,
  })
}

export const GET = handler
export const POST = handler
