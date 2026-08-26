export type LockBackdrop = {
  url: string
  kind: 'image' | 'video'
}

const LIFE_STILLS = ['wallpaper', 'wallpaper', 'wallpaper', 'waifu', 'neko', 'fox_girl']
const LIFE_GIFS = ['hug', 'pat', 'cuddle']
const PICS_STILLS = ['waifu', 'neko', 'shinobu', 'megumin']
const PICS_GIFS = ['dance', 'happy', 'wink']

function pick(list: readonly string[]) {
  return list[Math.floor(Math.random() * list.length)]
}

function kindFromUrl(url: string): LockBackdrop['kind'] {
  const lower = url.toLowerCase().split('?')[0]
  return lower.endsWith('.mp4') || lower.endsWith('.webm') ? 'video' : 'image'
}

async function readUrl(res: Response, keys: string[]): Promise<string | null> {
  if (!res.ok) return null
  const data = (await res.json()) as Record<string, unknown>
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.startsWith('http')) return value
  }
  const results = data.results
  if (Array.isArray(results) && results[0] && typeof results[0] === 'object') {
    const url = (results[0] as { url?: unknown }).url
    if (typeof url === 'string' && url.startsWith('http')) return url
  }
  return null
}

async function fromNekosLife(signal?: AbortSignal): Promise<LockBackdrop | null> {
  const path = Math.random() < 0.82 ? pick(LIFE_STILLS) : pick(LIFE_GIFS)
  const res = await fetch(`https://nekos.life/api/v2/img/${path}`, { signal, referrerPolicy: 'no-referrer' })
  const url = await readUrl(res, ['url'])
  return url ? { url, kind: kindFromUrl(url) } : null
}

async function fromWaifuPics(signal?: AbortSignal): Promise<LockBackdrop | null> {
  const path = Math.random() < 0.8 ? pick(PICS_STILLS) : pick(PICS_GIFS)
  const res = await fetch(`https://api.waifu.pics/sfw/${path}`, { signal, referrerPolicy: 'no-referrer' })
  const url = await readUrl(res, ['url'])
  return url ? { url, kind: kindFromUrl(url) } : null
}

function preload(item: LockBackdrop, signal?: AbortSignal) {
  if (item.kind === 'video') return Promise.resolve(true)
  return new Promise<boolean>((resolve) => {
    const img = new Image()
    const stop = () => {
      img.onload = null
      img.onerror = null
      resolve(false)
    }
    signal?.addEventListener('abort', stop, { once: true })
    img.referrerPolicy = 'no-referrer'
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = item.url
  })
}

export async function randomLockBackdrop(signal?: AbortSignal): Promise<LockBackdrop | null> {
  const sources = Math.random() < 0.7 ? [fromNekosLife, fromWaifuPics] : [fromWaifuPics, fromNekosLife]
  for (const source of sources) {
    if (signal?.aborted) return null
    try {
      const item = await source(signal)
      if (!item) continue
      const ok = await preload(item, signal)
      if (ok) return item
    } catch {
      if (signal?.aborted) return null
    }
  }
  return null
}
