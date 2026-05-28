import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { GmailThread } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

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
  const threadText = threadToText(thread)

  const systemInstruction = [
    'You are a personal email assistant. Your job is to draft a reply that sounds exactly like the user — matching their natural tone, vocabulary, and style.',
    '',
    'Rules:',
    '- Write ONLY the reply body. No subject line, no "Here is a draft:", no preamble.',
    '- Match the user\'s writing style from the style guide.',
    '- Be appropriately concise or detailed based on the email context.',
    '- Write in Japanese if the incoming email is in Japanese, otherwise match the email\'s language.',
    ...(styleGuide ? ['', '## User\'s Communication Style', styleGuide] : []),
    ...(contactProfile ? ['', `## Contact Profile for ${lastMessage.from}`, contactProfile] : []),
  ].join('\n')

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction,
  })

  const result = await model.generateContent(
    `Here is the email thread:\n\n${threadText}\n\nPlease draft a reply to the latest message.`
  )

  return result.response.text()
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            tone: { type: SchemaType.STRING },
            responseLength: { type: SchemaType.STRING },
            topics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            keyPhrases: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            relationshipNotes: { type: SchemaType.STRING },
            contactNarrativeSummary: { type: SchemaType.STRING },
            styleObservations: { type: SchemaType.STRING },
          },
          required: ['tone', 'responseLength', 'topics', 'keyPhrases', 'relationshipNotes', 'contactNarrativeSummary', 'styleObservations'],
        },
      },
    })

    const prompt = `Analyze this email exchange and extract communication patterns.

Thread with ${senderEmail}:
${threadText}

User's sent reply:
${sentReply}

Extract:
- tone: communication tone (e.g. "professional-warm", "casual", "formal")
- responseLength: one of "short", "medium", "long"
- topics: array of main topics discussed
- keyPhrases: array of characteristic phrases the user uses
- relationshipNotes: notes about the relationship dynamic
- contactNarrativeSummary: narrative summary for the contact's Obsidian profile
- styleObservations: observations about the user's writing style from the sent reply`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text) as ExchangeAnalysis

    // Normalize responseLength to valid union value
    const valid = ['short', 'medium', 'long']
    if (!valid.includes(parsed.responseLength)) {
      parsed.responseLength = 'medium'
    }

    return parsed
  } catch (err) {
    console.error('Exchange analysis failed:', err)
    return null
  }
}
