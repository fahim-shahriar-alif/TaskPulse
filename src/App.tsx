import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import { AppShell } from './components/AppShell'
import { HabitsPage } from './pages/HabitsPage'
import { LoginPage } from './pages/LoginPage'
import { MyDayPage } from './pages/MyDayPage'
import { NotesPage } from './pages/NotesPage'
import { SchedulePage } from './pages/SchedulePage'
import { TasksPage } from './pages/TasksPage'

function Gate() {
  const { configured, user, loading } = useAuth()
  if (loading) {
    return (
      <div className="bg-app grid min-h-dvh place-items-center text-slate-400">
        Loading TaskPulse…
      </div>
    )
  }
  if (!configured || !user) return <LoginPage />
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<MyDayPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
