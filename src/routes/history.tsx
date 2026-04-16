import { createFileRoute, Link } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { Calendar, ChevronRight, Clock, Timer, Trash2, BarChart3, ListFilter } from 'lucide-react'
import { useState } from 'react'
import { useIsMounted } from '../hooks/useIsMounted'

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const { history, deleteHistoryDay } = useTasks()
  const [filter, setFilter] = useState<'current' | 'all'>('current')
  const isMounted = useIsMounted()
  
  const sortedDates = Object.keys(history).sort().reverse()
  
  const now = new Date()
  const currentPrefix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

  const filteredDates = sortedDates.filter(date => {
    if (filter === 'all') return true
    return date.startsWith(currentPrefix)
  })

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
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
          Review your past productivity and achievements.
        </p>

        <div className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setFilter('current')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
              filter === 'current' 
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            This Month
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
              filter === 'all' 
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            All History
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {!isMounted || filteredDates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {!isMounted ? 'Loading history...' : 'No history found for the selected period.'}
            </p>
          </div>
        ) : (
          filteredDates.map((date) => {
            const dayData = history[date]
            const tasks = dayData?.tasks || []
            const totalSeconds = tasks.reduce((acc, t) => acc + t.totalSeconds, 0)
            const taskCount = tasks.length
            
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
                        <span className="flex items-center gap-1.5" title="Tasks time">
                          <Timer className="w-4 h-4" />
                          {formatTime(totalSeconds)}
                        </span>
                        {dayData?.globalTimer && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                            <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400" title="Global time">
                              <Clock className="w-4 h-4" />
                              {formatTime(dayData.globalTimer.totalSeconds)}
                            </span>
                          </>
                        )}
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1.5" title="Task count">
                          <BarChart3 className="w-4 h-4" />
                          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (confirm(`Are you sure you want to delete the history for ${date}?`)) {
                          deleteHistoryDay.mutate(date)
                        }
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all z-10 relative"
                      title="Delete day"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                      <ChevronRight size={32} />
                    </div>
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
