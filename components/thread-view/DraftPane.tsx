'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'
import { GmailThread } from '@/types'

type Props = {
  thread: GmailThread
  label: string
}

export function DraftPane({ thread, label }: Props) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [generating, setGenerating] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastMessage = thread.messages.at(-1)!
  const to = lastMessage.from
  const subject = lastMessage.subject

  const generateDraft = useCallback(async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/threads/${thread.id}/draft`, { method: 'POST' })
      if (!res.ok) throw new Error('Draft generation failed')
      const data = await res.json()
      setDraft(data.draft ?? '')
    } catch {
      setError('下書きの生成に失敗しました。もう一度お試しください。')
    } finally {
      setGenerating(false)
    }
  }, [thread.id])

  useEffect(() => {
    generateDraft()
  }, [generateDraft])

  const handleSend = async () => {
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      const lastMsgId = lastMessage.messageId
      const references = thread.messages.map((m) => m.messageId).filter(Boolean).join(' ')

      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: thread.id,
          to,
          subject,
          body: draft,
          inReplyTo: lastMsgId,
          references,
        }),
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
      setTimeout(() => router.push(`/mail/${label}`), 1500)
    } catch {
      setError('送信に失敗しました。')
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-6 flex items-center gap-3 text-green-700">
        <span className="text-2xl">✅</span>
        <span className="font-medium">送信しました！</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Claude が下書きを準備中</span>
          {generating && <Spinner size="sm" />}
          {!generating && !error && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✨ 完成</span>
          )}
        </div>
        <button
          onClick={generateDraft}
          disabled={generating}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
        >
          再生成
        </button>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="font-medium">To:</span> {to}
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">件名:</span> {subject.startsWith('Re:') ? subject : `Re: ${subject}`}
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={generating}
          rows={10}
          className="w-full text-sm text-gray-800 border-0 resize-none focus:outline-none placeholder-gray-400 leading-relaxed disabled:opacity-50"
          placeholder={generating ? 'Claude が下書きを生成しています...' : 'ここに返信を入力してください'}
        />
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400">
          送信後、Claude がやりとりを学習して次の下書きをさらに改善します
        </p>
        <button
          onClick={handleSend}
          disabled={generating || sending || !draft.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <>
              <Spinner size="sm" />
              送信中...
            </>
          ) : (
            <>
              <span>送信</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
