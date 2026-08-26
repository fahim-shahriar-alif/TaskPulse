export type LockBackdrop = {
  url: string
  kind: 'image' | 'video'
}

const STILLS = ['neko', 'waifu', 'kitsune', 'husbando']
const MOTION = ['dance', 'happy', 'smile', 'wave', 'wink']

function pick(list: readonly string[]) {
  return list[Math.floor(Math.random() * list.length)]
}

function kindFromUrl(url: string): LockBackdrop['kind'] {
  const lower = url.toLowerCase()
  return lower.endsWith('.mp4') || lower.endsWith('.webm') ? 'video' : 'image'
}

export async function randomLockBackdrop(signal?: AbortSignal): Promise<LockBackdrop | null> {
  const category = Math.random() < 0.75 ? pick(STILLS) : pick(MOTION)
  const res = await fetch(`https://nekos.best/api/v2/${category}`, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as { results?: { url?: string }[] }
  const url = data.results?.[0]?.url
  if (!url) return null
  return { url, kind: kindFromUrl(url) }
}
