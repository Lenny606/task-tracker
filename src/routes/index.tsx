import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Plus, RotateCcw, Trash2, CheckCircle2, Circle, Database, Sparkles, Check, LayoutTemplate, Bookmark } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useTaskMonitor } from '../hooks/useTaskMonitor'
import { useIsMounted } from '../hooks/useIsMounted'
import { formatSecondsToDuration, formatFullTime } from '../utils/duration'
import { ProjectSelector } from '../components/ProjectSelector'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createTaskTemplateFn, getTaskTemplatesFn } from '../services/tasksServer'
import { getProjectsFn } from '../services/projectsServer'
import { toast } from '../store/toastStore'


export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { tasks, addTask, toggleTask, toggleMarked, resetTask, deleteTask, updateTask, getDisplayTime, copyTasksFromDay } = useTasks()
  const isMounted = useIsMounted()
  const navigate = useNavigate()
  useTaskMonitor()
  const [newTaskName, setNewTaskName] = useState('')
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const templatesRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()
  const { data: templates = [] } = useQuery({
    queryKey: ['taskTemplates'],
    queryFn: () => getTaskTemplatesFn().then(res => res as any[]),
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  })

  const saveAsTemplateMutation = useMutation({
    mutationFn: async (task: any) => {
      return await createTaskTemplateFn({
        data: {
          name: task.name,
          jiraKey: task.jiraKey || null,
          jiraSummary: task.jiraSummary || null,
          trackerProjectId: task.trackerProjectId || null,
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskTemplates'] })
      toast.success('Úkol byl úspěšně uložen jako šablona.')
    },
    onError: () => {
      toast.error('Nepodařilo se uložit šablonu.')
    }
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templatesRef.current && !templatesRef.current.contains(event.target as Node)) {
        setIsTemplatesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleApplyTemplate = (template: any) => {
    addTask.mutate({
      name: template.name,
      jiraKey: template.jiraKey,
      jiraSummary: template.jiraSummary,
      trackerProjectId: template.trackerProjectId,
    })
    setIsTemplatesOpen(false)
    toast.success(`Přidán úkol z šablony: ${template.name}`)
  }

  const handleLogToJira = (task: any) => {
    const time = getDisplayTime(task)
    navigate({
      to: '/jira',
      search: {
        view: 'create',
        description: task.name,
        duration: formatSecondsToDuration(time),
        date: new Date().toISOString().split('T')[0]
      }
    })
  }


  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskName.trim()) return
    const id = crypto.randomUUID()
    addTask.mutate({ id, name: newTaskName })
    setNewTaskName('')
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gradient">
          Dnešní úkoly
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Sledujte svůj čas a zůstaňte produktivní.
        </p>
      </header>

      {/* Tasks List */}
      <div className="space-y-4">
        {!isMounted ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-50">
            <p className="text-slate-500">Načítání úkolů…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4">
            <p className="text-slate-500">Zatím žádné úkoly pro dnešek. Přidejte první níže!</p>
            <Button
              variant="secondary"
              onClick={() => {
                copyTasksFromDay.mutate(undefined, {
                  onSuccess: (res: any) => {
                    if (res && res.copiedCount > 0) {
                      toast.success(`Převzato ${res.copiedCount} úkolů ze včerejška.`)
                    } else {
                      toast.info('Nebyly nalezeny žádné úkoly k převzetí.')
                    }
                  },
                  onError: () => {
                    toast.error('Nepodařilo se převzít včerejší úkoly.')
                  }
                })
              }}
              isLoading={copyTasksFromDay.isPending}
            >
              Převzít včerejší úkoly
            </Button>
          </div>
        ) : tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex flex-wrap items-center justify-between gap-y-4 p-5 transition-all duration-300 rounded-2xl glass-panel relative hover:z-50 focus-within:z-50 ${
              task.isMarked 
                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                : ''
            } ${
              task.isRunning
                ? 'ring-4 ring-indigo-500/10 scale-[1.01] border-indigo-500/50'
                : 'hover:scale-[1.005] border-transparent'
            }`}
          >
            <button
              onClick={() => toggleMarked.mutate(task.id)}
              aria-pressed={task.isMarked}
              aria-label={task.isMarked ? 'Zrušit označení úkolu jako vykázaného' : 'Označit úkol jako vykázaný'}
              title={task.isMarked ? 'Vykázáno — kliknutím zrušíte označení' : 'Označit jako vykázaný (zapsaný do Jiry)'}
              className={`mr-4 transition-all active:scale-95 ${
                task.isMarked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
              }`}
            >
              {task.isMarked ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <div className="flex flex-col flex-1 min-w-0">
              <Input
                type="text"
                variant="ghost"
                defaultValue={task.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== task.name) {
                    updateTask.mutate({ taskId: task.id, name: e.target.value.trim() })
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                title="Kliknutím upravíte název úkolu"
                aria-label="Název úkolu"
                className={`font-semibold text-xl px-2 -ml-2 transition-all w-full outline-none border-none shadow-none ring-0 focus:ring-2 focus:ring-indigo-500/30 rounded-lg cursor-text hover:bg-slate-100/70 dark:hover:bg-slate-800/50 ${
                  task.isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              />
              {task.isRunning && (
                <span className="text-xs font-bold text-indigo-500 animate-pulse-soft uppercase tracking-wider mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Právě běží…
                </span>
              )}
              
              <div className="mt-2 flex items-center gap-3">
                <ProjectSelector 
                  compact 
                  selectedProjectId={task.trackerProjectId} 
                  onSelect={(projectId) => updateTask.mutate({ taskId: task.id, trackerProjectId: projectId })}
                />
                {task.jiraKey && (
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-500/10">
                    {task.jiraKey}
                  </span>
                )}
                {task.isAiSuggested && (
                  <button
                    onClick={() => updateTask.mutate({ taskId: task.id, isAiSuggested: false })}
                    title="Návrh od agenta — kliknutím potvrdíte"
                    className="group/sugg flex items-center gap-1 text-[10px] font-black text-violet-700 dark:text-violet-300 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-md border border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
                  >
                    <Sparkles size={11} className="group-hover/sugg:hidden" />
                    <Check size={11} className="hidden group-hover/sugg:block" />
                    Návrh AI
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 ml-auto">
              <div className={`font-mono text-3xl tabular-nums ${task.isRunning ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
                {formatFullTime(getDisplayTime(task))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTask.mutate(task.id)}
                  title={task.isRunning ? 'Pozastavit' : 'Spustit'}
                  aria-label={task.isRunning ? `Pozastavit měření úkolu ${task.name}` : `Spustit měření úkolu ${task.name}`}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-95 cursor-pointer select-none ${
                    task.isRunning
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-600 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400'
                  }`}
                >
                  {task.isRunning ? (
                    <Pause className="w-5 h-5" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                  )}
                </button>


                <Button
                  variant="icon"
                  onClick={() => resetTask.mutate(task.id)}
                  title="Resetovat"
                  aria-label={`Resetovat čas úkolu ${task.name}`}
                  icon={RotateCcw}
                  className="w-12 h-12"
                />

                <Button
                  variant="icon"
                  onClick={() => saveAsTemplateMutation.mutate(task)}
                  title="Uložit jako šablonu"
                  aria-label={`Uložit úkol ${task.name} jako šablonu`}
                  icon={LayoutTemplate}
                  className="w-12 h-12 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  isLoading={saveAsTemplateMutation.isPending && (saveAsTemplateMutation.variables as any)?.id === task.id}
                />

                <Button
                  variant="icon"
                  onClick={() => deleteTask.mutate(task.id)}
                  title="Smazat"
                  aria-label={`Smazat úkol ${task.name}`}
                  icon={Trash2}
                  className="w-12 h-12 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                />

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1" />

                <button
                  onClick={() => handleLogToJira(task)}
                  title="Zapsat do Jiry"
                  aria-label={`Zapsat úkol ${task.name} do Jiry`}
                  className="w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 active:scale-95 cursor-pointer select-none bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400"
                >
                  <Database className="w-5 h-5" />
                </button>

              </div>
            </div>
          </div>
        ))}

        {/* Integrated Add Task Input (Always the last row) */}
        <form 
          onSubmit={handleAddTask} 
          className="group flex items-center justify-between p-5 transition-all rounded-2xl glass-panel border-dashed border-slate-300 dark:border-slate-700 opacity-60 focus-within:opacity-100 focus-within:border-indigo-500/50 focus-within:scale-[1.005] focus-within:shadow-md"
        >
          <div className="flex-1 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Plus size={24} />
            </div>
            <Input
              type="text"
              variant="ghost"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Na čem budete pracovat?"
              aria-label="Název nového úkolu"
              className="flex-1 text-xl font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 border-none bg-transparent shadow-none ring-0 focus:ring-0"
            />
          </div>
          
          <div className="flex items-center gap-2" ref={templatesRef}>
            {templates.length > 0 && (
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Použít šablonu"
                  icon={LayoutTemplate}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsTemplatesOpen(!isTemplatesOpen)
                  }}
                  className="px-3 py-2 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
                
                {isTemplatesOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-2 z-[60] animate-in fade-in slide-in-from-bottom-1 duration-150 max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      Šablony úkolů
                    </div>
                    {templates.map((tpl: any) => {
                      const project = projects.find((p: any) => p.id === tpl.trackerProjectId)
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-lg transition-all flex flex-col gap-1 cursor-pointer"
                        >
                          <span>{tpl.name}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {project && (
                              <span 
                                className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border"
                                style={{ color: project.color, borderColor: `${project.color}33`, backgroundColor: `${project.color}10` }}
                              >
                                {project.name}
                              </span>
                            )}
                            {tpl.jiraKey && (
                              <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/10">
                                {tpl.jiraKey}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {newTaskName.trim() && (
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                Přidat úkol
              </Button>
            )}
          </div>
        </form>
      </div>

    </div>
  )
}
