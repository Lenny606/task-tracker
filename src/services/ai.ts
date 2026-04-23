import { chat } from '@tanstack/ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import type { GitCommit } from './git'
import { getSettings } from '../store/settingsStore'

/**
 * AI Service configuration for Gemini's OpenAI-compatible endpoint.
 * 
 * To use this service, ensure VITE_GEMINI_API_KEY is set in your .env file.
 * Get your key from: https://aistudio.google.com/app/apikey
 */

export const AI_MODELS = {
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
} as const

export type AiModel = typeof AI_MODELS[keyof typeof AI_MODELS]

export const AI_MODEL_LABELS: Record<AiModel, { label: string; description: string }> = {
  'gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash',
    description: 'Latest & fastest — best for everyday use',
  },
  'gemini-2.0-flash': {
    label: 'Gemini 2.0 Flash',
    description: 'Previous generation Flash — reliable & quick',
  },
  'gemini-1.5-pro': {
    label: 'Gemini 1.5 Pro',
    description: 'Pro-tier reasoning — slower but more thorough',
  },
  'gemini-1.5-flash': {
    label: 'Gemini 1.5 Flash',
    description: 'Lightweight & low-latency',
  },
}

const getGeminiApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || ''
const adapterCache = new Map<string, ReturnType<typeof createGeminiChat>>()

export const isConfigured = () => !!getGeminiApiKey()

if (!isConfigured()) {
  console.warn(
    'VITE_GEMINI_API_KEY is not defined. AI features will not work until an API key is provided.'
  )
}

/**
 * Returns a configured Gemini adapter for the given model.
 * Falls back to the stored settings model if none is provided.
 */
export const getAiAdapter = (model?: AiModel) => {
  const resolvedModel = model ?? getSettings().aiModel

  if (adapterCache.has(resolvedModel)) return adapterCache.get(resolvedModel)!

  const apiKey = getGeminiApiKey()

  if (!apiKey) {
    throw new Error('AI Service not configured: VITE_GEMINI_API_KEY is missing')
  }

  const adapter = createGeminiChat(
    resolvedModel,
    apiKey,
    {
      dangerouslyAllowBrowser: true,
    }
  )

  adapterCache.set(resolvedModel, adapter)
  return adapter
}


/**
 * Service to interact with the AI agent
 */
export const aiService = {
  getAdapter: (model?: AiModel) => getAiAdapter(model),

  /**
   * Helper to check if AI is configured
   */
  isConfigured,

  /**
   * Simple client to send prompts to LLM
   */
  generateText: async (prompt: string, model?: AiModel) => {
    if (!isConfigured()) {
      throw new Error('AI Service not configured: VITE_GEMINI_API_KEY is missing')
    }

    const resolvedModel = model ?? getSettings().aiModel

    console.log(`[AI] Generating text for model: ${resolvedModel}...`)
    
    const response = await chat({
      adapter: getAiAdapter(resolvedModel),
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    })

    return response.text || "AI failed to generate a response. Please check your API key and try again."
  },

  /**
   * Analyzes commits for Tomas Kravcik and formats them for JIRA
   */
  analyzeCommitsForJira: async (commits: GitCommit[]) => {
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

    return await aiService.generateText(prompt)
  }
}
