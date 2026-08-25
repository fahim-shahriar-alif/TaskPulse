import { Moon, Sun } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { saveSettings } = useStore()

  return (
    <button
      type="button"
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark'
        toggleTheme()
        void saveSettings({ theme: next })
      }}
      className="grid h-11 w-11 place-items-center rounded-2xl text-muted hover:bg-field hover:text-fg"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
