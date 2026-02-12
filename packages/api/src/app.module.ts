import 'reflect-metadata'
import type { DynamicModule, INestApplicationContext } from '@nestjs/common'
import { Global, Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CONTEXT } from './context'
import type { StandardContext } from './context'
import { GreetingModule } from './greeting/greeting.module'
import { MastraModule } from './mastra/mastra.module'

@Global()
@Module({})
class AppModule {}

let appContext: INestApplicationContext | undefined

export function createModule(context: StandardContext): DynamicModule {
  return {
    module: AppModule,
    imports: [GreetingModule, MastraModule],
    providers: [{ provide: CONTEXT, useValue: context }],
    exports: [CONTEXT, GreetingModule, MastraModule],
  }
}

export async function createNestApp(context: StandardContext): Promise<INestApplicationContext> {
  if (appContext) {
    return appContext
  }

  appContext = await NestFactory.createApplicationContext(createModule(context), {
    logger: ['error', 'warn'],
  })

  return appContext
}
