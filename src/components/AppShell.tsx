import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  Flag,
  Flame,
  Images,
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
import { AppBackdrop } from './AppBackdrop'
import { LockButton } from './LockButton'
import { LockScreen } from './LockScreen'
import { NotificationWatch } from './NotificationWatch'
import { ProgressReportButton } from './ProgressReportButton'
import { ThemeToggle } from './ThemeToggle'
import { UserAvatar } from './UserAvatar'
import { useLock } from '../context/LockContext'
import { useStore } from '../context/StoreContext'

const desktopNav = [
  { to: '/', label: 'My Day', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/matrix', label: 'Matrix', icon: LayoutGrid },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/classes', label: 'Classes', icon: GraduationCap },
  { to: '/class-notes', label: 'Class notes', icon: Images },
  { to: '/deadlines', label: 'Exams', icon: Flag },
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
      ? 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-400/30'
      : 'text-muted hover:bg-field hover:text-fg',
  ].join(' ')
}

export function AppShell() {
  const { user, logout } = useAuth()
  const { settings } = useStore()
  const { locked } = useLock()
  const displayName = user?.displayName || user?.email || 'TaskyPulse'

  return (
    <div className="relative min-h-dvh text-fg">
      {!locked ? <AppBackdrop /> : null}
      {locked ? <LockScreen /> : null}
      <div className="relative z-10" inert={locked}>
      <CommandPalette />
      <NotificationWatch />
      <div className="mx-auto flex min-h-dvh max-w-7xl">
        <aside className="glass sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-y-0 border-l-0 p-5 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-1">
            <img src="/logo.png" alt="" className="h-10 w-10 rounded-2xl" />
            <div>
              <p className="text-sm font-semibold tracking-tight text-fg">TaskyPulse</p>
              <p className="font-mono text-[11px] text-faint">Focus · Execute</p>
            </div>
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
            <ProgressReportButton variant="sidebar" />
            <div className="rounded-2xl bg-field p-1 ring-1 ring-line">
              <div className="grid grid-cols-3">
                <LockButton />
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="grid h-11 place-items-center rounded-2xl text-muted hover:bg-card hover:text-fg"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
              <NavLink
                to="/profile"
                className="flex items-center justify-center gap-2 truncate px-3 pb-2 pt-1 text-[11px] text-faint hover:text-muted"
              >
                <UserAvatar photo={settings.photo} name={displayName} size="sm" />
                <span className="truncate">{user?.email}</span>
              </NavLink>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-4 py-3 lg:hidden">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl" />
              <div>
                <p className="text-sm font-semibold text-fg">TaskyPulse</p>
                <p className="font-mono text-[10px] text-faint">Focus · Execute · Repeat</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NavLink to="/profile" className="grid h-11 w-11 place-items-center" aria-label="Profile">
                <UserAvatar photo={settings.photo} name={displayName} size="sm" />
              </NavLink>
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
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium touch-manipulation',
                    isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-faint',
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
    </div>
  )
}
