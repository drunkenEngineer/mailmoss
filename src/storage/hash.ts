/**
 * Identifies the signed-in account without storing the address. Used only to
 * notice that a different account is now connected so a stale scan can be
 * discarded, which needs equality and nothing else.
 */
export async function hashAccount(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalised))

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
