import { createFileRoute } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { BarChart3, Clock, CheckCircle2, Timer } from 'lucide-react'

export const Route = createFileRoute('/summary')({
  component: SummaryPage,
})

function SummaryPage() {
  const { tasks, getDisplayTime } = useTasks()

  const liveTasks = tasks.map(t => ({
    ...t,
    displaySeconds: getDisplayTime(t)
  }))

  const totalSeconds = liveTasks.reduce((acc, t) => acc + t.displaySeconds, 0)
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const formatFullTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gradient">
          Daily Summary
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Overview of your productivity today.
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
            <Timer className="w-6 h-6" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Time Tracked</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatTime(totalSeconds)}</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tasks Worked On</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{tasks.length}</div>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Average per Task</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {tasks.length > 0 ? formatTime(Math.floor(totalSeconds / tasks.length)) : '0h 0m'}
          </div>
        </div>
      </div>


      {/* Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Task Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Duration</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {liveTasks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    No data available for today.
                  </td>
                </tr>
              ) : (
                liveTasks.map((task) => {
                  const percentage = totalSeconds > 0 ? (task.displaySeconds / totalSeconds) * 100 : 0
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{task.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400">{formatFullTime(task.displaySeconds)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-500 w-10 text-right">{Math.round(percentage)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

