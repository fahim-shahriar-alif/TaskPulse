export const WALLPAPERS = [
  '/lock/lock-city-web.png',
  '/lock/lock-street-web.png',
  '/lock/lock-web-graphic.png',
] as const

export function sessionWallpaper() {
  const key = 'tp-wallpaper'
  try {
    const saved = sessionStorage.getItem(key)
    if (saved && WALLPAPERS.includes(saved as (typeof WALLPAPERS)[number])) return saved
    const next = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)]
    sessionStorage.setItem(key, next)
    return next
  } catch {
    return WALLPAPERS[0]
  }
}
