export type MessageParams = Record<string, string | number>

// Placeholders look like {email} or {count}. An unknown placeholder is left in
// place rather than blanked, so a missing value is visible instead of silent.
export function format(template: string, params?: MessageParams): string {
  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key]
    return value === undefined ? match : String(value)
  })
}
