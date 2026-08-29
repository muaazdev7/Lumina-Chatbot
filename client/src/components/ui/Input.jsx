import { useId } from 'react'
import { AlertIcon } from './icons'

/**
 * Labelled pill input with an inline error — the design shows the error
 * under the field, not only as a toast.
 */
const Input = ({ label, error, className = '', id, ...rest }) => {
  const autoId = useId()
  const inputId = id || autoId
  const errorId = `${inputId}-error`

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs text-muted mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full min-h-12 px-4.5 rounded-full bg-panel text-text text-[15px]
          border outline-none transition-[border-color,box-shadow] duration-150
          placeholder:text-faint
          focus:border-accent focus:shadow-[0_0_0_4px_rgba(198,113,57,.16)]
          ${error ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 mt-2 ml-1 text-xs text-danger">
          <AlertIcon size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
