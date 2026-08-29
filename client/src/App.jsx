import { Suspense, lazy, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Chatbox from './components/Chatbox'
import Loading from './pages/Loading'
import Login from './pages/Login'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBar from './components/ui/OfflineBar'
import IconButton from './components/ui/IconButton'
import { MenuIcon } from './components/ui/icons'
import { useAppContext } from './context/AppContext'
import './assets/prism.css'

// Not needed on first paint — keeps react-markdown/prismjs out of the entry chunk.
const Credits = lazy(() => import('./pages/Credits'))
const Community = lazy(() => import('./pages/Community'))
const NotFound = lazy(() => import('./pages/NotFound'))

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loadingUser } = useAppContext()
  const { pathname } = useLocation()

  // Stripe returns here; it must render before the auth gate.
  if (pathname === '/loading') return <Loading />

  // Wait for the session check so the login screen does not flash.
  if (loadingUser) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg">
        <div className="w-10 h-10 rounded-full border-[3px] border-accent border-t-transparent lum-spin" role="status" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <OfflineBar />
        <Login />
      </>
    )
  }

  return (
    <>
      <OfflineBar />

      {/* Mobile menu trigger — hidden once the overlay is open */}
      {!isMenuOpen && (
        <IconButton
          label="Open menu"
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden fixed top-3 left-3 z-50 bg-surface text-text shadow-[var(--shadow)]"
        >
          <MenuIcon size={20} />
        </IconButton>
      )}

      <div className="flex h-screen w-full bg-bg text-text">
        <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

        {/* A render error inside a route no longer blanks the app —
            the sidebar stays usable. */}
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Chatbox />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/community" element={<Community />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  )
}

export default App
