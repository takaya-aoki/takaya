'use client'

import { GmailThread } from '@/types'
import { MessageBubble } from './MessageBubble'
import { DraftPane } from './DraftPane'

type Props = {
  thread: GmailThread
  label: string
}

export function ThreadView({ thread, label }: Props) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold text-gray-900">{thread.subject}</h1>

      <div className="flex flex-col gap-3">
        {thread.messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            defaultExpanded={i === thread.messages.length - 1}
          />
        ))}
      </div>

      <DraftPane thread={thread} label={label} />
    </div>
  )
}
