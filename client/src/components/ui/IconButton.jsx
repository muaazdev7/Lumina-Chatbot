
/**
 * Icon-only button. `label` is required and becomes the accessible name —
 * the old build had unlabelled clickable <img> elements.
 * 44px default so it is a valid touch target.
 */
const IconButton = ({ label, children, className = '', size = 44, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    style={{ width: size, height: size }}
    className={`flex-none grid place-items-center rounded-full border-0 bg-transparent
      text-faint cursor-pointer transition-colors duration-150
      hover:bg-sunk hover:text-acc-ink disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
    {...rest}
  >
    {children}
  </button>
)

export default IconButton
