export function normalizeTikTokHandle(input: string): string {
  const value = input.trim()
  if (!value) throw new Error('TikTok handle is required.')

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value)
    if (!/(^|\.)tiktok\.com$/i.test(url.hostname)) {
      throw new Error('Expected a TikTok profile URL or handle.')
    }
    const segment = url.pathname.split('/').find((part) => part.startsWith('@'))
    if (!segment || segment.length === 1) {
      throw new Error('TikTok profile URL does not contain a handle.')
    }
    return decodeURIComponent(segment.slice(1))
  }

  return value.replace(/^@/, '')
}
