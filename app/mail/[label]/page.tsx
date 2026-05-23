import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient, listThreads } from '@/lib/gmail'
import { ThreadList } from '@/components/thread-list/ThreadList'
import { redirect } from 'next/navigation'

const LABEL_NAMES: Record<string, string> = {
  inbox: '受信トレイ',
  sent: '送信済み',
  drafts: '下書き',
  starred: 'スター付き',
  trash: 'ゴミ箱',
  spam: 'スパム',
}

type Props = {
  params: Promise<{ label: string }>
  searchParams: Promise<{ pageToken?: string }>
}

export default async function LabelPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect('/auth/signin')

  const { label } = await params
  const { pageToken } = await searchParams

  let initialThreads: import('@/types').ThreadSummary[] = []
  let initialNextPageToken: string | undefined

  try {
    const client = getGmailClient(session.accessToken)
    const result = await listThreads(client, label, pageToken)
    initialThreads = result.threads
    initialNextPageToken = result.nextPageToken
  } catch (err) {
    console.error('Failed to fetch threads:', err)
  }

  const labelName = LABEL_NAMES[label.toLowerCase()] ?? label

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{labelName}</h2>
        <span className="ml-3 text-sm text-gray-500">{initialThreads.length}件</span>
      </div>
      <div className="flex-1 overflow-auto">
        <ThreadList
          initialThreads={initialThreads}
          initialNextPageToken={initialNextPageToken}
          label={label}
        />
      </div>
    </div>
  )
}
