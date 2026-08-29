
/**
 * The five button variants drawn in the design's UI kit.
 * Every target is at least 44px tall so it is reachable on touch.
 */
const VARIANTS = {
  gradient:
    'text-[#fff8f0] border-0 shadow-[0_8px_20px_rgba(198,113,57,.30)] ' +
    'bg-[linear-gradient(118deg,var(--accent),#b2622d_55%,var(--accent-2)_150%)] hover:brightness-105 active:translate-y-px',
  primary:
    'bg-accent text-bg border-0 hover:bg-[#b2622d] active:bg-[#8c491a]',
  secondary:
    'bg-transparent text-text border border-line hover:border-accent hover:text-acc-ink',
  ghost:
    'bg-transparent text-acc-ink border-0 hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]',
  danger:
    'bg-[#8c491a] text-[#fff2eb] border-0 hover:bg-[#643312]',
}

const Button = ({
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-full cursor-pointer
      font-heading text-[15px] leading-none transition-[background,filter,transform,border-color,color] duration-200
      disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none
      ${VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {loading && (
      <span
        aria-hidden="true"
        className="w-4 h-4 rounded-full border-2 border-current border-t-transparent lum-spin"
      />
    )}
    {children}
  </button>
)

export default Button
