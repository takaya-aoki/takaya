import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient, getThread } from '@/lib/gmail'
import { generateDraft } from '@/lib/claude'
import { readContactProfile, readCommunicationStyle } from '@/lib/obsidian'

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { threadId } = await params
  try {
    const client = getGmailClient(session.accessToken)
    const thread = await getThread(client, threadId)
    const lastMessage = thread.messages.at(-1)!

    const [contactProfile, styleGuide] = await Promise.all([
      readContactProfile(lastMessage.from),
      readCommunicationStyle(),
    ])

    const draft = await generateDraft({ thread, contactProfile, styleGuide })
    return NextResponse.json({ draft })
  } catch (err) {
    console.error('generateDraft error:', err)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
