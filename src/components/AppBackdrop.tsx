import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { sessionWallpaper } from '../lib/wallpapers'

export function AppBackdrop() {
  const { theme } = useTheme()
  const [src] = useState(sessionWallpaper)

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <img src={src} alt="" className="h-full w-full origin-center scale-125 object-cover blur-3xl" />
      <div
        className={`absolute inset-0 ${
          theme === 'dark' ? 'bg-[#06101c]/75' : 'bg-[#e8f4fc]/82'
        }`}
      />
    </div>
  )
}
