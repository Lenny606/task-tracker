import { describe, it, expect, vi } from 'vitest'
import { getAiAdapter, aiService, AI_MODELS } from './ai'

describe('AI Service', () => {
  it('should be defined', () => {
    expect(aiService).toBeDefined()
    expect(getAiAdapter).toBeDefined()
  })

  it('should have correct configuration structure', () => {
    expect(aiService.getAdapter()).toBeDefined()
    expect(typeof aiService.isConfigured).toBe('function')
  })

  it('should list common Gemini models', () => {
    expect(AI_MODELS.GEMINI_3_0_FLASH).toBe('gemini-3.0-flash')
  })
})
