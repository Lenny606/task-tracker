import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Timer, LayoutGrid, Database, Loader2, ExternalLink } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { useIsMounted } from '../hooks/useIsMounted'
import { getTempoWorklogsFn } from '../services/jiraServer'
import { useSettings, getJiraCredentials } from '../store/settingsStore'
import { toast } from '../store/toastStore'

export const Route = createFileRoute('/tempo-calendar')({
  component: TempoCalendarPage,
})

function TempoCalendarPage() {
  const isMounted = useIsMounted()
  const { settings } = useSettings()
  const credentials = useMemo(() => getJiraCredentials(settings), [settings])
  
  // State for the currently viewed week's Monday
  const [baseDate, setBaseDate] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const [isLoading, setIsLoading] = useState(true)
  const [worklogsByDate, setWorklogsByDate] = useState<Record<string, any[]>>({})

  const weekDates = useMemo(() => {
    const dates = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate)
      d.setDate(baseDate.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }, [baseDate])

  useEffect(() => {
    const fetchWorklogs = async () => {
      if (!credentials.url || !credentials.tempoApiKey) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const from = weekDates[0]
        const to = weekDates[4]
        
        // @ts-ignore
        const results = await getTempoWorklogsFn({ data: { credentials, from, to } })
        
        const grouped = (results || []).reduce((acc: any, log: any) => {
          const date = log.startDate
          if (!acc[date]) acc[date] = []
          acc[date].push(log)
          return acc
        }, {})

        setWorklogsByDate(grouped)
      } catch (error) {
        console.error('Failed to fetch Tempo worklogs:', error)
        toast.error('Nepodařilo se načíst výkazy z Tempo')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorklogs()
  }, [baseDate, credentials, weekDates])

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

  // Calculate total week time
  const totalWeekSeconds = useMemo(() => {
    return Object.values(worklogsByDate).flat().reduce((sum, log) => sum + log.timeSpentSeconds, 0)
  }, [worklogsByDate])

  if (!isMounted) return null

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
                Tempo Calendar
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-500/20">
                  Jira Worklogs
                </span>
                {totalWeekSeconds > 0 && (
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Week Total: {formatTime(totalWeekSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 self-start lg:self-auto">
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold text-lg">Fetching worklogs from Tempo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {weekDates.map((dateString) => {
            const dayWorklogs = worklogsByDate[dateString] || []
            const dailyTotal = dayWorklogs.reduce((sum, log) => sum + log.timeSpentSeconds, 0)
            const date = new Date(dateString)
            const isToday = dateString === new Date().toISOString().split('T')[0]

            return (
              <div 
                key={dateString} 
                className={`flex flex-col h-full glass-panel rounded-3xl overflow-hidden border-2 transition-all group ${
                  isToday 
                    ? 'border-blue-500/50 ring-4 ring-blue-500/5 shadow-xl scale-[1.02] z-10' 
                    : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className={`p-5 border-b flex items-center justify-between ${
                  isToday ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
                }`}>
                  <div>
                    <h3 className={`font-bold text-xl ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                      {date.toLocaleDateString(undefined, { weekday: 'long' })}
                    </h3>
                    <span className="text-sm font-medium text-slate-500">
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {dailyTotal > 0 && (
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 ${
                      isToday ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Clock size={14} />
                      {formatTime(dailyTotal)}
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 space-y-3 min-h-[400px] overflow-y-auto">
                  {dayWorklogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Timer className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-sm text-slate-500">No worklogs found</p>
                    </div>
                  ) : (
                    dayWorklogs.map((log) => (
                      <div
                        key={log.tempoId || log.tempoWorklogId}
                        className="block p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-blue-500/30 transition-all group/task"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded border border-blue-500/10 uppercase tracking-tighter">
                            {log.issue.key}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {log.startTime}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 line-clamp-3 leading-snug">
                          {log.description || <span className="italic opacity-50 font-medium">No description</span>}
                        </h4>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white font-mono">
                            {formatTime(log.timeSpentSeconds)}
                          </div>
                          {settings.jiraUrl && (
                            <a 
                              href={`${settings.jiraUrl.replace(/\/$/, '')}/browse/${log.issue.key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-300 hover:text-blue-500 rounded-lg transition-all"
                              title="Open in Jira"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                  <Link
                    to="/jira"
                    search={{ view: 'list' }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 hover:text-blue-600 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <LayoutGrid size={16} />
                    View Jira List
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
