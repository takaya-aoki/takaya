'use client'

import { useState, useCallback } from 'react'
import { ThreadRow } from './ThreadRow'
import { Spinner } from '@/components/ui/Spinner'
import { ThreadSummary } from '@/types'

type Props = {
  initialThreads: ThreadSummary[]
  initialNextPageToken?: string
  label: string
}

export function ThreadList({ initialThreads, initialNextPageToken, label }: Props) {
  const [threads, setThreads] = useState(initialThreads)
  const [nextPageToken, setNextPageToken] = useState(initialNextPageToken)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (!nextPageToken || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/threads?label=${label}&pageToken=${nextPageToken}`)
      const data = await res.json()
      setThreads((prev) => [...prev, ...data.threads])
      setNextPageToken(data.nextPageToken)
    } finally {
      setLoading(false)
    }
  }, [nextPageToken, loading, label])

  return (
    <div className="flex flex-col h-full overflow-auto">
      {threads.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          メールはありません
        </div>
      )}
      {threads.map((t) => (
        <ThreadRow key={t.id} thread={t} label={label} />
      ))}
      {nextPageToken && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="flex items-center justify-center gap-2 py-4 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {loading ? <Spinner size="sm" /> : '次のメールを読み込む'}
        </button>
      )}
    </div>
  )
}
