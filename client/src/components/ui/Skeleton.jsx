
/** Shimmer block. Replaces the full-page spinner on lists and the gallery. */
const Skeleton = ({ className = '', style, delay = 0 }) => (
  <div
    aria-hidden="true"
    style={{ animationDelay: `${delay}s`, ...style }}
    className={`lum-skeleton ${className}`}
  />
)

export default Skeleton
