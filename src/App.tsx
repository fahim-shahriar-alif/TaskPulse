import { Component, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { LockProvider } from './context/LockContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppShell } from './components/AppShell'
import { TaskDetailProvider } from './components/TaskDetailModal'
import { CalendarPage } from './pages/CalendarPage'
import { ClassesPage } from './pages/ClassesPage'
import { DeadlinesPage } from './pages/DeadlinesPage'
import { FocusPage } from './pages/FocusPage'
import { HabitsPage } from './pages/HabitsPage'
import { LoginPage } from './pages/LoginPage'
import { MatrixPage } from './pages/MatrixPage'
import { MorePage } from './pages/MorePage'
import { MyDayPage } from './pages/MyDayPage'
import { NotesPage } from './pages/NotesPage'
import { ProfilePage } from './pages/ProfilePage'
import { SchedulePage } from './pages/SchedulePage'
import { StatsPage } from './pages/StatsPage'
import { TasksPage } from './pages/TasksPage'

class ScreenError extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null }

  static getDerivedStateFromError(error: Error) {
    return { message: error.message }
  }

  render() {
    if (this.state.message) {
      return (
        <div className="bg-app grid min-h-dvh place-items-center px-6 text-center text-rose-400">
          {this.state.message}
        </div>
      )
    }
    return this.props.children
  }
}

function Gate() {
  const { configured, user, loading } = useAuth()
  if (loading) {
    return (
      <div className="bg-app grid min-h-dvh place-items-center text-muted">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-12 rounded-2xl" />
          <p>Loading TaskyPulse…</p>
        </div>
      </div>
    )
  }
  if (!configured || !user) return <LoginPage />
  return (
    <ScreenError>
      <StoreProvider>
        <LockProvider>
          <TaskDetailProvider>
            <BrowserRouter>
              <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<MyDayPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/focus" element={<FocusPage />} />
                <Route path="/matrix" element={<MatrixPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/habits" element={<HabitsPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/deadlines" element={<DeadlinesPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              </Routes>
            </BrowserRouter>
          </TaskDetailProvider>
        </LockProvider>
      </StoreProvider>
    </ScreenError>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  )
}
