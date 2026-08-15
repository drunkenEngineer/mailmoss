const ENCODED_WORD = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g

// RFC 2231 allows a language tag on the charset, as in =?UTF-8*en?B?...?=
function charsetOf(raw: string): string {
  return raw.split('*')[0]?.toLowerCase() ?? 'utf-8'
}

function decode(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    // An unknown or misspelt charset is common in the wild and never worth
    // failing over; UTF-8 is the least surprising thing to fall back to.
    return new TextDecoder('utf-8').decode(bytes)
  }
}

function fromBase64(text: string, charset: string): string {
  try {
    const binary = atob(text.replace(/\s+/g, ''))
    return decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
      charset,
    )
  } catch {
    return text
  }
}

function fromQuotedPrintable(text: string, charset: string): string {
  const bytes: number[] = []

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === undefined) break

    if (char === '_') {
      // In encoded words underscore means space, unlike in message bodies.
      bytes.push(0x20)
      continue
    }

    if (char === '=') {
      const hex = text.slice(index + 1, index + 3)
      if (/^[0-9a-f]{2}$/i.test(hex)) {
        bytes.push(Number.parseInt(hex, 16))
        index += 2
        continue
      }
    }

    bytes.push(char.charCodeAt(0))
  }

  return decode(Uint8Array.from(bytes), charset)
}

/**
 * Decodes RFC 2047 encoded words, which is how any non-ASCII sender name
 * arrives. Without this, French and German newsletters show up as mojibake.
 */
export function decodeEncodedWords(input: string): string {
  if (!input.includes('=?')) return input

  // Whitespace between two adjacent encoded words is separator, not content.
  const joined = input.replace(/\?=\s+=\?/g, '?==?')

  return joined.replace(
    ENCODED_WORD,
    (_match, rawCharset: string, encoding: string, text: string) => {
      const charset = charsetOf(rawCharset)
      return encoding.toLowerCase() === 'b'
        ? fromBase64(text, charset)
        : fromQuotedPrintable(text, charset)
    },
  )
}
