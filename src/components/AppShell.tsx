import {
  CalendarClock,
  Flame,
  LayoutDashboard,
  ListChecks,
  StickyNote,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/', label: 'My Day', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/schedule', label: 'Schedule', icon: CalendarClock },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/notes', label: 'Notes', icon: StickyNote },
] as const

function linkClass(active: boolean) {
  return [
    'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition',
    'min-h-11 touch-manipulation',
    active
      ? 'bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30'
      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
  ].join(' ')
}

export function AppShell() {
  return (
    <div className="bg-app min-h-dvh text-slate-100">
      <div className="mx-auto flex min-h-dvh max-w-7xl">
        <aside className="glass sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-y-0 border-l-0 p-5 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">TaskPulse</p>
              <p className="font-mono text-[11px] text-slate-500">Pro</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1.5">
            {nav.map((item) => (
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
          <p className="px-1 font-mono text-[10px] tracking-wide text-slate-600">
            OFFLINE-READY SHELL
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-20 flex items-center justify-between border-x-0 border-t-0 px-4 py-3 lg:hidden">
            <div>
              <p className="text-sm font-semibold text-white">TaskPulse</p>
              <p className="font-mono text-[10px] text-slate-500">Focus · Execute · Repeat</p>
            </div>
          </header>

          <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
            <Outlet />
          </main>

          <nav className="glass fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-x-0 border-b-0 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium touch-manipulation',
                    isActive ? 'text-indigo-300' : 'text-slate-500',
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
