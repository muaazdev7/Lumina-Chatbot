import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { getErrorMessage } from '../services/api'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const MIN_PASSWORD = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Login = () => {
  const { login, register } = useAppContext()

  const [mode, setMode] = useState('login')
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'
  const set = (key) => (e) => {
    setValues(v => ({ ...v, [key]: e.target.value }))
    setErrors(er => ({ ...er, [key]: undefined }))
  }

  const switchMode = (next) => { setMode(next); setErrors({}) }

  /** Inline validation — the design shows errors under the field, not only as a toast. */
  const validate = () => {
    const next = {}
    if (isRegister && !values.name.trim()) next.name = 'Enter your name.'
    if (!EMAIL_RE.test(values.email.trim())) next.email = 'Enter a valid email address.'
    if (isRegister && values.password.length < MIN_PASSWORD) {
      next.password = `Password must be at least ${MIN_PASSWORD} characters.`
    } else if (!values.password) {
      next.password = 'Enter your password.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting || !validate()) return

    setSubmitting(true)
    try {
      const data = isRegister
        ? await register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
        : await login({ email: values.email.trim(), password: values.password })

      if (data.success) {
        toast.success(isRegister ? 'Account created' : 'Welcome back!')
      } else {
        toast.error(data.message || 'Authentication failed')
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Authentication failed')
      // Surface credential failures on the fields as well as the toast.
      if (/email or password/i.test(message)) {
        setErrors({ email: ' ', password: 'Check your email and password.' })
      }
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Brand panel — hidden on mobile, where the form takes the full screen */}
      <div
        className="hidden lg:flex w-[46%] flex-none relative flex-col justify-between px-13 py-14 overflow-hidden text-[#fff8f0]"
        style={{ background: 'linear-gradient(155deg, #c67139 0%, #8c491a 46%, #56633f 120%)' }}
      >
        <div aria-hidden="true" className="absolute -top-32 -right-24 w-90 h-90 rounded-full bg-[rgba(255,241,229,.14)]" />
        <div aria-hidden="true" className="absolute -bottom-36 -left-20 w-75 h-75 rounded-full bg-[rgba(225,238,204,.16)]" />

        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[rgba(255,248,240,.92)]" />
          <span className="font-heading text-[22px]">Lumina</span>
        </div>

        <div className="relative">
          <h2 className="mb-4 text-[46px] leading-[1.06] text-[#fff8f0]">Words in, pictures out.</h2>
          <p className="m-0 text-base leading-relaxed max-w-[34ch] text-[rgba(255,248,240,.85)]">
            One place to write with a model, generate images, and publish the good ones
            to a gallery other people actually browse.
          </p>
        </div>

        <p className="relative m-0 text-[13px] text-[rgba(255,248,240,.7)]">
          New accounts start with 20 credits — no card needed.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-100 flex flex-col gap-4.5">
          <div className="lg:hidden flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full"
              style={{ background: 'radial-gradient(circle at 32% 30%, #f6a06b, var(--accent) 55%, var(--accent-2) 135%)' }} />
            <span className="font-heading text-[22px]">Lumina</span>
          </div>

          <h1 className="text-[32px]">{isRegister ? 'Create an account' : 'Welcome back'}</h1>
          <p className="m-0 text-sm text-muted">
            {isRegister
              ? 'Twenty credits are waiting — no card needed.'
              : 'Pick up where you left off.'}
          </p>

          {/* Mode switch */}
          <div className="flex p-1 rounded-full bg-sunk mt-1" role="tablist" aria-label="Authentication mode">
            {[['login', 'Log in'], ['register', 'Sign up']].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={`flex-1 min-h-10 rounded-full border-0 cursor-pointer text-sm transition-colors
                  ${mode === value ? 'bg-accent text-bg' : 'bg-transparent text-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {isRegister && (
            <Input
              label="Name" type="text" autoComplete="name" placeholder="your name"
              value={values.name} onChange={set('name')} error={errors.name} required
            />
          )}

          <Input
            label="Email" type="email" autoComplete="email" placeholder="you@gmail.com"
            value={values.email} onChange={set('email')} error={errors.email} required
          />

          <Input
            label="Password" type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
            value={values.password} onChange={set('password')} error={errors.password}
            minLength={isRegister ? MIN_PASSWORD : undefined} required
          />

          <Button type="submit" variant="gradient" loading={submitting} className="min-h-13 mt-1.5 text-base">
            {submitting
              ? (isRegister ? 'Creating account…' : 'Logging in…')
              : (isRegister ? 'Create account' : 'Log in')}
          </Button>

          <p className="m-0 text-xs text-faint text-center">
            {isRegister ? 'Already have an account? ' : 'New to Lumina? '}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              className="border-0 bg-transparent p-0 cursor-pointer text-acc-ink underline underline-offset-2 text-xs"
            >
              {isRegister ? 'Log in' : 'Create one'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
