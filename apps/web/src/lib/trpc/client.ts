import { createTRPCClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@corphish/api/trpc/router'
import superjson from 'superjson'

const getTrpcUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/trpc'
  }

  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/trpc`
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTrpcUrl(),
      transformer: superjson,
    }),
  ],
})
