import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppContextProvider } from './context/AppContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        {/* Toasts inherit the Organic tokens so they match in both themes. */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--panel)',
              color: 'var(--text)',
              border: '1px solid var(--line)',
              borderRadius: '999px',
              padding: '12px 20px',
              fontSize: '14px',
              boxShadow: '0 18px 44px rgba(46,43,37,.26)',
              maxWidth: '520px',
            },
            success: { iconTheme: { primary: 'var(--accent-2)', secondary: 'var(--panel)' } },
            error: { iconTheme: { primary: 'var(--accent)', secondary: 'var(--panel)' } },
          }}
        />
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>,
)
