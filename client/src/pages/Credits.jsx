import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getPlans, purchasePlan } from '../services/creditService'
import { getErrorMessage } from '../services/api'
import { useAppContext } from '../context/AppContext'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'

/**
 * Plans render from GET /api/credit/plan — the server owns price and credits.
 * The middle plan is highlighted, matching the design's "Most popular" card.
 */
const Credits = () => {
  const { user } = useAppContext()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchasingId, setPurchasingId] = useState(null)

  const fetchPlans = async () => {
    setLoading(true); setError(null)
    try {
      const data = await getPlans()
      if (data.success) setPlans(data.plans)
      else setError(data.message || 'Failed to load plans')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load plans'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlans() }, [])

  const buy = async (planId) => {
    if (purchasingId) return
    setPurchasingId(planId)
    try {
      const data = await purchasePlan(planId)
      if (data.success && data.url) {
        window.location.assign(data.url)   // hand off to Stripe Checkout
      } else {
        toast.error(data.message || 'Could not start the checkout')
        setPurchasingId(null)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not start the checkout'))
      setPurchasingId(null)
    }
  }

  return (
    <div className="lum-scroll flex-1 min-w-0 h-screen overflow-y-auto bg-bg relative">
      <div aria-hidden="true" className="pointer-events-none absolute -top-36 -right-24 w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(198,113,57,.16), transparent 68%)' }} />

      <div className="relative z-2 max-w-[1000px] mx-auto px-6 md:px-[60px] pt-16 pb-20 max-md:pt-20">
        <span className="tag-accent">Credits</span>
        <h2 className="mt-4 mb-2.5 text-[34px] sm:text-[46px] tracking-tight">Top up when you need it.</h2>
        <p className="mb-2 text-base text-muted max-w-[52ch]">
          You currently have <strong className="text-acc-ink">{user?.credits ?? 0} credits</strong>.
          Plans are one-off purchases — nothing recurring, nothing to cancel.
        </p>

        {error && <ErrorState message={error} onRetry={fetchPlans} />}

        {loading && !error && (
          <div className="grid md:grid-cols-3 gap-[22px] mt-10">
            {[0, 0.1, 0.2].map(d => <Skeleton key={d} delay={d} className="h-[380px] rounded-[30px]" />)}
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-3 gap-[22px] mt-10 items-start">
            {plans.map((plan, index) => {
              const featured = index === 1
              const busy = purchasingId === plan._id
              return (
                <div
                  key={plan._id}
                  className={`lum-card flex flex-col gap-3.5 rounded-[30px] border
                    ${featured
                      ? 'p-[34px_28px] border-accent shadow-[0_22px_50px_rgba(198,113,57,.22)] md:-translate-y-3'
                      : 'p-[30px_26px] bg-panel border-line'}`}
                  style={featured
                    ? { background: 'linear-gradient(165deg, var(--acc-soft) 0%, var(--panel) 62%)' }
                    : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] tracking-[.1em] uppercase ${featured ? 'text-acc-ink' : 'text-faint'}`}>
                      {plan.name}
                    </span>
                    {featured && (
                      <span className="ml-auto text-[11px] px-2.5 py-0.5 rounded-full bg-accent text-[#fff8f0]">
                        Most popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className={`font-heading leading-none ${featured ? 'text-[52px] text-acc-ink' : 'text-[44px]'}`}>
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted">/ {plan.credits} credits</span>
                  </div>

                  <ul className="list-none m-0 mt-1.5 p-0 flex flex-col gap-2.5 text-sm text-muted">
                    {plan.features.map(f => (
                      <li key={f} className="flex gap-2.5">
                        <span className="text-accent-2" aria-hidden="true">✓</span>{f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => buy(plan._id)}
                    disabled={purchasingId !== null}
                    className={`mt-[18px] min-h-12 rounded-full cursor-pointer font-heading text-[15px]
                      disabled:opacity-45 disabled:cursor-not-allowed transition-[filter,background]
                      ${featured
                        ? 'border-0 text-[#fff8f0] shadow-[0_10px_24px_rgba(198,113,57,.34)] hover:brightness-105'
                        : 'border border-accent bg-transparent text-acc-ink hover:bg-acc-soft'}`}
                    style={featured
                      ? { background: 'linear-gradient(118deg, var(--accent), #b2622d 55%, var(--accent-2) 150%)' }
                      : undefined}
                  >
                    {busy ? 'Redirecting…' : `Get ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-9 mb-0 text-xs text-faint text-center">
          Payments run through Stripe Checkout. Only the plan id leaves the browser —
          price and credits come from the server.
        </p>
      </div>
    </div>
  )
}

export default Credits
