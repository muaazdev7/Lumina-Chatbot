import { useMemo, useState } from 'react'
import moment from 'moment'
import { useAppContext } from '../context/AppContext'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import EmptyState from './ui/EmptyState'
import Skeleton from './ui/Skeleton'
import ConfirmDialog from './ui/ConfirmDialog'
import {
  PlusIcon, SearchIcon, TrashIcon, GalleryIcon, GemIcon,
  MoonIcon, LogoutIcon, CloseIcon,
} from './ui/icons'

const previewOf = (chat) =>
  chat.messages?.[0]?.content ? chat.messages[0].content.slice(0, 60) : chat.name

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {
  const {
    chats, loadingChats, selectedChat, setSelectedChat,
    createNewChat, removeChat, logout,
    theme, setTheme, user, navigate,
  } = useAppContext()

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chats
    return chats.filter(c => previewOf(c).toLowerCase().includes(q))
  }, [chats, search])

  const close = () => setIsMenuOpen(false)

  const handleNewChat = async () => {
    if (creating) return
    setCreating(true)
    const chat = await createNewChat()
    if (chat) { navigate('/'); close() }
    setCreating(false)
  }

  const handleSelect = (chat) => { navigate('/'); setSelectedChat(chat); close() }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await removeChat(pendingDelete._id)
    setDeleting(false)
    setPendingDelete(null)
  }

  const isDark = theme === 'dark'

  return (
    <>
      {/* Backdrop — tapping outside dismisses the overlay on mobile */}
      {isMenuOpen && (
        <div
          onClick={close}
          className="md:hidden fixed inset-0 z-40 bg-[rgba(46,43,37,.45)]"
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-72 flex-none h-screen flex flex-col gap-3.5 px-[18px] py-[22px]
          bg-surface border-r border-line relative z-50
          max-md:fixed max-md:top-0 max-md:left-0 max-md:shadow-[24px_0_60px_rgba(46,43,37,.28)]
          ${isMenuOpen ? 'max-md:flex' : 'max-md:hidden'}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-1.5 pt-0.5">
          <div
            className="w-[30px] h-[30px] rounded-full shadow-[0_4px_12px_rgba(198,113,57,.32)]"
            style={{ background: 'radial-gradient(circle at 32% 30%, #f6a06b, var(--accent) 55%, var(--accent-2) 135%)' }}
          />
          <span className="font-heading text-[21px] tracking-tight">Lumina</span>
          <IconButton label="Close menu" onClick={close} className="md:hidden ml-auto bg-bg text-text">
            <CloseIcon size={18} />
          </IconButton>
        </div>

        <Button variant="gradient" onClick={handleNewChat} loading={creating} className="w-full min-h-[46px] mt-1.5">
          {!creating && <PlusIcon size={18} />}
          {creating ? 'Creating…' : 'New chat'}
        </Button>

        {/* Search */}
        <label className="flex items-center gap-2.5 px-3.5 min-h-[42px] rounded-full bg-bg border border-line text-faint focus-within:border-accent">
          <SearchIcon size={16} />
          <span className="sr-only">Search conversations</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="flex-1 min-w-0 border-0 bg-transparent outline-none text-[13px] text-text placeholder:text-faint"
          />
        </label>

        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-[10px] tracking-[.12em] uppercase text-faint">Recent chats</span>
          <span className="text-[10px] text-faint">{chats.length || ''}</span>
        </div>

        {/* Chat list */}
        <nav aria-label="Recent chats" className="lum-scroll flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {loadingChats && chats.length === 0 && (
            <div className="flex flex-col gap-1.5">
              {[0, 0.15, 0.3, 0.45].map((d, i) => (
                <Skeleton key={i} delay={d} className="h-[58px] rounded-[20px]" />
              ))}
            </div>
          )}

          {!loadingChats && chats.length === 0 && (
            <EmptyState title="No chats yet" message="Start one and it will appear here." />
          )}

          {!loadingChats && chats.length > 0 && filtered.length === 0 && (
            <EmptyState title="No matches" message="No chats match your search." />
          )}

          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {filtered.map((chat) => {
              const active = selectedChat?._id === chat._id
              return (
                <li key={chat._id}>
                  <div
                    className={`flex items-start gap-2 p-3 rounded-[20px] border transition-colors
                      ${active ? 'bg-acc-soft border-accent' : 'bg-transparent border-transparent hover:bg-bg'}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(chat)}
                      aria-current={active ? 'true' : undefined}
                      className="flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer text-text"
                    >
                      <span className="block text-[13px] font-semibold truncate">{previewOf(chat)}</span>
                      <span className="block mt-0.5 text-[11px] text-muted">{moment(chat.updatedAt).fromNow()}</span>
                    </button>
                    <IconButton
                      label={`Delete chat: ${previewOf(chat)}`}
                      size={36}
                      onClick={() => setPendingDelete(chat)}
                      className={active ? 'text-acc-ink hover:bg-[rgba(140,73,26,.14)]' : ''}
                    >
                      <TrashIcon size={15} />
                    </IconButton>
                  </div>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-1.5 pt-3 border-t border-line">
          <button
            type="button"
            onClick={() => { navigate('/community'); close() }}
            className="flex items-center gap-2.5 w-full min-h-11 px-3.5 rounded-full border-0 bg-transparent cursor-pointer text-[13px] text-text text-left hover:bg-bg"
          >
            <span className="text-accent-2"><GalleryIcon size={17} /></span>
            Community images
          </button>

          <button
            type="button"
            onClick={() => { navigate('/credits'); close() }}
            className="flex items-center gap-2.5 w-full min-h-11 px-3.5 rounded-full border-0 bg-transparent cursor-pointer text-[13px] text-text text-left hover:bg-bg"
          >
            <span className="text-accent"><GemIcon size={17} /></span>
            Credits
            <span className="font-heading ml-auto px-2.5 py-0.5 rounded-full bg-acc-soft text-acc-ink text-xs">
              {user?.credits ?? 0}
            </span>
          </button>

          <div className="flex items-center gap-2.5 min-h-11 px-3.5 text-[13px]">
            <span className="text-faint"><MoonIcon size={17} /></span>
            Dark mode
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label="Toggle dark mode"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`ml-auto w-[46px] h-[26px] flex-none p-[3px] rounded-full border-0 cursor-pointer flex transition-colors
                ${isDark ? 'bg-accent justify-end' : 'bg-line justify-start'}`}
            >
              <span className="w-5 h-5 rounded-full bg-panel shadow-[0_1px_3px_rgba(0,0,0,.28)]" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 min-h-[52px] px-3 mt-0.5 rounded-full bg-bg">
            <div className="w-8 h-8 flex-none grid place-items-center rounded-full bg-sage-soft text-sage-ink font-heading text-sm">
              {(user?.name?.[0] || '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[13px] font-semibold truncate">{user?.name}</p>
              <p className="m-0 text-[11px] text-muted">{user?.credits ?? 0} credits</p>
            </div>
            {/* Always visible — the old build hid this behind :hover,
                which made logout unreachable on touch devices. */}
            <IconButton label="Log out" size={36} onClick={() => { logout('Logged out'); navigate('/'); close() }}>
              <LogoutIcon size={16} />
            </IconButton>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        icon={<TrashIcon size={20} />}
        title="Delete this chat?"
        message={pendingDelete
          ? `“${previewOf(pendingDelete)}” and its messages will be removed. This cannot be undone.`
          : ''}
        confirmLabel="Delete chat"
        cancelLabel="Keep it"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}

export default Sidebar
