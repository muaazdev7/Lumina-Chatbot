import Button from './Button'
import { AlertIcon } from './icons'

const ErrorState = ({ message, onRetry, className = '' }) => (
  <div className={`flex flex-col items-center gap-3 px-4 py-10 text-center ${className}`}>
    <div className="w-11 h-11 grid place-items-center rounded-full bg-acc-soft text-acc-ink">
      <AlertIcon size={20} />
    </div>
    <p className="m-0 text-sm text-muted max-w-[44ch]">{message}</p>
    {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
  </div>
)

export default ErrorState
