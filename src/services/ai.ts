/**
 * Client-safe AI model catalogue.
 * All runtime AI calls (which require API keys) live server-side in aiServer.ts.
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
