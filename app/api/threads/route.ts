import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient, listThreads } from '@/lib/gmail'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const label = searchParams.get('label') ?? 'inbox'
  const pageToken = searchParams.get('pageToken') ?? undefined

  try {
    const client = getGmailClient(session.accessToken)
    const result = await listThreads(client, label, pageToken)
    return NextResponse.json(result)
  } catch (err) {
    console.error('listThreads error:', err)
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }
}
