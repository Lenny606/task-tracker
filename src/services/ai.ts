import { createOpenaiChat } from '@tanstack/ai-openai'

/**
 * AI Service configuration for Gemini's OpenAI-compatible endpoint.
 * 
 * To use this service, ensure VITE_GEMINI_API_KEY is set in your .env file.
 * Get your key from: https://aistudio.google.com/app/apikey
 */

export const AI_MODELS = {
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
} as const

export type AiModel = typeof AI_MODELS[keyof typeof AI_MODELS]

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'

if (!GEMINI_API_KEY) {
  console.warn(
    'VITE_GEMINI_API_KEY is not defined. AI features will not work until an API key is provided.'
  )
}

/**
 * Configured OpenAI text adapter pointing to Gemini.
 * We use createOpenaiChat to explicitly provide the API key and baseURL.
 */
export const aiAdapter = createOpenaiChat(
  AI_MODELS.GEMINI_1_5_FLASH,
  GEMINI_API_KEY || 'no-key-provided',
  {
    baseURL: GEMINI_BASE_URL,
    dangerouslyAllowBrowser: true,
  }
)

/**
 * Service to interact with the AI agent
 */
export const aiService = {
  getAdapter: () => aiAdapter,
  
  /**
   * Helper to check if AI is configured
   */
  isConfigured: () => !!GEMINI_API_KEY,
}
