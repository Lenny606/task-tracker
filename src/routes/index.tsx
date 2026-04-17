import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Play, Pause, Plus, RotateCcw, Trash2, Clock, CheckCircle2, Circle, Database } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useTaskMonitor } from '../hooks/useTaskMonitor'
import { useIsMounted } from '../hooks/useIsMounted'
import { formatSecondsToDuration } from '../utils/duration'


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
        duration: formatSecondsToDuration(time)
      }
    })
  }


  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskName.trim()) return
    addTask.mutate({ name: newTaskName })
    setNewTaskName('')
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
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
            className={`group flex items-center justify-between p-5 transition-all duration-300 rounded-2xl glass-panel ${
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
            <div className="flex flex-col flex-1">
              <input
                type="text"
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
                className={`font-semibold text-xl bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 -ml-2 transition-all ${
                  task.isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                }`}
              />
              {task.isRunning && (
                <span className="text-xs font-bold text-indigo-500 animate-pulse-soft uppercase tracking-wider mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Currently Tracking...
                </span>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className={`font-mono text-3xl tabular-nums ${task.isRunning ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'}`}>
                {formatTime(getDisplayTime(task))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTask.mutate(task.id)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
                    task.isRunning
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                  }`}
                  title={task.isRunning ? 'Pause' : 'Start'}
                >
                  {task.isRunning ? <Pause className="fill-current" size={20} /> : <Play className="fill-current ml-1" size={20} />}
                </button>

                <button
                  onClick={() => resetTask.mutate(task.id)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-all active:scale-90"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => deleteTask.mutate(task.id)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all active:scale-90"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1" />

                <button
                  onClick={() => handleLogToJira(task)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-all active:scale-90"
                  title="Log to Jira"
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
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="What are you working on next?"
              className="flex-1 bg-transparent border-none outline-none text-xl font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>
          
          {newTaskName.trim() && (
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              Add Task
            </button>
          )}
        </form>
      </div>

    </div>
  )
}
