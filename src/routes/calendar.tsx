import { createFileRoute, Link } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Timer, LayoutGrid } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useIsMounted } from '../hooks/useIsMounted'

export const Route = createFileRoute('/calendar')({
  component: CalendarPage,
})

function CalendarPage() {
  const isMounted = useIsMounted()
  const { history } = useTasks()
  
  // State for the currently viewed week's Monday
  const [baseDate, setBaseDate] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const weekDates = useMemo(() => {
    const dates = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
    }
    return dates
  }, [baseDate])

  const navigateWeek = (weeks: number) => {
    const newDate = new Date(baseDate)
    newDate.setDate(baseDate.getDate() + (weeks * 7))
    setBaseDate(newDate)
  }

  const resetToToday = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    setBaseDate(monday)
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0) return `${m}m`
    return `${h}h ${m}m`
  }

  const weekRangeString = useMemo(() => {
    const first = new Date(weekDates[0])
    const last = new Date(weekDates[4])
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${first.toLocaleDateString(undefined, options)} - ${last.toLocaleDateString(undefined, options)}, ${last.getFullYear()}`
  }, [weekDates])

  if (!isMounted) return null

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
              Weekly Calendar
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Focus on your work week and track your progress across days.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400"
            title="Previous Week"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="px-4 py-1 text-center min-w-[200px]">
            <span className="font-bold text-slate-700 dark:text-slate-200 block">
              {weekRangeString}
            </span>
          </div>

          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400"
            title="Next Week"
          >
            <ChevronRight size={24} />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:border-slate-800 mx-1" />

          <button
            onClick={resetToToday}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all text-sm"
          >
            Today
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {weekDates.map((dateString) => {
          const dayData = history[dateString]
          const tasks = dayData?.tasks || []
          const totalSeconds = tasks.reduce((acc, t) => acc + t.totalSeconds, 0)
          const date = new Date(dateString)
          const year = new Date().getFullYear()
          const month = String(new Date().getMonth() + 1).padStart(2, '0')
          const dayNum = String(new Date().getDate()).padStart(2, '0')
          const todayStr = `${year}-${month}-${dayNum}`
          const isToday = dateString === todayStr

          return (
            <div 
              key={dateString} 
              className={`flex flex-col h-full glass-panel rounded-3xl overflow-hidden border-2 transition-all group ${
                isToday 
                  ? 'border-indigo-500/50 ring-4 ring-indigo-500/5 shadow-xl scale-[1.02] z-10' 
                  : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
              }`}
            >
              <div className={`p-5 border-b flex items-center justify-between ${
                isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
              }`}>
                <div>
                  <h3 className={`font-bold text-xl ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {date.toLocaleDateString(undefined, { weekday: 'long' })}
                  </h3>
                  <span className="text-sm font-medium text-slate-500">
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {totalSeconds > 0 && (
                  <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 ${
                    isToday ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Clock size={14} />
                    {formatTime(totalSeconds)}
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 space-y-3 min-h-[400px] overflow-y-auto">
                {tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Timer className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-sm text-slate-500">No tasks recorded</p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <Link
                      key={task.id}
                      to="/summary"
                      search={{ date: dateString }}
                      className="block p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-indigo-500/30 transition-all group/task"
                    >
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 line-clamp-2 transition-colors group-hover/task:text-indigo-600 dark:group-hover/task:text-indigo-400">
                        {task.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Timer size={12} className="text-indigo-500" />
                          {formatTime(task.totalSeconds)}
                        </span>
                        {task.isMarked && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                <Link
                  to="/summary"
                  search={{ date: dateString }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                >
                  <LayoutGrid size={16} />
                  View Day Details
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
