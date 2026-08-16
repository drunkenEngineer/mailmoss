export type OneClickResult = {
  ok: boolean
  status: number
  detail: string
}

export const ONE_CLICK_BODY = 'List-Unsubscribe=One-Click'

/**
 * The RFC 8058 request. This is not a test call: a 2xx here means the user is
 * genuinely unsubscribed, so nothing should reach this function that the user
 * has not explicitly confirmed.
 */
export async function sendOneClick(
  target: string,
  options: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<OneClickResult> {
  const { fetchImpl = fetch, timeoutMs = 10_000 } = options
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetchImpl(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: ONE_CLICK_BODY,
      signal: controller.signal,
    })

    return {
      ok: response.ok,
      status: response.status,
      detail: response.ok ? 'Unsubscribed' : `Rejected with ${String(response.status)}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return {
      ok: false,
      status: 0,
      // A blocked cross-origin request surfaces as a generic network failure,
      // so the message is reported verbatim rather than interpreted.
      detail: message,
    }
  } finally {
    clearTimeout(timer)
  }
}
