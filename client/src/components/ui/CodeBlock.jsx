import { useEffect, useRef, useState } from 'react'
import Prism from 'prismjs'
import { CopyIcon, CheckIcon } from './icons'

// Core Prism ships markup/css/clike/javascript only. These cover the
// languages the assistant returns most often.
// ORDER MATTERS: a grammar that extends another must come after it —
// cpp extends c, and importing cpp first throws at module load.
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'

const COPIED_MS = 1500

// Aliases so the label and the grammar both resolve.
const ALIAS = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', py: 'python', sh: 'bash', shell: 'bash',
  'c++': 'cpp', cc: 'cpp', yml: 'yaml',
}

/**
 * Dark, high-contrast code block: language label top-left, Copy top-right.
 *
 * The surface is a FIXED dark colour in both light and dark themes — a code
 * block that flipped to cream would break the syntax palette, which is a
 * VS Code Dark+ theme (assets/prism.css).
 */
const CodeBlock = ({ language, code = '' }) => {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef(null)
  const timer = useRef(null)

  const lang = ALIAS[String(language || '').toLowerCase()] || String(language || '').toLowerCase()
  const grammar = lang && Prism.languages[lang] ? lang : null

  useEffect(() => {
    if (codeRef.current && grammar) Prism.highlightElement(codeRef.current)
  }, [code, grammar])

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Clipboard can be blocked (insecure origin / permission). Fall back to
      // a hidden textarea so the button still does what it says.
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* give up quietly */ }
      document.body.removeChild(ta)
    }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPIED_MS)
  }

  return (
    <div className="lum-code my-3 rounded-[14px] overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-[0_6px_18px_rgba(0,0,0,.28)]">
      {/* Header: language label left, Copy right */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#252526] border-b border-white/10">
        <span className="font-mono text-[11px] tracking-[.1em] uppercase text-[#9d9d9d] select-none">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
          className="ml-auto flex items-center gap-1.5 min-h-8 px-3 rounded-md border border-white/20
            bg-white/5 text-[#e6e6e6] cursor-pointer text-xs font-medium
            hover:bg-white/12 hover:border-white/30 active:scale-95
            transition-[background,border-color,transform] duration-150"
        >
          {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Body — scrolls horizontally rather than stretching the bubble */}
      <pre className="lum-scroll m-0 px-4 py-4 overflow-x-auto text-[13px] leading-[1.7] text-[#d4d4d4] bg-transparent">
        <code ref={codeRef} className={grammar ? `language-${grammar}` : undefined}>
          {code}
        </code>
      </pre>

      {/* Announce the copy for screen readers without moving focus */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Code copied to clipboard' : ''}
      </span>
    </div>
  )
}

export default CodeBlock
