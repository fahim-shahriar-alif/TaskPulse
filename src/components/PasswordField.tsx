import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { fieldClass } from '../lib/ui'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  tone?: 'default' | 'lock'
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { className = '', tone = 'default', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const eye =
    tone === 'lock'
      ? 'text-slate-500 hover:text-slate-800 dark:text-white/55 dark:hover:text-white'
      : 'text-muted hover:text-fg'

  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={`${fieldClass} tp-password w-full pr-12 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className={`absolute inset-y-0 right-0 grid w-12 place-items-center ${eye}`}
        onClick={() => setVisible((open) => !open)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
})
