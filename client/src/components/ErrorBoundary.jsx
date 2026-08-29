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
            <div className='flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center'>
                <p className='text-lg font-medium text-gray-800 dark:text-white'>
                    Something went wrong displaying this view.
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Your data is safe. Reloading usually fixes it.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className='mt-2 px-4 py-2 text-sm rounded-md bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-colors'
                >
                    Reload
                </button>
            </div>
        )
    }
}

export default ErrorBoundary
