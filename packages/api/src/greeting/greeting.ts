export function getGreeting(name?: string): string {
  const safeName = name?.trim().length ? name.trim() : 'world'

  return `Hello ${safeName}!`
}
