import { chat } from '@tanstack/ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import { createOpenaiChat } from '@tanstack/ai-openai'
import type { GitCommit } from './git'
import { getSettings } from '../store/settingsStore'

/**
 * AI Service configuration.
 * Supports both Gemini and OpenAI providers dynamically based on user settings.
 */

const AI_MODELS = {
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
} as const

export type AiModel = typeof AI_MODELS[keyof typeof AI_MODELS]

export const AI_MODEL_LABELS: Record<AiModel, { label: string; description: string }> = {
  'gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash',
    description: 'Latest & fastest Gemini — best for everyday use',
  },
  'gemini-2.0-flash': {
    label: 'Gemini 2.0 Flash',
    description: 'Previous generation Flash — reliable & quick',
  },
  'gpt-4o': {
    label: 'GPT-4o',
    description: 'OpenAI flagship model — high reasoning & quality',
  },
  'gpt-4o-mini': {
    label: 'GPT-4o mini',
    description: 'OpenAI fast model — highly cost-effective & speedy',
  },
}

export const PROVIDER_MODELS = {
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash'] as AiModel[],
  openai: ['gpt-4o', 'gpt-4o-mini'] as AiModel[],
}

const adapterCache = new Map<string, any>()

const isConfigured = () => {
  const settings = getSettings()
  if (settings.aiProvider === 'openai') {
    return !!(settings.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY)
  }
  return !!(settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY)
}

if (!isConfigured()) {
  console.warn(
    'AI Provider is not fully configured. AI features will not work until an API key is provided.'
  )
}

/**
 * Returns a configured adapter for the active AI Provider and given model.
 */
export const getAiAdapter = (model?: AiModel) => {
  const settings = getSettings()
  const resolvedModel = (model ?? settings.aiModel) as AiModel
  const provider = settings.aiProvider || 'gemini'

  const cacheKey = `${provider}:${resolvedModel}`
  if (adapterCache.has(cacheKey)) return adapterCache.get(cacheKey)!

  if (provider === 'openai') {
    const apiKey = settings.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY || ''
    if (!apiKey) {
      throw new Error('AI Service not configured: OpenAI API Key is missing')
    }
    const adapter = createOpenaiChat(
      resolvedModel as any,
      apiKey,
      {
        dangerouslyAllowBrowser: true,
      }
    )
    adapterCache.set(cacheKey, adapter)
    return adapter
  } else {
    const apiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || ''
    if (!apiKey) {
      throw new Error('AI Service not configured: Gemini API Key is missing')
    }
    const adapter = createGeminiChat(
      resolvedModel as any,
      apiKey,
      {
        dangerouslyAllowBrowser: true,
      }
    )
    adapterCache.set(cacheKey, adapter)
    return adapter
  }
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
      throw new Error('AI Service not configured: API key is missing')
    }

    const resolvedModel = model ?? getSettings().aiModel

    console.log(`[AI] Generating text for model: ${resolvedModel}...`)

    const response = await chat({
      adapter: getAiAdapter(resolvedModel),
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    })

    const text = typeof response === 'string'
      ? response
      : (response && typeof response === 'object' && 'text' in response ? (response as any).text : null)

    return text || "AI failed to generate a response. Please check your API key and try again."
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
