import { Mastra } from '@mastra/core'
import { PinoLogger } from '@mastra/loggers'
import { dummyAgent } from './agents/dummy/dummy.agent'

export const mastra = new Mastra({
  agents: {
    dummyAgent,
  },
  workflows: {},
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
})
