import { useEffect, useRef } from 'react'
import Button from './Button'

/**
 * Replaces window.confirm(), which could not be themed and looked foreign.
 * Traps focus, closes on Escape, restores focus to the opener.
 */
const ConfirmDialog = ({
  open,
  title,
  message,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
}) => {
  const panelRef = useRef(null)
  const confirmRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement
    confirmRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
        return
      }
      if (e.key !== 'Tab') return

      // Simple focus trap across the dialog's focusable children.
      const nodes = panelRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!nodes?.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      openerRef.current?.focus?.()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-90 grid place-items-center p-10 bg-[rgba(46,43,37,.52)] backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel?.() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-[min(460px,100%)] flex flex-col gap-3.5 p-8 rounded-[32px] bg-panel shadow-[0_30px_70px_rgba(0,0,0,.35)] lum-rise"
      >
        {icon && (
          <div className="w-[46px] h-[46px] grid place-items-center rounded-full bg-acc-soft text-acc-ink">
            {icon}
          </div>
        )}
        <h4 id="confirm-title" className="text-[22px]">{title}</h4>
        {message && <p className="m-0 text-sm text-muted">{message}</p>}
        <div className="flex justify-end gap-2.5 mt-2.5">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant="danger" onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
