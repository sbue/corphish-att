# corphish-att

Monorepo for the Corphish app stack:

- `apps/web` - Next.js app
- `packages/api` - shared Nest/tRPC server modules
- `packages/db` - Prisma client package

## Environment Management (Infisical)

This repo uses Infisical as the source of truth for app secrets.

- `pnpm web` and `pnpm mastra` run through `scripts/with-infisical.sh`.
- Railway build/start commands also run through `scripts/with-infisical.sh`.
- `INFISICAL_ENABLED=auto` uses Infisical when an auth context exists (`INFISICAL_TOKEN` or `.infisical.json`).

### Local setup

1. Login and initialize Infisical project config:
   - `npx @infisical/cli login --method=user --interactive`
   - `npx @infisical/cli init`
2. Create secrets in your Infisical `dev` environment (see `example.env` for key names).
3. Optionally export toggles in your shell:
   - `INFISICAL_ENABLED=true`
   - `INFISICAL_ENV=dev`
   - `INFISICAL_SECRET_PATH=/`
4. Run:
   - `pnpm web`
   - `pnpm mastra`

## Deploying To Railway

This repo includes `railway.json`, so Railway can build and run without extra UI command setup.

### 1. Create a Railway service from this repo

- New Project -> Deploy from GitHub repo
- Select this repository
- Keep service root at repository root (`/`)

### 2. Create Infisical service token for Railway

- Create a read-only token scoped to production secrets path:
  - `npx @infisical/cli service-token create --name "railway-web-prod" --scope prod:/ --access-level read --token-only`

### 3. Set Railway service variables

Set these on the Railway `web` service:

- `INFISICAL_ENABLED=true`
- `INFISICAL_TOKEN=<service-token>`
- `INFISICAL_ENV=prod`
- `INFISICAL_SECRET_PATH=/`
- `HOSTNAME=0.0.0.0`

Optional:

- `INFISICAL_PROJECT_ID=<project-id>` when using machine-identity access tokens.
- `INFISICAL_API_URL=<api-url>` for EU cloud or self-hosted Infisical.

Store app/runtime variables in Infisical `prod` (documented in `example.env`), not directly in Railway.

### 4. Deploy

`railway.json` config:

- Build: `bash ./scripts/railway/build.sh`
- Start: `bash ./scripts/railway/start.sh`
- Healthcheck: `/`

### 5. Validate deployment

- Open `/` and confirm the page renders.
- Hit `/api/trpc/greeting.hello?input=%7B%22name%22%3A%22railway%22%7D` and confirm a JSON response.
