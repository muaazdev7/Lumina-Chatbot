import React, { Suspense, lazy, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
// 3.10 - Message owns react-markdown and prismjs, the two heaviest deps.
// Loading it on demand keeps them out of the initial bundle. One Suspense
// boundary wraps the whole list rather than one per row.
const Message = lazy(() => import('./Message'))
import { sendImageMessage, sendTextMessage } from '../services/messageService'
import { getErrorMessage } from '../services/api'

const Chatbox = () => {
  const containerRef = useRef(null)

  const {
    selectedChat, setSelectedChat, setChats, setCredits,
    user, theme, createNewChat
  } = useAppContext()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState('text')
  const [isPublished, setIsPublished] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return

    if (!user) {
      return toast.error('Please log in to send a message')
    }

    const requiredCredits = mode === 'image' ? 2 : 1
    if ((user.credits ?? 0) < requiredCredits) {
      return toast.error(`You need at least ${requiredCredits} credit${requiredCredits > 1 ? 's' : ''} for this. Buy more from the Credits page.`)
    }

    // Make sure we have a chat to write into.
    let chat = selectedChat
    if (!chat) {
      chat = await createNewChat()
      if (!chat) return
    }

    const userMessage = {
      role: 'user',
      content: trimmedPrompt,
      timestamp: Date.now(),
      isImage: false,
    }

    // Optimistically render the user message.
    setMessages(prev => [...prev, userMessage])
    setPrompt('')
    setLoading(true)

    try {
      const payload = { chatId: chat._id, prompt: trimmedPrompt }
      const data = mode === 'image'
        ? await sendImageMessage({ ...payload, isPublished })
        : await sendTextMessage(payload)

      if (!data.success) {
        toast.error(data.message || 'Failed to get a reply')
        // Roll back the optimistic message.
        setMessages(prev => prev.filter(m => m !== userMessage))
        setPrompt(trimmedPrompt)
        return
      }

      setMessages(prev => [...prev, data.reply])

      // Keep the credit counter and the sidebar preview in sync.
      if (typeof data.credits === 'number') setCredits(data.credits)

      const updatedMessages = [...(chat.messages || []), userMessage, data.reply]
      const updatedChat = { ...chat, messages: updatedMessages, updatedAt: new Date().toISOString() }
      setSelectedChat(updatedChat)
      setChats(prev => prev.map(c => (c._id === chat._id ? updatedChat : c)))
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to get a reply'))
      setMessages(prev => prev.filter(m => m !== userMessage))
      setPrompt(trimmedPrompt)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages)
    } else {
      setMessages([])
    }
  }, [selectedChat?._id])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages])

  return (
    <div className='flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30
      max-md:mt-14 2xl:pr-40'>

      {/* Chat Messages */}
      <div ref={containerRef} className='flex-1 mb-5 overflow-y-scroll scrollbar-hide'>
        {messages.length === 0 && (
          <div className='h-full flex flex-col items-center justify-center gap-2
              text-primary'>
            <img src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              alt="" className='w-full max-w-56 sm:max-w-68 drop-shadow-md' />
            <p className='mt-5 text-4xl sm:text-6xl text-center text-gray-400
              dark:text-white/80 font-semibold tracking-tight'>Ask me anything.</p>
          </div>
        )}
        <Suspense fallback={null}>
          {messages.map((message, index) => <Message key={message._id || `${message.timestamp}-${message.role}-${index}`} message={message} />)}
        </Suspense>

        {/* Three dot loading */}
        {loading && (
          <div className='loader flex items-center gap-1.5 mt-4 ml-4'>
            <div className='w-2 h-2 rounded-full bg-gray-500 dark:bg-white/70 animate-bounce'></div>
            <div className='w-2 h-2 rounded-full bg-gray-500 dark:bg-white/70 animate-bounce' style={{ animationDelay: '0.2s' }}></div>
            <div className='w-2 h-2 rounded-full bg-gray-500 dark:bg-white/70 animate-bounce' style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}

      </div>

      {/* Image Publish Checkbox */}
      {mode === 'image' && (
        <label className='inline-flex items-center gap-2 mb-3 text-sm mx-auto'>
          <p className='text-xs'>Publish Generated Image to Community</p>
          <input type="checkbox" className='cursor-pointer' checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)} />
        </label>
      )}

      {/* Prompt Input Box */}
      <form
        onSubmit={onSubmit}
        className='bg-white dark:bg-[#342D40]/80 border border-gray-200 dark:border-[#80609F]/40 rounded-full w-full max-w-3xl py-3 px-5 sm:px-6 mx-auto flex gap-4 items-center shadow-lg focus-within:ring-2 focus-within:ring-purple-500/40 transition-all duration-300 backdrop-blur-sm'
      >
        {/* Dropdown with right border as a divider */}
        <div className='border-r border-gray-300 dark:border-white/15 pr-4 flex items-center shrink-0'>
          <select
            onChange={(e) => setMode(e.target.value)}
            value={mode}
            className='text-base bg-transparent outline-none cursor-pointer text-gray-600 dark:text-gray-300 font-medium tracking-wide'
          >
            <option className='bg-white dark:bg-[#342D40] dark:text-white' value="text">Text</option>
            <option className='bg-white dark:bg-[#342D40] dark:text-white' value="image">Image</option>
          </select>
        </div>

        {/* Transparent Input field */}
        <input
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          type="text"
          placeholder={loading ? 'Generating...' : 'Type your prompt here...'}
          disabled={loading}
          className='flex-1 w-full text-base bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none disabled:cursor-not-allowed'
          required
        />

        {/* Submit button with hover effect */}
        <button
          type='submit'
          disabled={loading}
          className='disabled:opacity-40 shrink-0 flex items-center justify-center p-1.5 hover:scale-110 active:scale-95 transition-all duration-200 rounded-full'
        >
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className='w-7 h-7 md:w-8 md:h-8 cursor-pointer object-contain'
            alt="Send"
          />
        </button>
      </form>

    </div>
  )
}

export default Chatbox
