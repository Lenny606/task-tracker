import { describe, it, expect, vi } from 'vitest'
import { aiAdapter, aiService, AI_MODELS } from './ai'

describe('AI Service', () => {
  it('should be defined', () => {
    expect(aiService).toBeDefined()
    expect(aiAdapter).toBeDefined()
  })

  it('should have correct configuration structure', () => {
    expect(aiService.getAdapter()).toBe(aiAdapter)
    expect(typeof aiService.isConfigured).toBe('function')
  })

  it('should list common Gemini models', () => {
    expect(AI_MODELS.GEMINI_1_5_FLASH).toBe('gemini-1.5-flash')
    expect(AI_MODELS.GEMINI_2_0_FLASH).toBe('gemini-2.0-flash')
  })
})
