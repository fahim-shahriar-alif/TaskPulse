type CompletionRingProps = {
  value: number
  label: string
}

export function CompletionRing({ value, label }: CompletionRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const r = 42
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-line" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
        <defs>
          <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p className="font-mono text-3xl font-semibold text-fg">{pct}%</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}
