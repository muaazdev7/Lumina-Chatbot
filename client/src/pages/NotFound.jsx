import { useAppContext } from '../context/AppContext'

/**
 * The 404 screen from the design. App.jsx had no catch-all before this,
 * so an unknown path silently rendered the chat.
 */
const NotFound = () => {
  const { navigate } = useAppContext()

  return (
    <div className="flex-1 min-w-0 h-screen flex flex-col items-center justify-center gap-[18px] text-center p-10 bg-bg">
      <span
        className="font-heading text-[110px] sm:text-[150px] leading-[.9] text-transparent bg-clip-text"
        style={{ backgroundImage: 'linear-gradient(140deg, var(--accent), var(--accent-2))' }}
      >
        404
      </span>
      <h2 className="text-[26px] sm:text-[32px]">That page has wandered off.</h2>
      <p className="m-0 text-[15px] text-muted max-w-[42ch]">
        The link may be old, or the chat it pointed at was deleted.
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="min-h-12 px-[26px] rounded-full border-0 cursor-pointer font-heading text-[15px] text-[#fff8f0] hover:brightness-105"
          style={{ background: 'linear-gradient(118deg, var(--accent), #b2622d 55%, var(--accent-2) 150%)' }}
        >
          Back to chat
        </button>
        <button
          type="button"
          onClick={() => navigate('/community')}
          className="min-h-12 px-[26px] rounded-full border border-line bg-transparent text-text cursor-pointer font-heading text-[15px] hover:border-accent"
        >
          Browse community
        </button>
      </div>
    </div>
  )
}

export default NotFound
