import { useState, useEffect } from 'react'
import type { AiModel } from '../services/ai'
import { getAppSettingsFn, saveAppSettingsFn } from '../services/settingsServer'

const SETTINGS_KEY = 'task-tracker-settings'

export interface AppSettings {
  aiModel: AiModel
  jiraApiKey: string
  jiraEmail: string
  jiraTempoApiKey: string
  jiraUrl: string
}

const DEFAULT_SETTINGS: AppSettings = {
  aiModel: 'gemini-2.5-flash',
  jiraApiKey: import.meta.env.VITE_JIRA_API_KEY || '',
  jiraEmail: import.meta.env.VITE_JIRA_EMAIL || '',
  jiraTempoApiKey: import.meta.env.VITE_JIRA_TEMPO_API_KEY || '',
  jiraUrl: import.meta.env.VITE_JIRA_URL || '',
}

// Client-side cache for synchronous access
let settingsCache: AppSettings = DEFAULT_SETTINGS

/**
 * Fetch settings from server and update cache
 */
export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const remote = await getAppSettingsFn()
    if (remote) {
      settingsCache = { ...DEFAULT_SETTINGS, ...remote } as AppSettings
    } else {
      // Fallback to localStorage if any, for migration period
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null
      if (stored) {
        settingsCache = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    }
  } catch (e) {
    console.error('[Settings] Failed to load settings from server:', e)
  }
  return settingsCache
}

export const getSettings = (): AppSettings => {
  return settingsCache
}

export const saveSettings = async (patch: Partial<AppSettings>): Promise<AppSettings> => {
  const current = getSettings()
  const updated = { ...current, ...patch }
  
  // Save to server
  try {
    await saveAppSettingsFn({ data: updated })
  } catch (e) {
    console.error('[Settings] Failed to save settings to server:', e)
  }

  // Update cache
  settingsCache = updated
  
  // Trigger local event for components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: updated }))
  }
  
  return updated
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

export const getJiraCredentials = (settings: AppSettings) => {
  return {
    url: settings.jiraUrl,
    email: settings.jiraEmail,
    apiKey: settings.jiraApiKey,
    tempoApiKey: settings.jiraTempoApiKey,
  }
}
