'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { GmailMessage } from '@/types'

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function senderName(from: string): string {
  const match = from.match(/^"?(.+?)"?\s*</)
  return match?.[1] ?? from
}

export function MessageBubble({ message, defaultExpanded = false }: { message: GmailMessage; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-left"
      >
        <Avatar name={senderName(message.from)} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-900 text-sm">{senderName(message.from)}</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{formatFullDate(message.date)}</span>
          </div>
          {!expanded && (
            <p className="text-xs text-gray-400 truncate">{message.bodyText.slice(0, 100)}</p>
          )}
          {expanded && (
            <p className="text-xs text-gray-500">
              To: {message.to}
              {message.cc ? ` • CC: ${message.cc}` : ''}
            </p>
          )}
        </div>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {message.bodyHtml ? (
            <div
              className="mt-4 text-sm text-gray-800 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
            />
          ) : (
            <pre className="mt-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
              {message.bodyText}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
