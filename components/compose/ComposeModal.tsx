'use client'

import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'

type Props = {
  onClose: () => void
}

export function ComposeModal({ onClose }: Props) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!to.trim() || !body.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: '', to, subject, body }),
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
      setTimeout(onClose, 1200)
    } catch {
      setError('送信に失敗しました。')
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg bg-white rounded-t-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white">
          <span className="font-medium text-sm">新規メール</span>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-lg leading-none">×</button>
        </div>

        <div className="border-b border-gray-200 px-4 py-2">
          <input
            type="email"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full text-sm outline-none text-gray-800 placeholder-gray-400"
          />
        </div>
        <div className="border-b border-gray-200 px-4 py-2">
          <input
            type="text"
            placeholder="件名"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-sm outline-none text-gray-800 placeholder-gray-400"
          />
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 text-sm outline-none resize-none text-gray-800 placeholder-gray-400"
          placeholder="本文を入力してください..."
        />

        {error && (
          <p className="px-4 pb-2 text-xs text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            破棄
          </button>
          <button
            onClick={handleSend}
            disabled={!to.trim() || !body.trim() || sending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {sent ? '送信済み ✓' : sending ? <><Spinner size="sm" />送信中...</> : '送信'}
          </button>
        </div>
      </div>
    </div>
  )
}
