import { useState, useEffect } from 'react'
import type { AiModel } from '../services/ai'
import { getAppSettingsFn, saveAppSettingsFn } from '../services/settingsServer'

interface AppSettings {
  aiProvider: 'gemini' | 'openai'
  aiModel: AiModel
  jiraEmail: string
  jiraUrl: string
  // Secret keys are stored server-side only; the client just knows whether they are set.
  hasGeminiApiKey: boolean
  hasOpenaiApiKey: boolean
  hasJiraApiKey: boolean
  hasJiraTempoApiKey: boolean
}

// Secret values can be written (sent to the server) but are never read back.
type AppSettingsPatch = Partial<AppSettings> & {
  geminiApiKey?: string
  openaiApiKey?: string
  jiraApiKey?: string
  jiraTempoApiKey?: string
}

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'gemini',
  aiModel: 'gemini-2.5-flash' as AiModel,
  jiraEmail: import.meta.env.VITE_JIRA_EMAIL || '',
  jiraUrl: import.meta.env.VITE_JIRA_URL || '',
  hasGeminiApiKey: false,
  hasOpenaiApiKey: false,
  hasJiraApiKey: false,
  hasJiraTempoApiKey: false,
}

// Client-side cache for synchronous access
let settingsCache: AppSettings = DEFAULT_SETTINGS

/**
 * Fetch settings from server and update cache
 */
const loadSettings = async (): Promise<AppSettings> => {
  try {
    const remote = await getAppSettingsFn()
    if (remote) {
      settingsCache = { ...DEFAULT_SETTINGS, ...remote } as AppSettings
    }
  } catch (e) {
    console.error('[Settings] Failed to load settings from server:', e)
  }
  return settingsCache
}

const getSettings = (): AppSettings => {
  return settingsCache
}

const saveSettings = async (patch: AppSettingsPatch): Promise<AppSettings> => {
  // Send only the patch; the server merges it and returns the sanitized result
  try {
    const updated = await saveAppSettingsFn({ data: patch })
    settingsCache = { ...DEFAULT_SETTINGS, ...updated } as AppSettings
  } catch (e) {
    console.error('[Settings] Failed to save settings to server:', e)
  }

  // Trigger local event for components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: settingsCache }))
  }

  return settingsCache
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings)

  useEffect(() => {
    // Initial load from cache/server
    loadSettings().then(setSettings)

    const handleChange = (e: Event) => {
      setSettings((e as CustomEvent<AppSettings>).detail)
    }
    window.addEventListener('settings-changed', handleChange)
    return () => window.removeEventListener('settings-changed', handleChange)
  }, [])

  return { settings, saveSettings }
}
