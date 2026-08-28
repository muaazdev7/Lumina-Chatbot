import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

// How long to wait for the Stripe webhook before telling the user it is
// still processing. Credits are granted by the webhook, not by this page.
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 40000

const Loading = () => {

    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { fetchUser, user } = useAppContext()

    // This component doubles as an inline spinner. Only the /loading route -
    // where Stripe sends the user back after checkout - should poll/redirect.
    const isStripeReturn = pathname === '/loading'

    const [timedOut, setTimedOut] = useState(false)
    // Credit balance before the purchase, captured once the user first loads.
    const baselineCredits = useRef(null)

    useEffect(() => {
        if (!isStripeReturn) return
        if (baselineCredits.current === null && user) {
            baselineCredits.current = user.credits
        }
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

    return (
        <div className='bg-gradient-to-b from-[#531B81] to-[#29184B]
        backdrop-opacity-60 flex flex-col gap-4 items-center justify-center h-screen w-screen
        text-white text-2xl'>
            {!timedOut && (
                <div className='w-10 h-10 rounded-full border-3 border-white
            border-t-transparent animate-spin'></div>
            )}
            {isStripeReturn && (
                timedOut ? (
                    <div className='flex flex-col items-center gap-3 px-6 text-center'>
                        {/* Deliberately not an error - the payment may well have
                            succeeded and the webhook is simply still in flight. */}
                        <p className='text-base text-white/90'>
                            Your payment is still being confirmed.
                        </p>
                        <p className='text-sm text-white/70 max-w-md'>
                            This can take a moment. Your credits will appear automatically once
                            the confirmation arrives - you do not need to pay again.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className='mt-2 px-4 py-2 text-sm rounded-md bg-white/15 hover:bg-white/25 transition-colors cursor-pointer'
                        >
                            Continue to app
                        </button>
                    </div>
                ) : (
                    <p className='text-sm text-white/80'>Confirming your payment...</p>
                )
            )}
        </div>
    )
}

export default Loading
