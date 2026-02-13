export interface StandardContextSessionUser {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
  organizationId?: string | null
  organizationIds?: string[]
}

export interface StandardContextSession {
  user?: StandardContextSessionUser | null
  expires?: string
}

export interface StandardContext {
  req?: Request
  session?: StandardContextSession | null
  organizationId?: string | null
}

export const CONTEXT = 'CONTEXT'
