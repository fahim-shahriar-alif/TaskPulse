import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HabitsPage } from './pages/HabitsPage'
import { MyDayPage } from './pages/MyDayPage'
import { NotesPage } from './pages/NotesPage'
import { SchedulePage } from './pages/SchedulePage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
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
  )
}
