'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ComposeModal } from '@/components/compose/ComposeModal'

const LABELS = [
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'starred', label: 'Starred', icon: '⭐' },
  { id: 'sent', label: 'Sent', icon: '📤' },
  { id: 'drafts', label: 'Drafts', icon: '📝' },
  { id: 'trash', label: 'Trash', icon: '🗑️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <>
      <aside className="w-64 flex-shrink-0 flex flex-col gap-1 pr-2">
        <button
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-3 px-6 py-4 mb-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700 shadow-sm"
        >
          <span className="text-lg">✏️</span>
          Compose
        </button>

        {LABELS.map(({ id, label, icon }) => {
          const href = `/mail/${id}`
          const active = pathname.startsWith(href)
          return (
            <Link
              key={id}
              href={href}
              className={`flex items-center gap-4 px-4 py-2 rounded-r-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-100 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </aside>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
    </>
  )
}
