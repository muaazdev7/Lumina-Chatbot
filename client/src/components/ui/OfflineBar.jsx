import { useEffect, useState } from 'react'
import { OfflineIcon } from './icons'

/**
 * One persistent bar rather than a toast per failed request (design §States).
 */
const OfflineBar = () => {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-60 flex items-center justify-center gap-2.5
        py-2.5 px-4 bg-[#8c491a] text-[#fff2eb] text-[13px]"
    >
      <OfflineIcon size={16} />
      You are offline — messages will send once the connection returns.
    </div>
  )
}

export default OfflineBar
