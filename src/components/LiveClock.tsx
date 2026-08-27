import { useNow } from '../lib/now'

export function LiveClock({ className = '' }: { className?: string }) {
  const now = useNow(1000)
  const long = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
  const short = now.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <time dateTime={now.toISOString()} className={`font-mono tabular-nums tracking-tight ${className}`}>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{long}</span>
    </time>
  )
}
