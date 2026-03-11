import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Play, Pause, Plus, RotateCcw, Trash2, Clock } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { tasks, addTask, toggleTask, resetTask, deleteTask, getDisplayTime } = useTasks()
  const [newTaskName, setNewTaskName] = useState('')

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskName.trim()) return
    addTask.mutate(newTaskName)
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
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center justify-between p-5 transition-all rounded-2xl glass-panel ${
              task.isRunning
                ? 'ring-4 ring-indigo-500/10 scale-[1.01] border-indigo-500/50'
                : 'hover:scale-[1.005] border-transparent'
            }`}
          >
            <div className="flex flex-col">
              <span className={`font-semibold text-xl ${task.isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {task.name}
              </span>
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
