import { type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  stacked?: boolean
}

export function Modal({ open, title, children, onClose, stacked = false }: ModalProps) {
  if (!open) return null
  return (
    <div className={`fixed inset-0 ${stacked ? 'z-[60]' : 'z-50'}`}>
      <div className="glass relative flex h-dvh w-full flex-col overflow-y-auto rounded-none p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl px-3 text-sm text-muted hover:text-fg"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
