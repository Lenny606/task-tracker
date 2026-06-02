import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to ensure mockSettings is defined before imports run
const { mockSettings } = vi.hoisted(() => ({
  mockSettings: {
    aiProvider: 'gemini' as 'gemini' | 'openai',
    aiModel: 'gemini-2.5-flash',
    geminiApiKey: 'mock-gemini-api-key',
    openaiApiKey: 'mock-openai-api-key',
    jiraApiKey: '',
    jiraEmail: '',
    jiraTempoApiKey: '',
    jiraUrl: '',
  }
}))

vi.mock('../store/settingsStore', () => ({
  getSettings: () => mockSettings,
  loadSettings: async () => mockSettings,
  saveSettings: vi.fn(),
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

import { getAiAdapter, aiService, PROVIDER_MODELS } from './ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import { createOpenaiChat } from '@tanstack/ai-openai'

describe('AI Service Multi-Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock settings
    mockSettings.aiProvider = 'gemini'
    mockSettings.aiModel = 'gemini-2.5-flash'
    mockSettings.geminiApiKey = 'mock-gemini-api-key'
    mockSettings.openaiApiKey = 'mock-openai-api-key'
    mockSettings.jiraApiKey = ''
    mockSettings.jiraEmail = ''
    mockSettings.jiraTempoApiKey = ''
    mockSettings.jiraUrl = ''
  })

  it('should list correct models for each provider', () => {
    expect(PROVIDER_MODELS.gemini).toContain('gemini-2.5-flash')
    expect(PROVIDER_MODELS.openai).toContain('gpt-4o')
  })

  it('should instantiate Gemini adapter when settings provider is gemini', () => {
    mockSettings.aiProvider = 'gemini'
    mockSettings.aiModel = 'gemini-2.5-flash'
    mockSettings.geminiApiKey = 'custom-gemini-key'

    const adapter = getAiAdapter()

    expect(createGeminiChat).toHaveBeenCalledWith('gemini-2.5-flash', 'custom-gemini-key', expect.any(Object))
    expect(adapter).toBeDefined()
  })

  it('should instantiate OpenAI adapter when settings provider is openai', () => {
    mockSettings.aiProvider = 'openai'
    mockSettings.aiModel = 'gpt-4o'
    mockSettings.openaiApiKey = 'custom-openai-key'

    const adapter = getAiAdapter()

    expect(createOpenaiChat).toHaveBeenCalledWith('gpt-4o', 'custom-openai-key', expect.any(Object))
    expect(adapter).toBeDefined()
  })

  it('should evaluate isConfigured based on the active provider API keys', () => {
    // Stub environment variables to be empty for clean unit testing of settings fallback logic
    vi.stubEnv('VITE_GEMINI_API_KEY', '')
    vi.stubEnv('VITE_OPENAI_API_KEY', '')

    // Gemini active, key present
    mockSettings.aiProvider = 'gemini'
    mockSettings.geminiApiKey = 'key'
    expect(aiService.isConfigured()).toBe(true)

    // Gemini active, key empty
    mockSettings.geminiApiKey = ''
    expect(aiService.isConfigured()).toBe(false)

    // OpenAI active, key present
    mockSettings.aiProvider = 'openai'
    mockSettings.openaiApiKey = 'key'
    expect(aiService.isConfigured()).toBe(true)

    // OpenAI active, key empty
    mockSettings.openaiApiKey = ''
    expect(aiService.isConfigured()).toBe(false)

    vi.unstubAllEnvs()
  })
})
