import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { ContactPattern } from '@/types'

const VAULT = process.env.OBSIDIAN_VAULT_PATH ?? ''
const BASE = path.join(VAULT, 'Email Intelligence')

function sanitizeEmail(email: string): string {
  return email.replace(/[<>]/g, '').trim().replace(/[@.]/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export async function readContactProfile(email: string): Promise<string | null> {
  const clean = sanitizeEmail(email)
  const filePath = path.join(BASE, 'Contacts', `${clean}.md`)
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

export async function upsertContactProfile(
  email: string,
  pattern: Partial<ContactPattern>,
  narrativeSummary: string
): Promise<void> {
  const clean = sanitizeEmail(email)
  const dir = path.join(BASE, 'Contacts')
  await ensureDir(dir)
  const filePath = path.join(dir, `${clean}.md`)

  let existing: matter.GrayMatterFile<string> | null = null
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    existing = matter(raw)
  } catch {
    // first time
  }

  const merged = {
    email,
    tone: pattern.tone ?? existing?.data.tone ?? 'professional',
    responseLength: pattern.responseLength ?? existing?.data.responseLength ?? 'medium',
    topics: [...new Set([...(existing?.data.topics ?? []), ...(pattern.topics ?? [])])],
    keyPhrases: [...new Set([...(existing?.data.keyPhrases ?? []), ...(pattern.keyPhrases ?? [])])],
    lastUpdated: new Date().toISOString().split('T')[0],
  }

  const content = matter.stringify(narrativeSummary, merged)
  const tmpPath = filePath + '.tmp'
  await fs.writeFile(tmpPath, content, 'utf-8')
  await fs.rename(tmpPath, filePath)
}

export async function readCommunicationStyle(): Promise<string | null> {
  const filePath = path.join(BASE, 'Patterns', 'communication-style.md')
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

export async function updateCommunicationStyle(update: string): Promise<void> {
  const dir = path.join(BASE, 'Patterns')
  await ensureDir(dir)
  const filePath = path.join(dir, 'communication-style.md')
  let existing = ''
  try {
    existing = await fs.readFile(filePath, 'utf-8')
  } catch {
    // first time - create initial
    existing = `# Communication Style\n\n*Auto-generated from email analysis*\n\n`
  }
  const appended = `${existing}\n\n---\n*Updated ${new Date().toISOString().split('T')[0]}*\n\n${update}`
  await fs.writeFile(filePath, appended, 'utf-8')
}

export async function saveThreadSummary(threadId: string, summary: string): Promise<void> {
  const dir = path.join(BASE, 'Threads')
  await ensureDir(dir)
  const filePath = path.join(dir, `${threadId}.md`)
  await fs.writeFile(filePath, summary, 'utf-8')
}
