import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  Flame,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  LogOut,
  MoreHorizontal,
  StickyNote,
  Timer,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CommandPalette } from './CommandPalette'
import { ProgressReportButton } from './ProgressReportButton'
import { ThemeToggle } from './ThemeToggle'

const desktopNav = [
  { to: '/', label: 'My Day', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/matrix', label: 'Matrix', icon: LayoutGrid },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/profile', label: 'Profile', icon: UserRound },
] as const

const mobileNav = [
  { to: '/', label: 'Today', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/calendar', label: 'Cal', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/more', label: 'More', icon: MoreHorizontal },
] as const

function linkClass(active: boolean) {
  return [
    'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition',
    'min-h-11 touch-manipulation',
    active
      ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-400/30 light:bg-peach light:text-fg light:ring-0'
      : 'text-muted hover:bg-field hover:text-fg',
  ].join(' ')
}

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="bg-app min-h-dvh text-fg">
      <CommandPalette />
      <div className="mx-auto flex min-h-dvh max-w-7xl">
        <aside className="glass sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-y-0 border-l-0 p-5 lg:flex">
          <div className="mb-8 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-400/30 light:bg-brand light:text-white light:ring-0">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-fg">TaskyPulse</p>
                <p className="font-mono text-[11px] text-faint">Focus · Execute</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-auto">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => linkClass(isActive)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-3">
            <p className="px-1 font-mono text-[10px] text-faint">⌘K search</p>
            <ProgressReportButton variant="sidebar" />
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="truncate text-xs text-faint">{user?.email}</p>
              <button type="button" onClick={() => void logout()} className="text-faint hover:text-fg" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-4 py-3 lg:hidden">
            <div>
              <p className="text-sm font-semibold text-fg">TaskyPulse</p>
              <p className="font-mono text-[10px] text-faint">Focus · Execute · Repeat</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <ProgressReportButton variant="icon" />
              <button
                type="button"
                onClick={() => void logout()}
                className="grid h-11 w-11 place-items-center text-muted"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
            <Outlet />
          </main>

          <nav className="glass fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-x-0 border-b-0 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
            {mobileNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium touch-manipulation',
                    isActive ? 'text-indigo-400 light:text-brand' : 'text-faint',
                  ].join(' ')
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
