import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import moment from 'moment'

const Sidebar = ({ isMenuOpen, setIsMenuOpen }) => {

  const {
    chats, loadingChats, selectedChat, setSelectedChat,
    createNewChat, removeChat, logout,
    theme, setTheme, user, navigate
  } = useAppContext()

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const handleNewChat = async () => {
    if (creating) return
    setCreating(true)
    const chat = await createNewChat()
    if (chat) {
      navigate('/')
      setIsMenuOpen(false)
    }
    setCreating(false)
  }

  const handleDeleteChat = async (e, chatId) => {
    // Do not select the chat we are about to delete.
    e.stopPropagation()
    if (!window.confirm('Delete this chat?')) return
    await removeChat(chatId)
  }

  const handleLogout = () => {
    logout('Logged out')
    navigate('/')
    setIsMenuOpen(false)
  }

  const filteredChats = chats.filter((chat) => (
    chat.messages[0]
      ? chat.messages[0]?.content.toLowerCase().includes(search.toLowerCase())
      : chat.name.toLowerCase().includes(search.toLowerCase())
  ))

  return (
    <div className={`flex flex-col h-screen w-64 p-4 bg-white dark:bg-gradient-to-b dark:from-[#242124]/90 dark:to-[#000000]/90 border-r border-[#80609F]/30 backdrop-blur-3xl transition-all duration-500 max-md:absolute top-0 left-0 z-50 text-gray-900 dark:text-white ${isMenuOpen ? 'max-md:flex' : 'max-md:hidden'}`}>

      {/* logo */}
      <img src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark} alt=''
        className='w-full max-w-40 shrink-0' />

      {/* New chat button*/}
      <button onClick={handleNewChat} disabled={creating} className='flex justify-center items-center w-full py-1.5 mt-6
      text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-sm rounded-md
        cursor-pointer shrink-0 border-none hover:opacity-90 disabled:opacity-60 transition-opacity'>
        <span className='mr-2 text-xl'>+</span> {creating ? 'Creating...' : 'New Chat'}
      </button>

      {/* Search conversation*/}
      <div className='flex items-center gap-2 p-2 mt-4 border border-gray-400
    dark:border-white/20 rounded-md shrink-0 focus-within:ring-1 focus-within:ring-purple-500'>
        <img src={assets.search_icon} className='w-4 not-dark:invert' alt="" />
        <input onChange={(e) => setSearch(e.target.value)} value={search} type='text' placeholder='Search conversations' className='text-xs w-full bg-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white outline-none' />
      </div>

      {/* Recent Chats*/}
      <p className='mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 uppercase tracking-wider'>Recent Chats</p>

      {/* Chat List */}
      <div className='flex-1 overflow-y-auto mt-2 text-sm space-y-1.5 pr-1 scrollbar-hide'>
        {loadingChats && chats.length === 0 && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>Loading chats...</p>
        )}
        {!loadingChats && chats.length === 0 && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>No chats yet.</p>
        )}
        {!loadingChats && chats.length > 0 && filteredChats.length === 0 && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>No chats match your search.</p>
        )}
        {
          filteredChats.map((chat) => (
            <div onClick={() => { navigate('/'); setSelectedChat(chat); setIsMenuOpen(false) }} key={chat._id}
              className={`p-2 px-3 dark:bg-[#57317C]/20 border rounded-md cursor-pointer
            flex justify-between group hover:bg-gray-100 dark:hover:bg-[#57317C]/40 transition-colors
            ${selectedChat?._id === chat._id ? 'border-purple-500 dark:border-purple-400' : 'border-gray-300 dark:border-[#80609F]/30'}`}>
              <div className='w-[85%]'>
                <p className='truncate w-full font-medium'>
                  {chat.messages.length > 0 ? chat.messages[0].content.
                    slice(0, 32) : chat.name}
                </p>
                <p className='text-[10px] text-gray-500 dark:text-[#B1A6C0] mt-0.5'>
                  {moment(chat.updatedAt).fromNow()}
                </p>
              </div>
              <img onClick={(e) => handleDeleteChat(e, chat._id)} src={assets.bin_icon}
                className='hidden group-hover:block w-3.5 cursor-pointer not-dark:invert opacity-70 hover:opacity-100' alt="Delete chat" />
            </div>
          ))
        }
      </div>

      {/* Bottom Section Wrapper */}
      <div className='mt-auto flex flex-col gap-2 pt-2 shrink-0 border-t border-gray-200 dark:border-white/10'>

        {/* Community Images */}
        <div onClick={() => { navigate('/community'); setIsMenuOpen(false) }} className='flex items-center gap-2
              p-2 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer
              hover:bg-gray-50 dark:hover:bg-white/5 transition-all'>
          <img src={assets.gallery_icon} className='w-4 not-dark:invert' alt="" />
          <div className='flex flex-col text-sm'>
            <p>Community Images</p>
          </div>
        </div>

        {/*Credit Purchase Option*/}
        <div onClick={() => { navigate('/credits'); setIsMenuOpen(false) }} className='flex items-center gap-2
              p-2 border border-gray-300 dark:border-white/15 rounded-md cursor-pointer
              hover:bg-gray-50 dark:hover:bg-white/5 transition-all'>
          <img src={assets.diamond_icon} className='w-4 dark:invert' alt="Credits" />
          <div className='flex flex-col text-sm'>
            <p>Credits: <span className='font-semibold'>{user?.credits ?? 0}</span></p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className='flex items-center justify-between gap-2 p-2 border border-gray-300 dark:border-white/15 rounded-md'>
          <div className='flex items-center gap-2 text-sm'>
            <img src={assets.theme_icon} className='w-4 not-dark:invert' alt="" />
            <p>Dark Mode</p>
          </div>
          <label className='relative inline-flex cursor-pointer'>
            <input onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              type="checkbox" className="sr-only peer" checked={theme === 'dark'} />
            <div className='w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-purple-600 transition-colors'>
            </div>
            <span className='absolute left-1 top-[2px] w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm'></span>
          </label>
        </div>

        {/* User Account */}
        <div className='flex items-center gap-2 p-2 mt-1 border border-gray-300
            dark:border-white/15 rounded-md cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5 transition-all'>
          <img src={assets.user_icon} className='w-6 rounded-full' alt="" />
          <p className='flex-1 text-sm font-medium truncate'>{user ? user.name
            : 'Login account'}</p>
          {user && <img onClick={handleLogout} src={assets.logout_icon} className='h-4 cursor-pointer hidden
                    not-dark:invert group-hover:block opacity-70 hover:opacity-100' alt="Logout" />}
        </div>

      </div>

      <img onClick={() => setIsMenuOpen(false)} src={assets.close_icon} className='absolute top-3 right-3 w-4 h-4
        cursor-pointer md:hidden not-dark:invert' alt="" />

    </div>
  )
}

export default Sidebar;
