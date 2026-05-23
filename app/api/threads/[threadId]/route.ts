import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient, getThread, markAsRead } from '@/lib/gmail'

export async function GET(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { threadId } = await params
  try {
    const client = getGmailClient(session.accessToken)
    const thread = await getThread(client, threadId)

    // Mark last message as read
    const lastMsg = thread.messages.at(-1)
    if (lastMsg) {
      markAsRead(client, lastMsg.id).catch(() => {})
    }

    return NextResponse.json(thread)
  } catch (err) {
    console.error('getThread error:', err)
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
  }
}
