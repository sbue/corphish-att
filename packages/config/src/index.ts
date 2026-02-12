export const NODE_ENV = process.env.NODE_ENV ?? 'development'

export const isProd = NODE_ENV === 'production'
export const isDev = NODE_ENV === 'development'

export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
export const DATABASE_URL = process.env.DATABASE_URL ?? ''
