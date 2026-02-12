import { Mastra } from '@mastra/core'
import { PinoLogger } from '@mastra/loggers'
import { PostgresStore } from '@mastra/pg'
import { Injectable } from '@nestjs/common'
import { DATABASE_URL } from '@corphish/config'

@Injectable()
export class MastraService {
  private readonly mastra: Mastra

  constructor() {
    this.mastra = new Mastra({
      agents: {},
      workflows: {},
      logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
      }),
      ...(DATABASE_URL
        ? {
            storage: new PostgresStore({
              id: 'mastra-storage',
              connectionString: DATABASE_URL,
            }),
          }
        : {}),
    })
  }

  getInstance(): Mastra {
    return this.mastra
  }
}
