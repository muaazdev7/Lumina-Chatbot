import { useState } from 'react'
import { BrokenImageIcon } from './icons'

/**
 * Replaces the browser's broken-image icon with the designed fallback.
 * ImageKit occasionally serves a placeholder while an asset is still
 * being prepared, so a retry is genuinely useful.
 */
const SafeImage = ({ src, alt, className = '', containerClassName = '', height, ...rest }) => {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  if (failed) {
    return (
      <div
        style={{ height }}
        className={`flex flex-col items-center justify-center gap-2.5 px-4 text-center bg-sunk text-faint ${containerClassName}`}
      >
        <BrokenImageIcon size={26} />
        <span className="text-xs">This image could not be loaded</span>
        <button
          type="button"
          onClick={() => { setFailed(false); setAttempt(a => a + 1) }}
          className="min-h-9 px-3.5 rounded-full border border-line bg-transparent text-text text-xs cursor-pointer hover:border-accent"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <img
      key={attempt}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ height }}
      className={className}
      {...rest}
    />
  )
}

export default SafeImage
