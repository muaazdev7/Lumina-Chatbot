import { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import Markdown from 'react-markdown'
import Prism from 'prismjs'
import SafeImage from './ui/SafeImage'
import { CopyIcon, CheckIcon } from './ui/icons'

/** The dark code block from the design, with a working copy button. */
const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — leave the label unchanged */
    }
  }

  return (
    <div className="rounded-[18px] overflow-hidden bg-code shadow-[0_6px_18px_rgba(0,0,0,.22)] my-3">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[rgba(249,244,237,.12)]">
        <span className="text-[11px] tracking-[.08em] uppercase text-[#c0b6a5]">{language || 'code'}</span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto flex items-center gap-1.5 min-h-[30px] px-3 rounded-full border border-[rgba(249,244,237,.18)]
            bg-transparent text-[#f6efe4] cursor-pointer text-xs hover:bg-[rgba(249,244,237,.10)]"
        >
          {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="m-0 px-[18px] py-4 overflow-x-auto text-[13px] leading-[1.7] text-[#e1eecc]">
        <code>{children}</code>
      </pre>
    </div>
  )
}

const Message = ({ message }) => {
  const bodyRef = useRef(null)
  const isUser = message.role === 'user'

  // Scoped to this message — highlightAll() re-scanned the whole document.
  useEffect(() => {
    if (message.isImage || !bodyRef.current) return
    Prism.highlightAllUnder(bodyRef.current)
  }, [message.content, message.isImage])

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[560px] px-5 py-4 rounded-[24px_24px_8px_24px] bg-surface shadow-[var(--shadow)]">
          <p className="m-0 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          <p className="mt-2 mb-0 text-[11px] text-muted text-right">{moment(message.timestamp).fromNow()}</p>
        </div>
        <div className="w-[34px] h-[34px] flex-none grid place-items-center rounded-full bg-sage-soft text-sage-ink font-heading text-sm">
          {(message.authorInitial || 'M').toUpperCase()}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div
        className="w-[34px] h-[34px] flex-none rounded-full"
        style={{ background: 'radial-gradient(circle at 32% 30%, #f6a06b, var(--accent) 60%, var(--accent-2) 140%)' }}
        aria-hidden="true"
      />
      <div className={`min-w-0 ${message.isImage ? 'max-w-[520px] p-3.5' : 'flex-1 max-w-[640px] px-[22px] py-[18px]'}
        rounded-[24px_24px_24px_8px] bg-panel shadow-[var(--shadow)]`}>
        {message.isImage ? (
          <>
            <SafeImage
              src={message.content}
              alt={message.prompt || 'Generated image'}
              height={300}
              className="washed w-full object-cover rounded-[18px]"
              containerClassName="rounded-[18px]"
            />
            <div className="flex items-center gap-2 mt-3">
              {message.isPublished && <span className="tag-sage">Published to community</span>}
              <span className="ml-auto text-[11px] text-muted">
                {moment(message.timestamp).fromNow()} · 2 credits
              </span>
            </div>
          </>
        ) : (
          <>
            <div ref={bodyRef} className="reset-tw text-[15px] leading-[1.65]">
              <Markdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const language = /language-(\w+)/.exec(className || '')?.[1]
                    if (inline) {
                      return <code className={className} {...props}>{children}</code>
                    }
                    return <CodeBlock language={language}>{String(children).replace(/\n$/, '')}</CodeBlock>
                  },
                }}
              >
                {message.content}
              </Markdown>
            </div>
            <p className="mt-3 mb-0 text-[11px] text-muted">{moment(message.timestamp).fromNow()}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default Message
