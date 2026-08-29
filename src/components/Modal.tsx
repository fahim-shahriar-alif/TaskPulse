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
    <div className={`fixed inset-0 flex items-end justify-center p-4 sm:items-center ${stacked ? 'z-[60]' : 'z-50'}`}>
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="glass relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-5">
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
