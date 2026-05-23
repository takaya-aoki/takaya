'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { ThreadSummary } from '@/types'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  const isThisYear = d.getFullYear() === now.getFullYear()
  return isThisYear
    ? d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    : d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

function senderName(from: string): string {
  const match = from.match(/^"?(.+?)"?\s*</)
  return match?.[1] ?? from.split('@')[0] ?? from
}

export function ThreadRow({ thread, label }: { thread: ThreadSummary; label: string }) {
  const params = useParams()
  const isActive = params.threadId === thread.id

  return (
    <Link
      href={`/mail/${label}/${thread.id}`}
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50' : thread.unread ? 'bg-white' : 'bg-white'
      }`}
    >
      <Avatar name={senderName(thread.from)} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${thread.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {senderName(thread.from)}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(thread.date)}</span>
        </div>
        <p className={`text-sm truncate ${thread.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
          {thread.subject}
        </p>
        <p className="text-xs text-gray-400 truncate">{thread.snippet}</p>
      </div>
      {thread.unread && (
        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
      )}
    </Link>
  )
}
