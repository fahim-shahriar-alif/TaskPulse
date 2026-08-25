import { useNow } from '../lib/now'

export function LiveClock({ className = '' }: { className?: string }) {
  const now = useNow(1000)
  const time = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <time dateTime={now.toISOString()} className={`font-mono tabular-nums tracking-tight ${className}`}>
      {time}
    </time>
  )
}
