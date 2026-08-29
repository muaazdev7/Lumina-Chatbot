
/** The conic-gradient ring from the payment-return screen. */
const Spinner = ({ size = 72, label = 'Loading' }) => (
  <div
    role="status"
    aria-label={label}
    style={{
      width: size,
      height: size,
      background: 'conic-gradient(from 0deg, transparent, var(--accent))',
      mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 0)',
      WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 0)',
    }}
    className="rounded-full lum-spin"
  />
)

export default Spinner
