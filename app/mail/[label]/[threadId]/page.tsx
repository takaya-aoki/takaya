import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient, getThread } from '@/lib/gmail'
import { ThreadView } from '@/components/thread-view/ThreadView'
import { redirect, notFound } from 'next/navigation'

type Props = {
  params: Promise<{ label: string; threadId: string }>
}

export default async function ThreadPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) redirect('/auth/signin')

  const { label, threadId } = await params

  try {
    const client = getGmailClient(session.accessToken)
    const thread = await getThread(client, threadId)
    return (
      <div className="h-full overflow-auto">
        <ThreadView thread={thread} label={label} />
      </div>
    )
  } catch {
    notFound()
  }
}
