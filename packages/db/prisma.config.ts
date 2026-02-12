import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

const schemaFile = path.join(__dirname, 'prisma', 'schema.prisma')
const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  schema: schemaFile,
  migrations: { path: path.join(__dirname, 'prisma', 'migrations') },
  ...(databaseUrl
    ? {
        datasource: {
          url: databaseUrl,
        },
      }
    : {}),
})
