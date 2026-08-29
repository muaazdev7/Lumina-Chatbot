import React, { useEffect, useRef } from 'react'
import { assets } from '../assets/assets'
import moment from 'moment'
import Markdown from 'react-markdown'
import Prism from 'prismjs'

const Message = ({ message }) => {

  // 3.9 - highlight only inside this message. Prism.highlightAll() re-scanned
  // the entire document on every content change, so a chat with N messages did
  // N full-document scans.
  const markdownRef = useRef(null)

  useEffect(() => {
    if (message.isImage) return          // image replies contain no code
    if (markdownRef.current) {
      Prism.highlightAllUnder(markdownRef.current)
    }
  }, [message.content, message.isImage])

  return (
    <div>
      {message.role === "user" ? (
        <div className='flex items-start justify-end my-4 gap-2'>
          <div className='flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl'>
            <p className='text-sm dark:text-primary'>{message.content}</p>
            <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
          </div>
          <img src={assets.user_icon} alt="" className='w-8 rounded-full' />
        </div>
      ) : (
        <div className='inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4'>
          {message.isImage ? (
            <img src={message.content} alt="" className='w-full max-w-md mt-2 rounded-md' />
          ) : (
            <div ref={markdownRef} className='text-sm dark:text-primary reset-tw'>
              <Markdown>{message.content}</Markdown>
            </div>
          )}
          <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
        </div>
      )}
    </div>
  )
}

export default Message
