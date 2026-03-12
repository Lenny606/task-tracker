import { chat } from '@tanstack/ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import type { GitCommit } from './git'

/**
 * AI Service configuration for Gemini's OpenAI-compatible endpoint.
 * 
 * To use this service, ensure VITE_GEMINI_API_KEY is set in your .env file.
 * Get your key from: https://aistudio.google.com/app/apikey
 */

export const AI_MODELS = {
  GEMINI_3_0_FLASH: 'gemini-3.0-flash',
} as const

export type AiModel = typeof AI_MODELS[keyof typeof AI_MODELS]

const getGeminiApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'

let adapterInstance: ReturnType<typeof createGeminiChat> | null = null

export const isConfigured = () => !!getGeminiApiKey()

if (!isConfigured()) {
  console.warn(
    'VITE_GEMINI_API_KEY is not defined. AI features will not work until an API key is provided.'
  )
}

/**
 * Returns a configured Gemini adapter instance.
 * Uses a singleton pattern to reuse the same instance across the application.
 * @throws Error if the API key is not configured when called.
 */
export const getAiAdapter = () => {
  if (adapterInstance) return adapterInstance

  const apiKey = getGeminiApiKey()
  
  if (!apiKey) {
    throw new Error('AI Service not configured: VITE_GEMINI_API_KEY is missing')
  }

  adapterInstance = createGeminiChat(
    AI_MODELS.GEMINI_3_0_FLASH,
    apiKey,
    {
      baseURL: GEMINI_BASE_URL,
      dangerouslyAllowBrowser: true,
    }
  )

  return adapterInstance
}



/**
 * Service to interact with the AI agent
 */
export const aiService = {
  getAdapter: () => getAiAdapter(),

  /**
   * Helper to check if AI is configured
   */
  isConfigured,

  /**
   * Simple client to send prompts to LLM
   */
  generateText: async (prompt: string, model: AiModel = AI_MODELS.GEMINI_3_0_FLASH) => {
    if (!isConfigured()) {
      throw new Error('AI Service not configured: VITE_GEMINI_API_KEY is missing')
    }

    return await chat({
      adapter: getAiAdapter(),
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    })
  },

  /**
   * Analyzes commits for Tomas Kravcik and formats them for JIRA
   */
  analyzeCommitsForJira: async (commits: GitCommit[]) => {
    // First filter every user except Tomas Kravcik
    const tomasCommits = commits.filter(c => c.authorName === 'Tomas Kravcik')

    if (tomasCommits.length === 0) {
      return "No commits found for Tomas Kravcik in the provided data."
    }

    // Format commit data for the prompt
    const commitData = tomasCommits.map(c =>
      `- [${c.projectName}] ${c.message} (${c.hash.substring(0, 7)})`
    ).join('\n')

    const prompt = `
Analyze the following git commits from Tomas Kravcik and generate a concise, professional JIRA task description. 
The description should summarize the work done, group it by project if applicable, and use a clear "Main Objectives" and "Implementation Details" structure.

Git Commits:
${commitData}

Formatted JIRA Description:
`

    return await aiService.generateText(prompt, AI_MODELS.GEMINI_3_0_FLASH)
  }
}
