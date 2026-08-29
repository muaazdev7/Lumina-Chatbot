import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { sendImageMessage, sendTextMessage } from '../services/messageService'
import { getErrorMessage, isAbortError } from '../services/api'
import Skeleton from './ui/Skeleton'
import { SendIcon, StopIcon } from './ui/icons'

const Message = lazy(() => import('./Message'))

const MAX_PROMPT = 4000
const MAX_IMAGE_PROMPT = 1000

const SUGGESTIONS = [
  { label: 'Explain optimistic UI in two paragraphs', mode: 'text' },
  { label: 'A lantern in a wheat field at dusk', mode: 'image' },
  { label: 'Turn these notes into a changelog', mode: 'text' },
]

const Chatbox = () => {
  const containerRef = useRef(null)
  const abortRef = useRef(null)

  const {
    selectedChat, setSelectedChat, setChats, setCredits,
    user, createNewChat, loadingChats,
  } = useAppContext()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('text')
  const [isPublished, setIsPublished] = useState(false)

  const limit = mode === 'image' ? MAX_IMAGE_PROMPT : MAX_PROMPT
  const cost = mode === 'image' ? 2 : 1

  useEffect(() => {
    setMessages(selectedChat?.messages ?? [])
  }, [selectedChat?._id])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Abort any in-flight request if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const onSubmit = async (e) => {
    e?.preventDefault()
    if (loading) return

    const trimmed = prompt.trim()
    if (!trimmed) return
    if (!user) return toast.error('Please log in to send a message')

    if (trimmed.length > limit) {
      return toast.error(`Prompt must be ${limit} characters or fewer`)
    }

    if ((user.credits ?? 0) < cost) {
      return toast.error(
        (t) => (
          <span className="flex items-center gap-2">
            You need {cost} credit{cost > 1 ? 's' : ''} for this.
            <a
              href="/credits"
              onClick={() => toast.dismiss(t.id)}
              className="text-acc-ink underline underline-offset-2"
            >
              Credits page
            </a>
          </span>
        )
      )
    }

    let chat = selectedChat
    if (!chat) {
      chat = await createNewChat()
      if (!chat) return
    }

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      isImage: false,
      authorInitial: user.name?.[0],
    }

    setMessages(prev => [...prev, userMessage])
    setPrompt('')
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const payload = { chatId: chat._id, prompt: trimmed }
      const data = mode === 'image'
        ? await sendImageMessage({ ...payload, isPublished }, { signal: controller.signal })
        : await sendTextMessage(payload, { signal: controller.signal })

      if (!data.success) {
        toast.error(data.message || 'Failed to get a reply')
        setMessages(prev => prev.filter(m => m !== userMessage))
        setPrompt(trimmed)
        return
      }

      const reply = { ...data.reply, prompt: trimmed }
      setMessages(prev => [...prev, reply])
      if (typeof data.credits === 'number') setCredits(data.credits)

      const updatedChat = {
        ...chat,
        messages: [...(chat.messages || []), userMessage, reply],
        updatedAt: new Date().toISOString(),
      }
      setSelectedChat(updatedChat)
      setChats(prev => prev.map(c => (c._id === chat._id ? updatedChat : c)))
    } catch (error) {
      // Roll back either way; only a real failure gets an error toast.
      setMessages(prev => prev.filter(m => m !== userMessage))
      setPrompt(trimmed)
      if (isAbortError(error)) {
        toast('Generation cancelled — your credits were returned')
      } else {
        toast.error(getErrorMessage(error, 'Failed to get a reply'))
      }
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  const applySuggestion = (s) => { setMode(s.mode); setPrompt(s.label) }

  const title = messages[0]?.content?.slice(0, 60) || selectedChat?.name || 'New chat'

  return (
    <div className="flex-1 min-w-0 h-screen relative flex flex-col bg-bg overflow-hidden">
      {/* Warm ambient blooms from the design */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-36 -right-24 w-[420px] h-[420px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(198,113,57,.16), transparent 68%)' }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -left-16 w-[380px] h-[380px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(122,138,94,.15), transparent 68%)' }} />

      <div className="relative z-2 flex flex-col h-full min-h-0">
        {/* Chat header */}
        <header className="flex items-center gap-3.5 px-6 md:px-[46px] py-[22px] border-b border-line max-md:pl-16">
          <div className="flex-1 min-w-0">
            <h3 className="text-[19px] truncate">{title}</h3>
            <p className="mt-0.5 mb-0 text-xs text-muted">
              {messages.length} message{messages.length === 1 ? '' : 's'}
            </p>
          </div>
          <span className={mode === 'image' ? 'tag-accent' : 'tag-sage'}>
            {mode === 'image' ? 'Image mode' : 'Text mode'}
          </span>
        </header>

        {/* Thread */}
        <div ref={containerRef} className="lum-scroll flex-1 min-h-0 overflow-y-auto px-6 md:px-[46px] pt-[34px] pb-5">
          {loadingChats && messages.length === 0 ? (
            <div className="flex flex-col gap-6 max-w-[820px] mx-auto">
              <Skeleton className="self-end w-[340px] h-14 rounded-[22px_22px_8px_22px]" />
              <div className="flex flex-col gap-2.5">
                {['100%', '92%', '74%', '52%'].map((w, i) => (
                  <Skeleton key={w} delay={i * 0.1} style={{ width: w }} className="h-[15px] rounded-full" />
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-[18px] text-center pb-10">
              <div className="w-[84px] h-[84px] rounded-full shadow-[0_16px_40px_rgba(198,113,57,.34)]"
                style={{ background: 'radial-gradient(circle at 32% 30%, #f6a06b, var(--accent) 55%, var(--accent-2) 140%)' }} />
              <h2 className="text-[40px] sm:text-[52px] tracking-tight">Ask me anything.</h2>
              <p className="m-0 text-[15px] text-muted max-w-[44ch]">
                Write a prompt, or start from one of these. Text costs 1 credit, an image costs 2.
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center max-w-[640px] mt-1.5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="min-h-11 px-[18px] rounded-full border border-line bg-panel cursor-pointer
                      text-[13px] text-text hover:border-accent hover:text-acc-ink transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div aria-live="polite" className="flex flex-col gap-7 max-w-[840px] mx-auto">
              <Suspense fallback={null}>
                {messages.map((m, i) => (
                  <Message key={m._id || `${m.timestamp}-${m.role}-${i}`} message={m} />
                ))}
              </Suspense>

              {loading && (
                <div className="flex gap-3 items-center">
                  <div className="w-[34px] h-[34px] flex-none rounded-full lum-pulse"
                    style={{ background: 'radial-gradient(circle at 32% 30%, #f6a06b, var(--accent) 60%, var(--accent-2) 140%)' }} />
                  <div className="flex items-center gap-3 px-[22px] py-4 rounded-[24px_24px_24px_8px] bg-panel shadow-[var(--shadow)]">
                    <span className="flex gap-1.5" aria-hidden="true">
                      {[0, 0.2, 0.4].map(d => (
                        <span key={d} className="w-2 h-2 rounded-full bg-accent"
                          style={{ animation: `lumBounce 1.2s infinite ${d}s` }} />
                      ))}
                    </span>
                    <span className="text-[13px] text-muted">
                      {mode === 'image' ? 'Generating — images take 20–90 seconds' : 'Generating…'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-6 md:px-[46px] pb-[30px] flex flex-col items-center gap-2.5">
          {mode === 'image' && (
            <label className="flex items-center gap-2.5 min-h-10 px-4 rounded-full bg-sage-soft text-sage-ink text-[13px] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#7a8a5e]"
              />
              Publish this image to the community gallery
            </label>
          )}

          <form
            onSubmit={onSubmit}
            className="w-full max-w-[860px] flex items-center gap-3.5 p-3 pl-5 rounded-full bg-panel border border-line
              shadow-[0_14px_34px_rgba(46,43,37,.14)] focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgba(198,113,57,.18)] transition-shadow"
          >
            <div className="flex flex-none p-[3px] rounded-full bg-sunk" role="group" aria-label="Generation mode">
              {['text', 'image'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`min-h-9 px-4 rounded-full border-0 cursor-pointer text-[13px] capitalize transition-colors
                    ${mode === m ? 'bg-accent text-bg' : 'bg-transparent text-muted'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="lum-prompt">Prompt</label>
            <input
              id="lum-prompt"
              type="text"
              maxLength={limit}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={loading ? 'Generating…' : 'Type your prompt here…'}
              disabled={loading}
              className="flex-1 min-w-0 border-0 bg-transparent outline-none text-[15px] text-text placeholder:text-faint disabled:cursor-not-allowed"
            />

            <span
              className={`flex-none text-[11px] tabular-nums ${prompt.length > limit * 0.9 ? 'text-acc-ink' : 'text-faint'}`}
              aria-live="polite"
            >
              {prompt.length}/{limit}
            </span>

            {loading ? (
              <button
                type="button"
                onClick={stop}
                aria-label="Stop generating"
                className="w-[46px] h-[46px] flex-none grid place-items-center rounded-full border-0 cursor-pointer bg-sunk text-acc-ink hover:bg-acc-soft"
              >
                <StopIcon size={18} />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send prompt"
                className="w-[46px] h-[46px] flex-none grid place-items-center rounded-full border-0 cursor-pointer text-[#fff8f0]
                  shadow-[0_8px_18px_rgba(198,113,57,.32)] hover:brightness-105 active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(118deg, var(--accent), #b2622d 60%, var(--accent-2) 155%)' }}
              >
                <SendIcon size={19} />
              </button>
            )}
          </form>

          <p className="m-0 text-[11px] text-faint text-center">
            Text 1 credit · Image 2 credits · the last 16 messages travel with each prompt
          </p>
        </div>
      </div>
    </div>
  )
}

export default Chatbox
