import { useState, useEffect } from 'react'
import type { AiModel } from '../services/ai'

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

export const getSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveSettings = (patch: Partial<AppSettings>): AppSettings => {
  const current = getSettings()
  const updated = { ...current, ...patch }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent('settings-changed', { detail: updated }))
  return updated
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings)

  useEffect(() => {
    const handleChange = (e: Event) => {
      setSettings((e as CustomEvent<AppSettings>).detail)
    }
    window.addEventListener('settings-changed', handleChange)
    return () => window.removeEventListener('settings-changed', handleChange)
  }, [])

  return { settings, saveSettings }
}
