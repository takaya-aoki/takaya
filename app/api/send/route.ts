import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient, getThread, sendReply } from '@/lib/gmail'
import { analyzeExchange } from '@/lib/claude'
import { upsertContactProfile, saveThreadSummary, updateCommunicationStyle } from '@/lib/obsidian'
import { SendRequest } from '@/types'

async function runPostSendAnalysis(
  accessToken: string,
  threadId: string,
  sentBody: string,
  to: string
) {
  try {
    const client = getGmailClient(accessToken)
    const thread = await getThread(client, threadId)
    const senderEmail = to.match(/<(.+)>/)?.[1] ?? to

    const analysis = await analyzeExchange({ thread, sentReply: sentBody, senderEmail })
    if (!analysis) return

    await Promise.all([
      upsertContactProfile(
        senderEmail,
        {
          tone: analysis.tone,
          responseLength: analysis.responseLength,
          topics: analysis.topics,
          keyPhrases: analysis.keyPhrases,
          relationshipNotes: analysis.relationshipNotes,
        },
        analysis.contactNarrativeSummary
      ),
      saveThreadSummary(
        threadId,
        `# Thread: ${thread.subject}\n\n**Date:** ${new Date().toISOString().split('T')[0]}\n**Participants:** ${thread.participants.join(', ')}\n\n## Summary\n\n${analysis.contactNarrativeSummary}`
      ),
      updateCommunicationStyle(analysis.styleObservations),
    ])
  } catch (err) {
    console.error('Post-send analysis failed:', err)
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: SendRequest = await req.json()
  const { threadId, to, subject, body: emailBody, inReplyTo, references } = body

  try {
    const client = getGmailClient(session.accessToken)
    await sendReply(client, { to, subject, body: emailBody, threadId, inReplyTo, references })

    // Fire-and-forget: analyze the exchange and save to Obsidian
    runPostSendAnalysis(session.accessToken, threadId, emailBody, to).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
