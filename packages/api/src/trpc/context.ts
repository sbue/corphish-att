import type { INestApplicationContext } from '@nestjs/common'
import { createNestApp } from '@corphish/api/app.module'
import type { StandardContext } from '@corphish/api/context'

export type TrpcContext = StandardContext & {
  app: INestApplicationContext
}

export async function createTrpcContext(ctx: StandardContext = {}): Promise<TrpcContext> {
  const app = await createNestApp(ctx)

  return {
    ...ctx,
    app,
  }
}
