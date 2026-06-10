import { chat } from '@tanstack/ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import { createOpenaiChat } from '@tanstack/ai-openai'
import { settingsRepository } from '../repositories/settings.repository'
import type { GitCommit } from './gitCore'
import type { AiModel } from './ai'

export interface AiSettings {
  aiProvider: string
  aiModel: string
  geminiApiKey: string
  openaiApiKey: string
}

/**
 * Loads AI provider settings from the server-side settings store.
 * API keys never travel to the client.
 */
async function loadAiSettings(): Promise<AiSettings> {
  const settings = await settingsRepository.getSettings()
  return {
    aiProvider: settings?.aiProvider || 'gemini',
    aiModel: settings?.aiModel || 'gemini-2.5-flash',
    geminiApiKey: settings?.geminiApiKey || process.env.GEMINI_API_KEY || '',
    openaiApiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY || '',
  }
}

/**
 * Returns a configured adapter for the active AI Provider and given model.
 */
export const getAiAdapter = (settings: AiSettings, model?: AiModel) => {
  const resolvedModel = (model ?? settings.aiModel) as AiModel
  const provider = settings.aiProvider || 'gemini'

  if (provider === 'openai') {
    if (!settings.openaiApiKey) {
      throw new Error('AI Service not configured: OpenAI API Key is missing')
    }
    return createOpenaiChat(resolvedModel as any, settings.openaiApiKey)
  }

  if (!settings.geminiApiKey) {
    throw new Error('AI Service not configured: Gemini API Key is missing')
  }
  return createGeminiChat(resolvedModel as any, settings.geminiApiKey)
}

/**
 * Simple client to send prompts to LLM
 */
export async function generateText(prompt: string, model?: AiModel) {
  const settings = await loadAiSettings()
  const resolvedModel = (model ?? settings.aiModel) as AiModel

  console.log(`[AI] Generating text for model: ${resolvedModel}...`)

  const response = await chat({
    adapter: getAiAdapter(settings, resolvedModel),
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  })

  const text = typeof response === 'string'
    ? response
    : (response && typeof response === 'object' && 'text' in response ? (response as any).text : null)

  return text || "AI failed to generate a response. Please check your API key and try again."
}

/**
 * Analyzes commits for Tomas Kravcik and formats them for JIRA
 */
export async function analyzeCommitsForJira(commits: GitCommit[]) {
  if (!Array.isArray(commits)) {
    console.error('[AI] analyzeCommitsForJira: commits is not an array', commits)
    return "Error: Invalid commit data received."
  }

  // First filter every user except Tomas Kravcik (case insensitive and handle prefix)
  const tomasCommits = commits.filter(c =>
    c.authorName.toLowerCase().includes('tomas')
  )

  console.log(`[AI] Found ${tomasCommits.length} commits for Tomas out of ${commits.length} total commits.`)

  if (tomasCommits.length === 0) {
    return "No commits found for Tomas Kravcik in the provided data."
  }

  // Format commit data for the prompt
  const commitData = tomasCommits.map(c =>
    `- [${c.projectName}] ${c.message} (${c.hash.substring(0, 7)})`
  ).join('\n')

  const prompt = `
Analyze the following git commits from Tomas Kravcik and generate a concise, professional JIRA task description. Make it structured and easy to read.
The description should summarize the work done, group it by project if applicable, and use a clear "Main Objectives" and "Implementation Details" structure.

Git Commits:
${commitData}

Formatted JIRA Description:
`

  return await generateText(prompt)
}
