import { SparkIcon } from './icons'

/** One shape serves "no chats", "no search matches" and "no images yet". */
const EmptyState = ({ icon, title, message, action, className = '' }) => (
  <div className={`flex flex-col items-center gap-2 px-4 py-8 text-center ${className}`}>
    <div className="w-11 h-11 grid place-items-center rounded-full bg-sunk text-accent">
      {icon || <SparkIcon size={20} />}
    </div>
    <p className="m-0 text-[13px] font-semibold text-text">{title}</p>
    {message && <p className="m-0 text-xs text-muted">{message}</p>}
    {action}
  </div>
)

export default EmptyState
