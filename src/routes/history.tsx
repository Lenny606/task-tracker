import { createFileRoute, Link } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { Calendar, ChevronRight, Clock, Timer } from 'lucide-react'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const { history } = useTasks()
  
  const sortedDates = Object.keys(history).sort().reverse()

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gradient">
          History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Review your past productivity and achievements.
        </p>
      </header>

      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No history recorded yet.</p>
          </div>
        ) : (
          sortedDates.map((date) => {
            const dayTasks = history[date]
            const totalSeconds = dayTasks.reduce((acc, t) => acc + t.totalSeconds, 0)
            const taskCount = dayTasks.length
            
            return (
              <Link
                key={date}
                to="/summary"
                search={{ date }}
                className="group block glass-panel p-6 rounded-3xl hover:scale-[1.01] transition-all border-transparent hover:border-indigo-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                      <Calendar className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {new Date(date).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Timer className="w-4 h-4" />
                          {formatTime(totalSeconds)}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                    <ChevronRight size={32} />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
