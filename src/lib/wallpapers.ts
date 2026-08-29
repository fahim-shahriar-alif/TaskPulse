export const WALLPAPERS = [
  '/lock/lock-harbor.png',
  '/lock/lock-ridge.png',
  '/lock/lock-skyline.png',
] as const

export const LOCK_QUOTES = [
  { text: 'Waste no more time arguing what a good person should be. Be one.', by: 'Marcus Aurelius' },
  { text: 'Luck is what happens when preparation meets opportunity.', by: 'Seneca' },
  { text: 'Well begun is half done.', by: 'Aristotle' },
  { text: 'No man is free who is not master of himself.', by: 'Epictetus' },
  { text: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { text: 'Show up. The rest follows.', by: '' },
  { text: 'Protect the hours that matter.', by: '' },
  { text: 'One block. Then the next.', by: '' },
] as const

function pick<T>(key: string, list: readonly T[]): T {
  try {
    const raw = sessionStorage.getItem(key)
    const index = raw ? Number(raw) : NaN
    if (Number.isInteger(index) && index >= 0 && index < list.length) return list[index]
    const next = Math.floor(Math.random() * list.length)
    sessionStorage.setItem(key, String(next))
    return list[next]
  } catch {
    return list[0]
  }
}

export function sessionWallpaper() {
  return pick('tp-wallpaper-v2', WALLPAPERS)
}

export function sessionQuote() {
  return pick('tp-lock-quote', LOCK_QUOTES)
}
