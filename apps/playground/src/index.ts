import { createNestApp } from '@corphish/api/app.module'
import { GreetingService } from '@corphish/api/greeting/greeting.service'

async function run(): Promise<void> {
  const userArgs = process.argv.slice(2).filter((arg) => arg !== '--')
  const nameArg = userArgs[0]
  const name = nameArg?.trim() ? nameArg.trim() : 'playground'

  const app = await createNestApp({})
  const greetingService = app.get(GreetingService)
  const message = greetingService.getGreeting(name)

  console.log(message)
}

run().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
