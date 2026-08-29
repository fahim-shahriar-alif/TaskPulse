import { Check as CheckIcon } from 'lucide-react'

type CheckProps = {
  checked: boolean
  onChange: () => void
  label: string
  size?: 'sm' | 'md'
}

export function Check({ checked, onChange, label, size = 'md' }: CheckProps) {
  const box = size === 'sm' ? 'h-5 w-5 rounded-[7px]' : 'h-6 w-6 rounded-lg'
  const icon = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation()
        onChange()
      }}
      className={`grid shrink-0 place-items-center ring-2 transition duration-200 ease-out touch-manipulation active:scale-90 ${box} ${
        checked ? 'bg-emerald-500 text-white ring-emerald-400/90' : 'bg-white ring-sky-500/70 dark:bg-field dark:ring-sky-400/80'
      }`}
    >
      <CheckIcon
        className={`${icon} transition duration-200 ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
        strokeWidth={3}
      />
    </button>
  )
}
