export type GmailMessage = {
  id: string
  from: string
  to: string
  cc?: string
  date: string
  subject: string
  bodyText: string
  bodyHtml?: string
  messageId?: string // RFC 2822 Message-ID header
}

export type GmailThread = {
  id: string
  subject: string
  participants: string[]
  messages: GmailMessage[]
  historyId?: string
}

export type ThreadSummary = {
  id: string
  subject: string
  snippet: string
  from: string
  date: string
  unread: boolean
  labelIds: string[]
}

export type ContactPattern = {
  email: string
  name?: string
  tone: string
  responseLength: 'short' | 'medium' | 'long'
  topics: string[]
  keyPhrases: string[]
  relationshipNotes: string
  lastUpdated: string
}

export type DraftResponse = {
  draft: string
}

export type SendRequest = {
  threadId: string
  to: string
  subject: string
  body: string
  inReplyTo?: string
  references?: string
}
