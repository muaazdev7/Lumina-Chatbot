import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import Spinner from '../components/ui/Spinner'
import { ClockIcon } from '../components/ui/icons'

// Credits are granted by the Stripe webhook, not by this page.
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 40000

const Loading = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { fetchUser, user } = useAppContext()

  // Doubles as the Suspense fallback; only /loading polls and redirects.
  const isStripeReturn = pathname === '/loading'

  const [timedOut, setTimedOut] = useState(false)
  const baselineCredits = useRef(null)

  useEffect(() => {
    if (!isStripeReturn) return
    if (baselineCredits.current === null && user) baselineCredits.current = user.credits
  }, [isStripeReturn, user])

  useEffect(() => {
    if (!isStripeReturn) return

    let cancelled = false
    let intervalId
    let timeoutId

    const check = async () => {
      const updated = await fetchUser()
      if (cancelled || !updated) return

      const baseline = baselineCredits.current
      if (baseline !== null && updated.credits > baseline) {
        clearInterval(intervalId)
        clearTimeout(timeoutId)
        toast.success(`${updated.credits - baseline} credits added`)
        navigate('/')
      }
    }

    intervalId = setInterval(check, POLL_INTERVAL_MS)
    check()

    timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      if (!cancelled) setTimedOut(true)
    }, POLL_TIMEOUT_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [isStripeReturn, fetchUser, navigate])

  // Inline spinner for Suspense / page loads.
  if (!isStripeReturn) {
    return (
      <div className="flex-1 min-w-0 h-screen grid place-items-center bg-bg">
        <Spinner size={56} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-[22px] text-center p-10 bg-bg text-text">
      {timedOut ? (
        <>
          <div className="w-[72px] h-[72px] grid place-items-center rounded-full bg-sage-soft text-sage-ink">
            <ClockIcon size={30} />
          </div>
          <h2 className="text-[26px] sm:text-[34px]">Still being confirmed</h2>
          <p className="m-0 text-[15px] text-muted max-w-[48ch] text-pretty">
            Your payment went through and your credits will land shortly —{' '}
            <strong className="text-text">you do not need to pay again</strong>.
            You can carry on in the meantime.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-12 px-7 rounded-full border-0 cursor-pointer font-heading text-[15px] text-[#fff8f0]
              shadow-[0_10px_24px_rgba(198,113,57,.32)] hover:brightness-105"
            style={{ background: 'linear-gradient(118deg, var(--accent), #b2622d 55%, var(--accent-2) 150%)' }}
          >
            Continue to Lumina
          </button>
        </>
      ) : (
        <>
          <Spinner size={72} label="Confirming your payment" />
          <h2 className="text-[26px] sm:text-[34px]">Confirming your payment…</h2>
          <p className="m-0 text-[15px] text-muted max-w-[44ch]">
            This usually takes a few seconds. Keep this tab open — your credits will
            appear the moment Stripe confirms.
          </p>
        </>
      )}
    </div>
  )
}

export default Loading
