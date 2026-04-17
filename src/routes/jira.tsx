import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Database, List, PlusCircle, Search, Clock, Calendar, Type, Loader2, CheckCircle2, Hash, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useState, useEffect, useRef } from 'react'
import { searchJiraIssuesFn, logTempoWorkloadFn, getRecentTicketsFn, getTempoWorklogsFn, deleteTempoWorklogFn } from '../services/jiraServer'
import { useSettings, getJiraCredentials } from '../store/settingsStore'
import { parseDurationToSeconds } from '../utils/duration'
import { toast } from '../store/toastStore'
import type { JiraIssue } from '../models/jira'

const jiraSearchSchema = z.object({
  view: z.enum(['list', 'create']).optional().catch('list'),
  description: z.string().optional(),
  duration: z.string().optional(),
})

export const Route = createFileRoute('/jira')({
  validateSearch: (search) => jiraSearchSchema.parse(search),
  component: JiraPage,
})

function IssueSelector({ onSelect, credentials, currentSelection }: {
  onSelect: (issue: JiraIssue | { key: string; fields: { summary: string } }) => void,
  credentials: any,
  currentSelection: string | null
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JiraIssue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync internal query with external selection
  useEffect(() => {
    if (currentSelection) {
      setQuery(currentSelection)
    }
  }, [currentSelection])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2 || query === currentSelection) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        // Search by summary or key across all projects
        const jql = `summary ~ "${query}*" OR key ~ "${query}*"`
        // @ts-ignore - Ignoring type issue with server function input
        const issues = await searchJiraIssuesFn({ data: { credentials, jql, maxResults: 10 } })
        setResults(issues)
        setIsOpen(true)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, credentials, currentSelection])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Hledat ticket (klíč nebo název)..."
          className="w-full bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-lg font-medium shadow-sm"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden backdrop-blur-xl bg-opacity-95">
          {results.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => {
                onSelect(issue)
                setQuery(issue.key)
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{issue.key}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{issue.fields.summary}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RecentIssuesSelector({ onSelect }: { onSelect: (ticket: { key: string; summary: string }) => void }) {
  const [recent, setRecent] = useState<{ key: string; summary: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await getRecentTicketsFn()
        setRecent(data)
      } catch (error) {
        console.error('Failed to fetch recent tickets:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecent()
  }, [])

  if (isLoading || !recent || recent.length === 0) return null

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
        <Hash className="w-4 h-4" /> Poslední tickety
      </label>
      <div className="flex flex-wrap gap-2">
        {recent.map((ticket) => (
          <button
            key={ticket.key}
            type="button"
            onClick={() => onSelect(ticket)}
            className="group relative px-4 py-3 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-2 hover:ring-blue-500 rounded-2xl transition-all active:scale-95 shadow-sm text-left flex flex-col"
          >
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase">{ticket.key}</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-1 max-w-[120px]">{ticket.summary}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function WorklogForm() {
  const { settings } = useSettings()
  const credentials = getJiraCredentials(settings)
  const search = useSearch({ from: '/jira' })
  
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [duration, setDuration] = useState(search.duration || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0])
  const [description, setDescription] = useState(search.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync state if search params change
  useEffect(() => {
    if (search.duration) setDuration(search.duration)
    if (search.description) setDescription(search.description)
  }, [search.duration, search.description])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIssue) {
      toast.error('Vyberte prosím ticket')
      return
    }

    const seconds = parseDurationToSeconds(duration)
    if (seconds <= 0) {
      toast.error('Neplatný formát času (např. 1h 30m)')
      return
    }

    setIsSubmitting(true)
    try {
      // @ts-ignore - Ignoring type issue with server function input
      await logTempoWorkloadFn({
        data: {
          credentials,
          worklogData: {
            issueId: selectedIssue.id,
            issueKey: selectedIssue.key,
            timeSpentSeconds: seconds,
            startDate: date,
            startTime: time,
            description,
          },
        },
      })
      toast.success('Práce byla úspěšně zapsána do Jira/Tempo')
      // Reset form
      setSelectedIssue(null)
      setDuration('')
      setDescription('')
    } catch (error) {
      console.error('Submission failed:', error)
      toast.error('Nepodařilo se zapsat práci. Zkontrolujte nastavení API klíčů.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecentSelect = (ticket: { key: string; summary: string }) => {
    setSelectedIssue({
      key: ticket.key,
      fields: { summary: ticket.summary }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4" /> Hledat Ticket
          </label>
          <IssueSelector
            credentials={credentials}
            onSelect={setSelectedIssue}
            currentSelection={selectedIssue?.key || null}
          />
        </div>

        <RecentIssuesSelector onSelect={handleRecentSelect} />
      </div>

      {selectedIssue && (
        <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-2xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-blue-500/20 shadow-sm">
          <CheckCircle2 className="w-5 h-5" />
          Vybráno: <span className="font-black">{selectedIssue.key}</span> - <span className="opacity-80 font-medium">{selectedIssue.fields.summary}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="space-y-3 w-full md:w-48">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" /> Čas (např. 1h 30m)
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="1h 20m"
            className="w-full bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 px-4 outline-none transition-all font-medium"
          />
        </div>

        <div className="space-y-3 flex-1 md:max-w-md">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Datum a Čas
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 min-w-0 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 px-4 outline-none transition-all font-medium"
            />
            <input
              type="time"
              value={time}
              step="1"
              onChange={(e) => setTime(e.target.value)}
              className="w-44 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl py-3 px-4 outline-none transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Type className="w-4 h-4" /> Popis práce
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Co jste dělali?"
          rows={4}
          className="w-full bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-2xl py-4 px-4 outline-none transition-all font-medium resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !selectedIssue || !duration}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3
          ${isSubmitting || !selectedIssue || !duration
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-[0.98]'
          }`}
      >
        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <PlusCircle className="w-6 h-6" />}
        {isSubmitting ? 'Zapisuji...' : 'Zapsat práci'}
      </button>
    </form>
  )
}

function WorklogList({ credentials, filter }: { credentials: any, filter: 'month' | 'all' }) {
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchWorklogs = async () => {
      setIsLoading(true)
      try {
        const now = new Date()
        let from, to
        if (filter === 'month') {
          from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        } else {
          // Default to last 30 days if 'all'
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          to = now.toISOString().split('T')[0]
        }
        
        // @ts-ignore
        const results = await getTempoWorklogsFn({ data: { credentials, from, to } })
        setWorklogs(results || [])
      } catch (error) {
        console.error('Failed to fetch worklogs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWorklogs()
  }, [credentials, filter])

  const handleDelete = async (worklogId: number) => {
    if (!window.confirm('Opravdu chcete smazat tento výkaz?')) return
    
    try {
      // @ts-ignore
      await deleteTempoWorklogFn({ data: { credentials, worklogId } })
      setWorklogs(prev => prev.filter(log => (log.tempoWorklogId || log.tempoId) !== worklogId))
      toast.success('Výkaz byl smazán')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Nepodařilo se smazat výkaz')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Načítám výkazy z Tempo...</p>
      </div>
    )
  }

  // Filter worklogs locally
  const filteredWorklogs = worklogs.filter(log => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      log.issue.key.toLowerCase().includes(q) ||
      (log.issue.summary || '').toLowerCase().includes(q) ||
      (log.description || '').toLowerCase().includes(q)
    )
  })

  if (!worklogs || worklogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800">
          <Clock className="w-8 h-8 text-slate-400 opacity-40" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Žádné výkazy</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          V tomto období nebyly nalezeny žádné záznamy v Tempo.
        </p>
      </div>
    )
  }

  // Group filtered worklogs by date
  const groupedWorklogs = filteredWorklogs.reduce((acc, log) => {
    const date = log.startDate
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, any[]>)

  const sortedDates = Object.keys(groupedWorklogs).sort((a, b) => b.localeCompare(a))

  const formatDailyTotal = (logs: any[]) => {
    const totalSeconds = logs.reduce((sum, log) => sum + log.timeSpentSeconds, 0)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('cs-CZ', { weekday: 'long' }).format(date)
  }

  return (
    <div className="space-y-12">
      {/* List Search Input */}
      <div className="relative px-6 pt-2">
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hledat ve výkazech (klíč, název nebo popis)..."
          className="w-full bg-slate-50 dark:bg-slate-900/50 ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-blue-500 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-lg font-medium shadow-sm"
        />
      </div>

      <div className="space-y-12 p-6 pt-0">
        {filteredWorklogs.length === 0 && searchQuery && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="text-slate-300 dark:text-slate-700 mb-4 flex justify-center">
              <Search className="w-16 h-16 opacity-20" />
            </div>
            <p className="text-slate-500 font-bold text-lg">Žádné výsledky pro "{searchQuery}"</p>
          </div>
        )}
        
        {sortedDates.map((date) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                  {date === new Date().toISOString().split('T')[0] ? 'Dnes' : getDayName(date)}
                </h3>
                <span className="text-sm font-bold text-slate-400 font-mono">{date}</span>
              </div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-black text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
                Celkem: {formatDailyTotal(groupedWorklogs[date])}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {groupedWorklogs[date].map((log) => (
                <div key={log.tempoId || log.tempoWorklogId} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl shadow-sm hover:ring-2 hover:ring-blue-500/50 transition-all group">
                  <div className="flex gap-5 items-center">
                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black rounded-lg border border-blue-100 dark:border-blue-900/30 uppercase tracking-tighter">
                      {log.issue.key}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {log.description || <span className="italic opacity-50">Bez popisu</span>}
                      </div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {log.startTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-4">
                    <button
                      onClick={() => handleDelete(log.tempoWorklogId || log.tempoId)}
                      className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-400 hover:text-red-500 transition-all rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 ring-1 ring-transparent hover:ring-red-500/20"
                      title="Smazat výkaz"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                        {Math.floor(log.timeSpentSeconds / 3600)}h {Math.floor((log.timeSpentSeconds % 3600) / 60)}m
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Duration</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function JiraPage() {
  const search = useSearch({ from: '/jira' })
  const navigate = useNavigate({ from: '/jira' })
  
  const activeTab = search.view || 'list'
  
  const setActiveTab = (view: 'list' | 'create') => {
    navigate({
      search: (prev) => ({ ...prev, view }),
    })
  }

  const { settings } = useSettings()
  const credentials = getJiraCredentials(settings)

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center ring-1 ring-blue-500/20">
            <Database className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gradient">Jira</h1>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Manage your Jira tasks and time logging.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit mb-8 ring-1 ring-slate-200 dark:ring-slate-800">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'list'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <List className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wide">List</span>
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'create'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wide">Vytvořit</span>
        </button>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-3xl min-h-[400px]">
        {activeTab === 'list' ? (
          <div className="p-8 h-full">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-2 px-1">Období:</span>
              <button
                onClick={() => setFilter('month')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all active:scale-95 ${filter === 'month'
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm'
                  }`}
              >
                Tento měsíc
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all active:scale-95 ${filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm'
                  }`}
              >
                Předchozích 30 dní
              </button>
            </div>

            <WorklogList credentials={credentials} filter={filter} />
          </div>
        ) : (
          <WorklogForm />
        )}
      </div>
    </div>
  )
}
