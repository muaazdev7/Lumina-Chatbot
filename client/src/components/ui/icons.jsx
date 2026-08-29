
/**
 * Lucide icons at stroke-width 2.75, as the Organic design system specifies.
 * Inline SVG rather than a dependency: the design uses ~14 icons.
 */
const Svg = ({ size = 18, children, fill = 'none', ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" {...rest}
  >
    {children}
  </svg>
)

export const PlusIcon = (p) => <Svg {...p}><path d="M5 12h14M12 5v14" /></Svg>
export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Svg>
export const TrashIcon = (p) => <Svg {...p}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></Svg>
export const GalleryIcon = (p) => <Svg {...p}><rect width="18" height="18" x="3" y="3" rx="5" /><circle cx="9" cy="9" r="1.6" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></Svg>
export const GemIcon = (p) => <Svg {...p}><path d="M6 3h12l4 6-10 12L2 9Z" /><path d="M2 9h20" /></Svg>
export const MoonIcon = (p) => <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>
export const LogoutIcon = (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
export const MenuIcon = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
export const CloseIcon = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
export const SendIcon = (p) => <Svg {...p}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></Svg>
export const StopIcon = (p) => <Svg {...p} fill="currentColor" strokeWidth="0"><rect x="7" y="7" width="10" height="10" rx="2.5" /></Svg>
export const CopyIcon = (p) => <Svg {...p}><rect width="13" height="13" x="9" y="9" rx="3" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></Svg>
export const CheckIcon = (p) => <Svg {...p}><path d="m5 13 4 4L19 7" /></Svg>
export const AlertIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" /></Svg>
export const ClockIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
export const SparkIcon = (p) => <Svg {...p}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" /></Svg>
export const OfflineIcon = (p) => <Svg {...p}><path d="m2 2 20 20" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M2 8.8a15 15 0 0 1 4.2-2.6" /><path d="M10.7 5c4-.4 8.1.9 11.3 3.8" /></Svg>
export const BrokenImageIcon = (p) => <Svg {...p}><rect width="18" height="18" x="3" y="3" rx="5" /><path d="m3 17 5-5 4 4" /><path d="m2 2 20 20" /></Svg>
