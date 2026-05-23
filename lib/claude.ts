import Anthropic from '@anthropic-ai/sdk'
import { GmailThread } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function threadToText(thread: GmailThread): string {
  return thread.messages
    .map(
      (m, i) =>
        `--- Message ${i + 1} ---\nFrom: ${m.from}\nTo: ${m.to}\nDate: ${m.date}\n\n${m.bodyText}`
    )
    .join('\n\n')
}

export async function generateDraft(params: {
  thread: GmailThread
  contactProfile: string | null
  styleGuide: string | null
}): Promise<string> {
  const { thread, contactProfile, styleGuide } = params
  const lastMessage = thread.messages.at(-1)!

  const systemContent = [
    {
      type: 'text' as const,
      text: `You are a personal email assistant for the user. Your job is to draft a reply that sounds exactly like the user — matching their natural tone, vocabulary, and style.

Rules:
- Write ONLY the reply body. No subject line, no "Here is a draft:", no preamble.
- Match the user's writing style from the style guide.
- Be appropriately concise or detailed based on the email context.
- Do not use formal closings unless the user typically does.
- Write in Japanese if the incoming email is in Japanese, otherwise match the email's language.
${styleGuide ? `\n## User's Communication Style\n${styleGuide}` : ''}`,
      cache_control: { type: 'ephemeral' as const },
    },
    ...(contactProfile
      ? [
          {
            type: 'text' as const,
            text: `## Contact Profile for ${lastMessage.from}\n${contactProfile}`,
            cache_control: { type: 'ephemeral' as const },
          },
        ]
      : []),
  ]

  const threadText = threadToText(thread)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemContent,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Here is the email thread:\n\n${threadText}\n\nPlease draft a reply to the latest message.`,
            cache_control: { type: 'ephemeral' as const },
          },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock && 'text' in textBlock ? textBlock.text : ''
}

type ExchangeAnalysis = {
  tone: string
  responseLength: 'short' | 'medium' | 'long'
  topics: string[]
  keyPhrases: string[]
  relationshipNotes: string
  contactNarrativeSummary: string
  styleObservations: string
}

export async function analyzeExchange(params: {
  thread: GmailThread
  sentReply: string
  senderEmail: string
}): Promise<ExchangeAnalysis | null> {
  const { thread, sentReply, senderEmail } = params
  const threadText = threadToText(thread)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools: [
        {
          name: 'save_exchange_analysis',
          description: 'Save the analyzed communication patterns from this email exchange',
          input_schema: {
            type: 'object' as const,
            properties: {
              tone: { type: 'string', description: 'Communication tone (e.g., professional-warm, casual, formal)' },
              responseLength: { type: 'string', enum: ['short', 'medium', 'long'] },
              topics: { type: 'array', items: { type: 'string' }, description: 'Main topics discussed' },
              keyPhrases: { type: 'array', items: { type: 'string' }, description: 'Characteristic phrases used' },
              relationshipNotes: { type: 'string', description: 'Notes about the relationship dynamic' },
              contactNarrativeSummary: { type: 'string', description: 'Narrative summary for the contact profile Obsidian note' },
              styleObservations: { type: 'string', description: 'Observations about the user\'s writing style from the sent reply' },
            },
            required: ['tone', 'responseLength', 'topics', 'keyPhrases', 'relationshipNotes', 'contactNarrativeSummary', 'styleObservations'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'save_exchange_analysis' },
      messages: [
        {
          role: 'user',
          content: `Analyze this email exchange and extract communication patterns.

Thread with ${senderEmail}:
${threadText}

User's sent reply:
${sentReply}

Extract: tone, response length pattern, topics, key phrases the user uses, relationship notes, a narrative summary for the contact's Obsidian profile, and observations about the user's writing style.`,
        },
      ],
    })

    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (toolUse && 'input' in toolUse) {
      return toolUse.input as ExchangeAnalysis
    }
  } catch (err) {
    console.error('Exchange analysis failed:', err)
  }
  return null
}
