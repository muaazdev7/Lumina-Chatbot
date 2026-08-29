import { Component } from 'react'

/**
 * Contains render-time errors so one broken component cannot blank the whole
 * app (2.6). Must be a class component - hooks cannot implement a boundary.
 *
 * Note this does NOT catch errors in event handlers or async code; those are
 * already handled by the try/catch and toasts in src/services.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info?.componentStack)
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <div className='flex-1 min-w-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-bg'>
                <div className='w-[46px] h-[46px] grid place-items-center rounded-full bg-acc-soft text-acc-ink'>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.75" strokeLinecap="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" />
                    </svg>
                </div>
                <h3 className='text-[22px]'>Something went wrong displaying this view.</h3>
                <p className='m-0 text-sm text-muted max-w-[42ch]'>
                    Your data is safe. Reloading usually fixes it.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className='mt-2 min-h-11 px-5 rounded-full border-0 cursor-pointer font-heading text-[15px] text-[#fff8f0] hover:brightness-105'
                    style={{ background: 'linear-gradient(118deg, var(--accent), #b2622d 55%, var(--accent-2) 150%)' }}
                >
                    Reload
                </button>
            </div>
        )
    }
}

export default ErrorBoundary
