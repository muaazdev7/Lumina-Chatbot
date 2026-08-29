import { useEffect, useState } from 'react'
import { getPublishedImages } from '../services/authService'
import { getErrorMessage } from '../services/api'
import SafeImage from '../components/ui/SafeImage'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { GalleryIcon } from '../components/ui/icons'

const PAGE_SIZE = 20

const Community = () => {
  const [images, setImages] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const fetchImages = async (requestedPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    setError(null)
    try {
      const data = await getPublishedImages({ page: requestedPage, limit: PAGE_SIZE })
      if (data.success) {
        setImages(prev => (append ? [...prev, ...data.images] : data.images))
        setHasMore(Boolean(data.hasMore))
        setTotal(data.total ?? 0)
        setPage(data.page ?? requestedPage)
      } else {
        setError(data.message || 'Failed to load community images')
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load community images'))
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }

  useEffect(() => { fetchImages(1, false) }, [])

  return (
    <div className="lum-scroll flex-1 min-w-0 h-screen overflow-y-auto bg-bg relative">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-44 -left-16 w-[380px] h-[380px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(122,138,94,.15), transparent 68%)' }} />

      <div className="relative z-2 max-w-[1080px] mx-auto px-6 md:px-[60px] pt-14 pb-20 max-md:pt-20">
        <div className="flex items-end gap-5 flex-wrap">
          <div>
            <span className="tag-sage">Community</span>
            <h2 className="mt-4 mb-2 text-[32px] sm:text-[44px] tracking-tight">Made with Lumina.</h2>
            <p className="m-0 text-[15px] text-muted max-w-[48ch]">
              Every image here was published on purpose by the person who generated it.
            </p>
          </div>
          {total > 0 && (
            <span className="ml-auto text-[13px] text-faint">
              Showing {images.length} of {total}
            </span>
          )}
        </div>

        {error && <ErrorState message={error} onRetry={() => fetchImages(1, false)} />}

        {loading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mt-9">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} delay={i * 0.08} className="h-[262px] rounded-[24px]" />
            ))}
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <EmptyState
            className="mt-16"
            icon={<GalleryIcon size={20} />}
            title="No images yet"
            message="Generate one in Image mode and tick “publish” to see it here."
          />
        )}

        {!loading && !error && images.length > 0 && (
          <>
            <ul className="list-none m-0 p-0 grid grid-cols-2 lg:grid-cols-4 gap-[18px] mt-9">
              {images.map((item, index) => (
                <li key={`${item.imageUrl}-${index}`}>
                  <a
                    href={item.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="lum-tile block rounded-[24px] overflow-hidden bg-panel shadow-[var(--shadow)] no-underline text-inherit"
                  >
                    <div className="overflow-hidden">
                      <SafeImage
                        src={item.imageUrl}
                        alt={`Image created by ${item.userName}`}
                        height={210}
                        className="washed w-full object-cover"
                      />
                    </div>
                    {/* Always visible — the old build revealed this on hover only,
                        so it never appeared on touch devices. */}
                    <p className="m-0 px-3.5 py-3 text-xs text-muted">
                      Created by <strong className="text-text">{item.userName}</strong>
                    </p>
                  </a>
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  type="button"
                  onClick={() => fetchImages(page + 1, true)}
                  disabled={loadingMore}
                  className="min-h-12 px-[30px] rounded-full border border-line bg-panel text-text cursor-pointer
                    font-heading text-[15px] hover:border-accent hover:text-acc-ink
                    disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Community
