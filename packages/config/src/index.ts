export const NODE_ENV = process.env.NODE_ENV ?? 'development'

export const isProd = NODE_ENV === 'production'
export const isDev = NODE_ENV === 'development'

export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
export const DATABASE_URL = process.env.DATABASE_URL ?? ''

export const AUTH_SECRET = process.env.AUTH_SECRET ?? ''
export const AUTH_RESEND_KEY = process.env.AUTH_RESEND_KEY ?? ''
export const AUTH_RESEND_FROM = process.env.AUTH_RESEND_FROM ?? 'onboarding@resend.dev'
export const AUTH_TRUST_HOST = (process.env.AUTH_TRUST_HOST ?? 'false').toLowerCase() === 'true'
export const AUTH_ALLOWED_EMAIL = (process.env.AUTH_ALLOWED_EMAIL ?? '').trim().toLowerCase()
