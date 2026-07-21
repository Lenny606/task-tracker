import { createFileRoute } from '@tanstack/react-router'
import { Settings, Bot, Check, ChevronDown, Timer, LayoutTemplate, Trash2, Bell, BellOff, Shield } from 'lucide-react'
import { useSettings } from '../store/settingsStore'
import { AI_MODEL_LABELS, PROVIDER_MODELS } from '../services/ai'
import type { AiModel } from '../services/ai'
import { useState, useRef, useEffect } from 'react'
import { getExtensionTokenFn } from '../services/extensionTokenServer'
import { PageHeader } from '../components/PageHeader'
import { SectionCard } from '../components/SectionCard'
import { CopyField } from '../components/CopyField'
import { Input } from '../components/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTaskTemplatesFn, deleteTaskTemplateFn } from '../services/tasksServer'
import { getProjectsFn } from '../services/projectsServer'
import { toast } from '../store/toastStore'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

const SECTIONS = [
  { id: 'notifications', label: 'Oznámení', icon: Bell },
  { id: 'ai-settings', label: 'AI Poskytovatel', icon: Bot },
  { id: 'jira-settings', label: 'Jira & Tempo', icon: Settings },
  { id: 'rounding-settings', label: 'Zaokrouhlování', icon: Timer },
  { id: 'templates-settings', label: 'Šablony úkolů', icon: LayoutTemplate },
  { id: 'extension-settings', label: 'Zabezpečení', icon: Shield },
]

function SettingsPage() {
  const { settings, saveSettings } = useSettings()
  const [extensionToken, setExtensionToken] = useState('')
  const [activeSection, setActiveSection] = useState('notifications')

  const queryClient = useQueryClient()

  const { data: templates = [] } = useQuery({
    queryKey: ['taskTemplates'],
    queryFn: () => getTaskTemplatesFn().then(res => res as any[]),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteTaskTemplateFn({ data: { id } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] })
      toast.success('Šablona byla úspěšně smazána.')
    },
    onError: () => {
      toast.error('Nepodařilo se smazat šablonu.')
    }
  })

  const getProjectDetails = (projectId: string | null) => {
    if (!projectId) return null
    return projects.find((p: any) => p.id === projectId)
  }

  useEffect(() => {
    getExtensionTokenFn().then(setExtensionToken)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 }
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -90
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <PageHeader
        title="Nastavení"
        description="Nakonfigurujte předvolby svého pracovního prostředí."
        icon={Settings}
      />

      <div className="space-y-6">
        {/* AI Configuration Card */}
        <SectionCard
          title="Nastavení AI"
          description="Zvolte aktivního AI poskytovatele a model pro analýzu commitů a souhrny pro Jiru"
          icon={Bot}
          iconBgColor="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
          className="z-20"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                Poskytovatel AI
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const firstModel = PROVIDER_MODELS.gemini[0]
                    saveSettings({ aiProvider: 'gemini', aiModel: firstModel })
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all text-center cursor-pointer ${(settings.aiProvider || 'gemini') === 'gemini'
                      ? 'border-indigo-500 bg-indigo-50/55 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <span className="font-bold text-base">Google Gemini</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rychlé reasoning modely</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstModel = PROVIDER_MODELS.openai[0]
                    saveSettings({ aiProvider: 'openai', aiModel: firstModel })
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all text-center cursor-pointer ${settings.aiProvider === 'openai'
                      ? 'border-emerald-500 bg-emerald-50/55 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <span className="font-bold text-base">OpenAI GPT</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standardní modely v oboru</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                Model
              </label>
              <ModelSelector
                value={settings.aiModel}
                provider={settings.aiProvider || 'gemini'}
                onChange={(model) => saveSettings({ aiModel: model })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <SecretKeyInput
                label="Gemini API klíč"
                placeholder="Google Studio API klíč"
                isSet={settings.hasGeminiApiKey}
                onSave={(value) => saveSettings({ geminiApiKey: value })}
              />

              <SecretKeyInput
                label="OpenAI API klíč"
                placeholder="OpenAI Platform API klíč"
                isSet={settings.hasOpenaiApiKey}
                onSave={(value) => saveSettings({ openaiApiKey: value })}
              />
            </div>
          </div>
        </SectionCard>

        {/* Jira Configuration Card */}
        <SectionCard
          title="Nastavení Jira"
          description="Nastavte přihlašovací údaje k Jira a Tempo API pro integraci."
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
              label="E-mail"
              placeholder="vas-email@priklad.cz"
              className="py-3"
              value={settings.jiraEmail}
              onChange={(e) => saveSettings({ jiraEmail: e.target.value })}
            />

            <SecretKeyInput
              label="Jira API klíč"
              placeholder="Vložte svůj Jira API token"
              isSet={settings.hasJiraApiKey}
              onSave={(value) => saveSettings({ jiraApiKey: value })}
            />

            <SecretKeyInput
              label="Tempo API klíč"
              placeholder="Vložte svůj Tempo API token"
              isSet={settings.hasJiraTempoApiKey}
              onSave={(value) => saveSettings({ jiraTempoApiKey: value })}
            />
          </div>
        </SectionCard>

        {/* Worklog Rounding Card */}
        <SectionCard
          title="Zaokrouhlování vykazování"
          description="Nastavte, jak se trackovaný čas zaokrouhluje při vykazování do Tempo."
          icon={Timer}
          iconBgColor="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                Krok zaokrouhlení
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[0, 5, 10, 15, 30].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => saveSettings({ worklogRoundingMinutes: minutes })}
                    className={`px-4 py-3 rounded-2xl border-2 transition-all text-center font-bold text-sm cursor-pointer ${(settings.worklogRoundingMinutes ?? 0) === minutes
                        ? 'border-amber-500 bg-amber-50/55 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {minutes === 0 ? 'Vypnuto' : `${minutes} min`}
                  </button>
                ))}
              </div>
            </div>

            {(settings.worklogRoundingMinutes ?? 0) > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                  Strategie
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => saveSettings({ worklogRoundingStrategy: 'nearest' })}
                    className={`px-4 py-3 rounded-2xl border-2 transition-all text-center cursor-pointer ${(settings.worklogRoundingStrategy || 'nearest') === 'nearest'
                        ? 'border-amber-500 bg-amber-50/55 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span className="font-bold text-sm">Na nejbližší</span>
                    <span className="block text-xs opacity-70 mt-0.5">Nahoru i dolů</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSettings({ worklogRoundingStrategy: 'up' })}
                    className={`px-4 py-3 rounded-2xl border-2 transition-all text-center cursor-pointer ${settings.worklogRoundingStrategy === 'up'
                        ? 'border-amber-500 bg-amber-50/55 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span className="font-bold text-sm">Vždy nahoru</span>
                    <span className="block text-xs opacity-70 mt-0.5">Nikdy nezkrátit</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Task Templates Configuration Card */}
        <SectionCard
          title="Šablony úkolů"
          description="Spravujte své předdefinované šablony pro rychlé zakládání denních úkolů."
          icon={LayoutTemplate}
          iconBgColor="bg-violet-50 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
        >
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-sm">Zatím nemáte žádné šablony. Můžete je vytvořit přímo na Dashboardu kliknutím na ikonu šablony u libovolného úkolu.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {templates.map((tpl: any) => {
                  const project = getProjectDetails(tpl.trackerProjectId)
                  return (
                    <div key={tpl.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{tpl.name}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {project && (
                            <span
                              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border"
                              style={{ color: project.color, borderColor: `${project.color}33`, backgroundColor: `${project.color}10` }}
                            >
                              {project.name}
                            </span>
                          )}
                          {tpl.jiraKey && (
                            <span className="text-[9px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/10">
                              {tpl.jiraKey}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTemplateMutation.mutate(tpl.id)}
                        disabled={deleteTemplateMutation.isPending && deleteTemplateMutation.variables === tpl.id}
                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-50"
                        title="Smazat šablonu"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Browser Extension Security Card */}
        <SectionCard
          title="Zabezpečení rozšíření prohlížeče"
          description="Ověřování požadavků přicházejících z rozšíření Chrome Clipper."
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
              Aby škodlivé weby nemohly číst ani zapisovat vaše úkoly, vyžaduje lokální endpoint rozšíření ověření. Zkopírujte tento sdílený klíč a vložte jej do nastavení rozšíření (ikona ozubeného kola v popupu Clipperu).
            </p>
            <CopyField value={extensionToken} />
          </div>
        </SectionCard>
      </div>
    </div>
    </div >
  )
}

function SecretKeyInput({
  label,
  placeholder,
  isSet,
  onSave,
}: {
  label: string
  placeholder: string
  isSet: boolean
  onSave: (value: string) => void
}) {
  // The stored key never leaves the server, so the input only holds what the user types
  const [value, setValue] = useState('')

  const commit = () => {
    if (!value.trim()) return
    onSave(value.trim())
    setValue('')
  }

  return (
    <Input
      type="password"
      label={label}
      placeholder={isSet ? '•••••••• (uloženo — pište pro nahrazení)' : placeholder}
      className="py-3"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    />
  )
}

function ModelSelector({
  value,
  provider,
  onChange,
}: {
  value: AiModel
  provider: 'gemini' | 'openai'
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

  const models = PROVIDER_MODELS[provider] || PROVIDER_MODELS.gemini
  const activeValue = models.includes(value) ? value : models[0]
  const selected = AI_MODEL_LABELS[activeValue]

  return (
    <div ref={ref} className="relative" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
      {/* Trigger */}
      <button
        id="ai-model-selector"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Vybrat AI model"
        className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-sm group cursor-pointer"
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
                className={`w-full flex items-center justify-between px-6 py-5 text-left transition-colors group cursor-pointer ${isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                <div>
                  <div
                    className={`font-semibold ${isSelected
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
