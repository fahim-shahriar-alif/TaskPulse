import { useEffect, useState } from 'react'
import { nowDate, onClockSync, syncCloudTime } from './clock'
import { todayKey } from './dates'

export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(nowDate)

  useEffect(() => {
    let alive = true
    void syncCloudTime().then(() => {
      if (alive) setNow(nowDate())
    })
    const id = window.setInterval(() => setNow(nowDate()), intervalMs)
    const unsub = onClockSync(() => {
      if (alive) setNow(nowDate())
    })
    return () => {
      alive = false
      window.clearInterval(id)
      unsub()
    }
  }, [intervalMs])

  return now
}

export function useTodayKey() {
  const [key, setKey] = useState(() => todayKey(nowDate()))

  useEffect(() => {
    function refresh() {
      const next = todayKey(nowDate())
      setKey((prev) => (prev === next ? prev : next))
    }
    const id = window.setInterval(refresh, 30000)
    const unsub = onClockSync(refresh)
    return () => {
      window.clearInterval(id)
      unsub()
    }
  }, [])

  return key
}
