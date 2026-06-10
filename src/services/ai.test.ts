import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the settings repository so no real database is opened
vi.mock('../repositories/settings.repository', () => ({
  settingsRepository: {
    getSettings: vi.fn(),
  },
}))

// Mock TanStack AI adapters to avoid network requests and syntax errors
vi.mock('@tanstack/ai-gemini', () => ({
  createGeminiChat: vi.fn((model, key) => ({
    kind: 'text',
    name: 'gemini',
    model,
    key,
  })),
}))

vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat: vi.fn((model, key) => ({
    kind: 'text',
    name: 'openai',
    model,
    key,
  })),
}))

import { getAiAdapter } from './aiCore'
import { PROVIDER_MODELS } from './ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import { createOpenaiChat } from '@tanstack/ai-openai'

const baseSettings = {
  aiProvider: 'gemini',
  aiModel: 'gemini-2.5-flash',
  geminiApiKey: 'mock-gemini-api-key',
  openaiApiKey: 'mock-openai-api-key',
}

describe('AI Service Multi-Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list correct models for each provider', () => {
    expect(PROVIDER_MODELS.gemini).toContain('gemini-2.5-flash')
    expect(PROVIDER_MODELS.openai).toContain('gpt-4o')
  })

  it('should instantiate Gemini adapter when settings provider is gemini', () => {
    const adapter = getAiAdapter({
      ...baseSettings,
      aiProvider: 'gemini',
      geminiApiKey: 'custom-gemini-key',
    })

    expect(createGeminiChat).toHaveBeenCalledWith('gemini-2.5-flash', 'custom-gemini-key')
    expect(adapter).toBeDefined()
  })

  it('should instantiate OpenAI adapter when settings provider is openai', () => {
    const adapter = getAiAdapter({
      ...baseSettings,
      aiProvider: 'openai',
      aiModel: 'gpt-4o',
      openaiApiKey: 'custom-openai-key',
    })

    expect(createOpenaiChat).toHaveBeenCalledWith('gpt-4o', 'custom-openai-key')
    expect(adapter).toBeDefined()
  })

  it('should throw when the active provider API key is missing', () => {
    expect(() => getAiAdapter({ ...baseSettings, geminiApiKey: '' }))
      .toThrow('Gemini API Key is missing')

    expect(() => getAiAdapter({ ...baseSettings, aiProvider: 'openai', openaiApiKey: '' }))
      .toThrow('OpenAI API Key is missing')
  })
})
