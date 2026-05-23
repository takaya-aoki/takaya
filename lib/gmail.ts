import { google } from 'googleapis'
import { GmailMessage, GmailThread, ThreadSummary } from '@/types'

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth })
}

function decodeBase64(data: string): string {
  const buf = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  return buf.toString('utf-8')
}

function extractHeader(headers: { name?: string | null; value?: string | null }[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function extractBody(payload: any): { text: string; html?: string } {
  if (!payload) return { text: '' }

  // Single part
  if (payload.body?.data) {
    const decoded = decodeBase64(payload.body.data)
    if (payload.mimeType === 'text/html') return { text: '', html: decoded }
    return { text: decoded }
  }

  // Multipart
  const parts = payload.parts ?? []
  let text = ''
  let html = ''

  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBase64(part.body.data)
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html += decodeBase64(part.body.data)
    } else if (part.mimeType?.startsWith('multipart/')) {
      const nested = extractBody(part)
      text += nested.text
      if (nested.html) html += nested.html
    }
  }

  return { text, html: html || undefined }
}

function stripQuotedText(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.startsWith('>'))
    .join('\n')
    .replace(/^--\s*\n[\s\S]*$/m, '') // strip signature
    .trim()
}

export async function listThreads(
  client: ReturnType<typeof getGmailClient>,
  label: string = 'INBOX',
  pageToken?: string
): Promise<{ threads: ThreadSummary[]; nextPageToken?: string }> {
  const labelMap: Record<string, string> = {
    inbox: 'INBOX',
    sent: 'SENT',
    drafts: 'DRAFT',
    starred: 'STARRED',
    trash: 'TRASH',
    spam: 'SPAM',
  }

  const labelId = labelMap[label.toLowerCase()] ?? label.toUpperCase()

  const listRes = await client.users.threads.list({
    userId: 'me',
    labelIds: [labelId],
    maxResults: 20,
    pageToken,
  })

  const threadItems = listRes.data.threads ?? []

  const threads = await Promise.all(
    threadItems.map(async (t) => {
      const res = await client.users.threads.get({
        userId: 'me',
        id: t.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })
      const msg = res.data.messages?.[0]
      const headers = msg?.payload?.headers ?? []
      const lastMsg = res.data.messages?.at(-1)
      const lastHeaders = lastMsg?.payload?.headers ?? []

      return {
        id: t.id!,
        subject: extractHeader(lastHeaders, 'Subject') || extractHeader(headers, 'Subject') || '(No Subject)',
        snippet: res.data.snippet ?? '',
        from: extractHeader(headers, 'From'),
        date: extractHeader(lastHeaders, 'Date') || extractHeader(headers, 'Date'),
        unread: (lastMsg?.labelIds ?? []).includes('UNREAD'),
        labelIds: lastMsg?.labelIds ?? [],
      } satisfies ThreadSummary
    })
  )

  return {
    threads,
    nextPageToken: listRes.data.nextPageToken ?? undefined,
  }
}

export async function getThread(
  client: ReturnType<typeof getGmailClient>,
  threadId: string
): Promise<GmailThread> {
  const res = await client.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  })

  const messages: GmailMessage[] = (res.data.messages ?? []).map((msg) => {
    const headers = msg.payload?.headers ?? []
    const { text, html } = extractBody(msg.payload)
    return {
      id: msg.id!,
      from: extractHeader(headers, 'From'),
      to: extractHeader(headers, 'To'),
      cc: extractHeader(headers, 'Cc') || undefined,
      date: extractHeader(headers, 'Date'),
      subject: extractHeader(headers, 'Subject'),
      bodyText: stripQuotedText(text),
      bodyHtml: html,
      messageId: extractHeader(headers, 'Message-ID') || undefined,
    }
  })

  const firstHeaders = res.data.messages?.[0]?.payload?.headers ?? []
  const subject = extractHeader(firstHeaders, 'Subject') || '(No Subject)'
  const participants = [...new Set(messages.flatMap((m) => [m.from, m.to]).filter(Boolean))]

  return { id: threadId, subject, participants, messages }
}

export async function sendReply(
  client: ReturnType<typeof getGmailClient>,
  params: {
    to: string
    subject: string
    body: string
    threadId: string
    inReplyTo?: string
    references?: string
  }
): Promise<void> {
  const subject = params.subject.startsWith('Re:') ? params.subject : `Re: ${params.subject}`

  const headers = [
    `To: ${params.to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=UTF-8`,
    params.inReplyTo ? `In-Reply-To: ${params.inReplyTo}` : '',
    params.references ? `References: ${params.references}` : '',
  ]
    .filter(Boolean)
    .join('\r\n')

  const raw = `${headers}\r\n\r\n${params.body}`
  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await client.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId: params.threadId },
  })
  void encoded // used via requestBody.raw above
}

export async function markAsRead(
  client: ReturnType<typeof getGmailClient>,
  messageId: string
): Promise<void> {
  await client.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  })
}
