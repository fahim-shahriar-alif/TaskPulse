import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'dark' ? 'Light' : 'Dark'

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="glass flex min-h-16 w-full items-center justify-between rounded-3xl px-5 text-left"
      >
        <span>
          <span className="block text-sm font-medium text-fg">Appearance</span>
          <span className="text-xs text-muted">{theme === 'dark' ? 'Dark theme' : 'Light theme'} · tap to switch</span>
        </span>
        {theme === 'dark' ? <Sun className="h-4 w-4 text-faint" /> : <Moon className="h-4 w-4 text-faint" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-11 w-11 place-items-center rounded-2xl text-muted hover:bg-field hover:text-fg"
      aria-label={`Switch to ${next.toLowerCase()} theme`}
      title={`${next} theme`}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
