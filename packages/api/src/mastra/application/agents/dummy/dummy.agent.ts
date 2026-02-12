import { Agent } from '@mastra/core'

export const dummyAgent = new Agent({
  id: 'dummy-agent',
  name: 'Dummy Agent',
  instructions:
    'You are a dummy assistant used for template validation. Reply briefly and clearly.',
  model: 'openai/gpt-4o-mini',
})
