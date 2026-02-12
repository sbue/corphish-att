export interface StandardContext {
  req?: Request
  organizationId?: string | null
}

export const CONTEXT = 'CONTEXT'
