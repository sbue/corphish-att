# AGENTS.md

- Keep API contracts in `packages/api/src/trpc`.
- Add feature modules under `packages/api/src/*` and wire them in `app.module.ts`.
- Do not introduce AuthJS or AWS-specific dependencies in this template.
