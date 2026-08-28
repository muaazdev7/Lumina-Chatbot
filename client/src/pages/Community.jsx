import React, { useEffect, useState } from 'react'
import Loading from './Loading'
import { getPublishedImages } from '../services/authService'
import { getErrorMessage } from '../services/api'

const Community = () => {

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchImages = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getPublishedImages()
            if (data.success) {
                setImages(data.images)
            } else {
                setError(data.message || 'Failed to load community images')
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load community images'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchImages()
    }, [])

    if (loading) return <Loading />

    return (
        <div className='p-6 pt-12 xl:px-12 2xl:px-20 w-full mx-auto h-full
overflow-y-scroll'>
            <h2 className='text-xl font-semibold mb-6 text-gray-800
    dark:text-purple-100'>Community Images</h2>

            {error && (
                <div className='text-center mt-10'>
                    <p className='text-red-600 dark:text-red-400 mb-3'>{error}</p>
                    <button onClick={fetchImages} className='px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm cursor-pointer'>
                        Try again
                    </button>
                </div>
            )}

            {!error && images.length > 0 ? (
                <div className='flex flex-wrap max-sm:justify-center gap-5'>
                    {images.map((item, index) => (
                        <a key={index} href={item.imageUrl} target='_blank' rel='noreferrer' className='relative
group block rounded-lg overflow-hidden border border-gray-200
dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow
duration-300'>
                            <img src={item.imageUrl} alt="" className='w-full h-40 md:h-50
    2xl:h-62 object-cover group-hover:scale-105 transition-transform
    duration-300 ease-in-out' />
                            <p className='absolute bottom-0 right-0 text-xs bg-black/50
    backdrop-blur text-white px-4 py-1 rounded-tl-xl opacity-0
    group-hover:opacity-100 transition duration-300'>Created by {item.
                                    userName}</p>
                        </a>
                    ))}
                </div>
            ) : (
                !error && <p className='text-center text-gray-600 dark:text-purple-200 mt-10'>No
                    images Available.</p>
            )}
        </div>
    )
}

export default Community
