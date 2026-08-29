import React, { Suspense, lazy, useState } from 'react'
import Sidebar from './components/Sidebar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Chatbox from './components/Chatbox'
// 3.10 - Credits and Community are not needed on first paint, so their code
// (and react-markdown/prismjs pulled in transitively) loads on demand.
const Credits = lazy(() => import('./pages/Credits'))
const Community = lazy(() => import('./pages/Community'))
import Loading from './pages/Loading'
import Login from './pages/Login'
import { assets } from './assets/assets'
import './assets/prism.css'
import { useAppContext } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loadingUser } = useAppContext()

  const { pathname } = useLocation()

  if (pathname === '/loading') return <Loading />

  // Wait for the session check so the login screen does not flash for
  // users who are already signed in.
  if (loadingUser) {
    return (
      <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen'>
        <div className='w-10 h-10 rounded-full border-3 border-white border-t-transparent animate-spin'></div>
      </div>
    )
  }

  return (
    <>
      {!isMenuOpen && user && <img src={assets.menu_icon} className='absolute top-3 left-3
        w-8 h-8 cursor-pointer md:hidden not-dark:invert z-50' onClick={() => setIsMenuOpen(true)} alt="menu" />}

        {user ? (
          <div className='flex h-screen w-screen bg-white text-black dark:bg-gradient-to-b dark:from-[#242124] dark:to-[#000000] dark:text-white transition-all duration-500'>
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            {/* 2.6 - a render error inside a route no longer blanks the app;
                the sidebar stays usable. */}
            <ErrorBoundary>
              {/* Loading only redirects on the /loading route, so it is safe
                  to reuse as a Suspense fallback here. */}
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path='/' element={<Chatbox />} />
                  <Route path='/credits' element={<Credits />} />
                  <Route path='/community' element={<Community />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        ) : (
          <div className='bg-gradient-to-b from-[#242124] to-[#000000] flex
            items-center justify-center h-screen w-screen'>
            <Login />
          </div>
        )}
    </>
  )
}

export default App
