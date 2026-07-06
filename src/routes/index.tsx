import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Play, Pause, Plus, RotateCcw, Trash2, CheckCircle2, Circle, Database, Sparkles, Check } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useTaskMonitor } from '../hooks/useTaskMonitor'
import { useIsMounted } from '../hooks/useIsMounted'
import { formatSecondsToDuration } from '../utils/duration'
import { ProjectSelector } from '../components/ProjectSelector'
import { Button } from '../components/Button'
import { Input } from '../components/Input'


export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { tasks, addTask, toggleTask, toggleMarked, resetTask, deleteTask, updateTask, getDisplayTime } = useTasks()
  const isMounted = useIsMounted()
  const navigate = useNavigate()
  useTaskMonitor()
  const [newTaskName, setNewTaskName] = useState('')

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gradient">
          Daily Tasks
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Track your time and stay productive.
        </p>
      </header>

      {/* Tasks List */}
      <div className="space-y-4">
        {!isMounted ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-50">
            <p className="text-slate-500">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-500">No tasks for today yet. Add one below!</p>
          </div>
        ) : tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center justify-between p-5 transition-all duration-300 rounded-2xl glass-panel relative hover:z-50 focus-within:z-50 ${
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
                className={`font-semibold text-xl px-2 -ml-2 transition-all w-full outline-none border-none shadow-none ring-0 focus:ring-2 focus:ring-indigo-500/30 rounded-lg ${
                  task.isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              />
              {task.isRunning && (
                <span className="text-xs font-bold text-indigo-500 animate-pulse-soft uppercase tracking-wider mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Currently Tracking...
                </span>
              )}
              
              <div className="mt-2 flex items-center gap-3">
                <ProjectSelector 
                  compact 
                  selectedProjectId={task.trackerProjectId} 
                  onSelect={(projectId) => updateTask.mutate({ taskId: task.id, trackerProjectId: projectId })}
                />
                {task.jiraKey && (
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-500/10">
                    {task.jiraKey}
                  </span>
                )}
                {task.isAiSuggested && (
                  <button
                    onClick={() => updateTask.mutate({ taskId: task.id, isAiSuggested: false })}
                    title="Návrh od agenta — kliknutím potvrdíte"
                    className="group/sugg flex items-center gap-1 text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-md border border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
                  >
                    <Sparkles size={11} className="group-hover/sugg:hidden" />
                    <Check size={11} className="hidden group-hover/sugg:block" />
                    Návrh AI
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className={`font-mono text-3xl tabular-nums ${task.isRunning ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
                {formatTime(getDisplayTime(task))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTask.mutate(task.id)}
                  title={task.isRunning ? 'Pause' : 'Start'}
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
                  title="Reset"
                  icon={RotateCcw}
                  className="w-12 h-12"
                />

                <Button
                  variant="icon"
                  onClick={() => deleteTask.mutate(task.id)}
                  title="Delete"
                  icon={Trash2}
                  className="w-12 h-12 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                />

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1" />

                <button
                  onClick={() => handleLogToJira(task)}
                  title="Log to Jira"
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
              placeholder="What are you working on next?"
              className="flex-1 text-xl font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 border-none bg-transparent shadow-none ring-0 focus:ring-0"
            />
          </div>
          
          {newTaskName.trim() && (
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              Add Task
            </Button>
          )}
        </form>
      </div>

    </div>
  )
}
