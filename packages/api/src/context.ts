export interface StandardContextSessionUser {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
}

export interface StandardContextSession {
  user?: StandardContextSessionUser | null
  expires?: string
}

export interface StandardContext {
  req?: Request
  session?: StandardContextSession | null
}

export const CONTEXT = 'CONTEXT'
