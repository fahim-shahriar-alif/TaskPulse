import { useId } from 'react'

export type Slice = {
  id: string
  label: string
  value: number
  color: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  hint,
  tone = 'bg-indigo-500',
}: {
  value: number
  max?: number
  label: string
  hint?: string
  tone?: string
}) {
  const safeMax = Math.max(0, max)
  const pct = safeMax <= 0 ? 0 : Math.min(100, Math.round((value / safeMax) * 100))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-fg">{label}</p>
        <p className="font-mono text-[11px] text-muted">{hint ?? `${value}/${safeMax}`}</p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-field ring-1 ring-line">
        <div className={`h-full rounded-full transition-[width] ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function DonutPie({ slices, center }: { slices: Slice[]; center?: string }) {
  const uid = useId().replaceAll(':', '')
  const total = slices.reduce((sum, item) => sum + item.value, 0)
  const r = 34
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-line" strokeWidth="16" />
        {total > 0
          ? slices
              .filter((slice) => slice.value > 0)
              .map((slice) => {
                const len = (slice.value / total) * c
                const node = (
                  <circle
                    key={slice.id}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="none"
                    stroke={`url(#${uid}-${slice.id})`}
                    strokeWidth="16"
                    strokeDasharray={`${len} ${c}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                  />
                )
                offset += len
                return node
              })
          : null}
        <defs>
          {slices.map((slice) => (
            <linearGradient key={slice.id} id={`${uid}-${slice.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={slice.color} />
              <stop offset="100%" stopColor={slice.color} stopOpacity="0.75" />
            </linearGradient>
          ))}
        </defs>
      </svg>
      <div className="min-w-40 flex-1 space-y-2">
        {center ? <p className="font-mono text-2xl font-semibold text-fg">{center}</p> : null}
        {slices.map((slice) => {
          const pct = total ? Math.round((slice.value / total) * 100) : 0
          return (
            <div key={slice.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-fg">
                <span className="h-2.5 w-2.5 rounded-full ring-1 ring-line" style={{ background: slice.color }} />
                {slice.label}
              </span>
              <span className="font-mono text-xs text-muted">
                {slice.value} · {pct}%
              </span>
            </div>
          )
        })}
        {total === 0 ? <p className="text-sm text-muted">Nothing to split yet.</p> : null}
      </div>
    </div>
  )
}

export function BarChart({
  items,
  tone = 'bg-indigo-500',
}: {
  items: { id: string; label: string; value: number }[]
  tone?: string
}) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className="flex h-44 items-end gap-1.5">
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100)
        return (
          <div key={item.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <p className="font-mono h-4 text-[10px] text-muted">{item.value || ''}</p>
            <div className="flex h-32 w-full items-end overflow-hidden rounded-t-lg bg-field">
              <div
                className={`w-full rounded-t-lg ${tone}`}
                style={{ height: item.value ? `${Math.max(6, pct)}%` : '3%' }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <p className="font-mono text-[9px] text-faint">{item.label}</p>
          </div>
        )
      })}
    </div>
  )
}
