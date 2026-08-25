import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { flushDueNotices, notificationPermission } from '../lib/notifications'

export function NotificationWatch() {
  const { user } = useAuth()
  const { settings, classes, deadlines, tasks, ready } = useStore()

  useEffect(() => {
    if (!ready || !user || !settings.notifyEnabled) return
    if (notificationPermission() !== 'granted') return
    const uid = user.uid

    function tick() {
      void flushDueNotices({
        uid,
        classes,
        deadlines,
        tasks,
        settings,
      })
    }

    tick()
    const id = window.setInterval(tick, 20000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [classes, deadlines, ready, settings, tasks, user])

  return null
}
