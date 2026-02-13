# corphish-att

Monorepo for the Corphish app stack:

- `apps/web` - Next.js app
- `packages/api` - shared Nest/tRPC server modules
- `packages/db` - Prisma client package

## Deploying To Railway

This repo includes `railway.json`, so Railway can build and run without extra UI command setup.

### 1. Create a Railway service from this repo

- New Project -> Deploy from GitHub repo
- Select this repository
- Keep service root at repository root (`/`)

### 2. Set required environment variables

Documented in `example.env`:

- `NODE_ENV=production`
- `DATABASE_URL=<your postgres connection string>`
- `NEXT_PUBLIC_APP_URL=https://<your-public-domain>`
- `AUTH_SECRET=<openssl rand -base64 32>`
- `AUTH_URL=https://<your-public-domain>`
- `AUTH_TRUST_HOST=true`
- `AUTH_RESEND_KEY=<your-resend-api-key>`
- `AUTH_RESEND_FROM=<verified-sender@your-domain>`

Railway sets `PORT` automatically at runtime.

### 3. Deploy

`railway.json` config:

- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @corphish/web build`
- Start: `node apps/web/.next/standalone/apps/web/server.js`
- Healthcheck: `/`

### 4. Validate deployment

- Open `/` and confirm the page renders.
- Hit `/api/trpc/greeting.hello?input=%7B%22name%22%3A%22railway%22%7D` and confirm a JSON response.
