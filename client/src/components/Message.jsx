import moment from 'moment'
import Markdown from 'react-markdown'
import SafeImage from './ui/SafeImage'
import CodeBlock from './ui/CodeBlock'

/**
 * react-markdown v9 removed the `inline` prop, so a fenced block is detected
 * by overriding `pre` (fenced code is always <pre><code>). Overriding `code`
 * alone would turn every inline `snippet` into a full-width dark block.
 */
const markdownComponents = {
  pre({ children }) {
    const codeEl = Array.isArray(children) ? children[0] : children
    const className = codeEl?.props?.className || ''
    const language = /language-([\w+-]+)/.exec(className)?.[1]
    const raw = String(codeEl?.props?.children ?? '').replace(/\n$/, '')
    return <CodeBlock language={language} code={raw} />
  },
  code({ children, className, ...props }) {
    // `node` is react-markdown's AST handle - it must never reach the DOM.
    delete props.node
    // Only inline code reaches here now; block code is handled by `pre`.
    if (/language-/.test(className || '')) {
      return <code className={className} {...props}>{children}</code>
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-sunk text-acc-ink text-[0.9em] font-mono"
        {...props}
      >
        {children}
      </code>
    )
  },
}

const Message = ({ message }) => {
  const isUser = message.role === 'user'

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
            <div className="reset-tw text-[15px] leading-[1.65]">
              <Markdown components={markdownComponents}>{message.content}</Markdown>
            </div>
            <p className="mt-3 mb-0 text-[11px] text-muted">{moment(message.timestamp).fromNow()}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default Message
