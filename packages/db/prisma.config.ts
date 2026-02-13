import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

const schemaDir = path.join(__dirname, 'prisma')
const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  schema: schemaDir,
  migrations: { path: path.join(schemaDir, 'migrations') },
  ...(databaseUrl
    ? {
        datasource: {
          url: databaseUrl,
        },
      }
    : {}),
})
