export function createEntityId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}
