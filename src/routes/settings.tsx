import { createFileRoute } from '@tanstack/react-router'
import { Settings, Bot, Check, ChevronDown } from 'lucide-react'
import { useSettings } from '../store/settingsStore'
import { AI_MODELS, AI_MODEL_LABELS } from '../services/ai'
import type { AiModel } from '../services/ai'
import { useState, useRef, useEffect } from 'react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { settings, saveSettings } = useSettings()

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-2xl flex items-center justify-center ring-1 ring-indigo-500/20">
            <Settings className="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gradient">Settings</h1>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Configure your workspace preferences.
        </p>
      </header>

      <div className="space-y-6">
        {/* AI Configuration Card */}
        <section className="glass-panel rounded-3xl relative z-20">
          <div className="px-8 py-7 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Configuration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose the Gemini model used for commit analysis and JIRA summaries
              </p>
            </div>
          </div>

          <div className="px-8 py-6">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">
              Model
            </label>
            <ModelSelector
              value={settings.aiModel}
              onChange={(model) => saveSettings({ aiModel: model })}
            />
          </div>
        </section>

        {/* Jira Configuration Card */}
        <section className="glass-panel rounded-3xl relative z-10">
          <div className="px-8 py-7 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Jira Configuration</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Set up your Jira and Tempo API credentials for integration.
              </p>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                  Jira URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-domain.atlassian.net"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  value={settings.jiraUrl}
                  onChange={(e) => saveSettings({ jiraUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  value={settings.jiraEmail}
                  onChange={(e) => saveSettings({ jiraEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                  Jira API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your Jira API Token"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  value={settings.jiraApiKey}
                  onChange={(e) => saveSettings({ jiraApiKey: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                  Tempo API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your Tempo API Token"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  value={settings.jiraTempoApiKey}
                  onChange={(e) => saveSettings({ jiraTempoApiKey: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

function ModelSelector({
  value,
  onChange,
}: {
  value: AiModel
  onChange: (model: AiModel) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const models = Object.values(AI_MODELS) as AiModel[]
  const selected = AI_MODEL_LABELS[value]

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        id="ai-model-selector"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm group"
      >
        <div className="text-left">
          <div className="font-semibold text-slate-900 dark:text-white">{selected.label}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{selected.description}</div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-900/40 overflow-hidden">
          {models.map((model) => {
            const info = AI_MODEL_LABELS[model]
            const isSelected = model === value
            return (
              <button
                key={model}
                id={`model-option-${model}`}
                onClick={() => {
                  onChange(model)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between px-6 py-5 text-left transition-colors group ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div
                    className={`font-semibold ${
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {info.label}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {info.description}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-indigo-500 shrink-0 ml-3" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
