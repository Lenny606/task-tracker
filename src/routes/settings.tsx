import { createFileRoute } from '@tanstack/react-router'
import { Settings, Bot, Check, ChevronDown } from 'lucide-react'
import { useSettings } from '../store/settingsStore'
import { AI_MODELS, AI_MODEL_LABELS } from '../services/ai'
import type { AiModel } from '../services/ai'
import { useState, useRef, useEffect } from 'react'
import { getExtensionTokenFn } from '../services/settingsServer'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { CopyField } from '../components/CopyField'
import { Input } from '../components/Input'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { settings, saveSettings } = useSettings()
  const [extensionToken, setExtensionToken] = useState('')

  useEffect(() => {
    getExtensionTokenFn().then(setExtensionToken)
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <PageHeader
        title="Settings"
        description="Configure your workspace preferences."
        icon={Settings}
      />

      <div className="space-y-6">
        {/* AI Configuration Card */}
        <SectionCard
          title="AI Configuration"
          description="Choose the Gemini model used for commit analysis and JIRA summaries"
          icon={Bot}
          iconBgColor="bg-violet-50 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
          className="z-20"
        >
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">
            Model
          </label>
          <ModelSelector
            value={settings.aiModel}
            onChange={(model) => saveSettings({ aiModel: model })}
          />
        </SectionCard>

        {/* Jira Configuration Card */}
        <SectionCard
          title="Jira Configuration"
          description="Set up your Jira and Tempo API credentials for integration."
          icon={Settings}
          iconBgColor="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          className="z-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="text"
              label="Jira URL"
              placeholder="https://your-domain.atlassian.net"
              className="py-3"
              value={settings.jiraUrl}
              onChange={(e) => saveSettings({ jiraUrl: e.target.value })}
            />

            <Input
              type="email"
              label="Email"
              placeholder="your-email@example.com"
              className="py-3"
              value={settings.jiraEmail}
              onChange={(e) => saveSettings({ jiraEmail: e.target.value })}
            />

            <Input
              type="password"
              label="Jira API Key"
              placeholder="Paste your Jira API Token"
              className="py-3"
              value={settings.jiraApiKey}
              onChange={(e) => saveSettings({ jiraApiKey: e.target.value })}
            />

            <Input
              type="password"
              label="Tempo API Key"
              placeholder="Paste your Tempo API Token"
              className="py-3"
              value={settings.jiraTempoApiKey}
              onChange={(e) => saveSettings({ jiraTempoApiKey: e.target.value })}
            />
          </div>
        </SectionCard>

        {/* Browser Extension Security Card */}
        <SectionCard
          title="Browser Extension Security"
          description="Authenticate requests coming from the Chrome Clipper extension."
          icon={() => (
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          iconBgColor="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
          className="z-0"
        >
          <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              To prevent malicious websites from reading or writing your tasks, the local extension endpoint requires authentication. Copy this pre-shared key and paste it inside the extension settings (click the gear icon in the Clipper popup).
            </p>
            <CopyField value={extensionToken} />
          </div>
        </SectionCard>
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
