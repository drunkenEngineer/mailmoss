import { decodeEncodedWords } from './encodedWord'

export type ParsedAddress = {
  /** Human-readable name, decoded and unquoted. Empty when the header carries none. */
  displayName: string
  /** Lowercased address, used as the aggregation key. */
  address: string
  domain: string
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length < 2 || !trimmed.startsWith('"') || !trimmed.endsWith('"')) return trimmed
  return trimmed.slice(1, -1).replace(/\\(.)/g, '$1')
}

/**
 * Handles the shapes a From header actually takes: a bare address, an address
 * in angle brackets, a display name with or without quotes, and any of those
 * with an RFC 2047 encoded name.
 */
export function parseFrom(header: string | undefined): ParsedAddress | null {
  if (!header) return null

  const decoded = decodeEncodedWords(header).trim()
  if (decoded === '') return null

  const bracketed = /^(.*)<([^<>]+)>\s*$/s.exec(decoded)
  const rawAddress = bracketed ? bracketed[2] : decoded
  const rawName = bracketed ? (bracketed[1] ?? '') : ''

  const address = rawAddress?.trim().toLowerCase()
  if (!address) return null

  const at = address.lastIndexOf('@')
  if (at <= 0 || at === address.length - 1) return null

  return {
    displayName: unquote(rawName),
    address,
    domain: address.slice(at + 1),
  }
}

/**
 * Sub-addressing is deliberately preserved. On the receiving side `+tag` is
 * noise, but on the sending side newsletter@x and billing@x are different
 * senders and collapsing them would merge unrelated rows.
 */
export function senderKey(address: string): string {
  return address.trim().toLowerCase()
}

export function domainOf(address: string): string {
  const at = senderKey(address).lastIndexOf('@')
  return at === -1 ? '' : senderKey(address).slice(at + 1)
}
