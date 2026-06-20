import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Database, List, PlusCircle, Search, Clock, Type, Loader2, CheckCircle2, Hash, Trash2, ExternalLink, RotateCcw, Briefcase, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { logTempoWorkloadFn, getRecentTicketsFn, getTempoWorklogsFn, deleteTempoWorklogFn } from '../services/jiraServer'
import { useSettings } from '../store/settingsStore'
import { parseDurationToSeconds } from '../utils/duration'
import { unescapeHtml } from '../utils/sanitize'
import { toast } from '../store/toastStore'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

const jiraSearchSchema = z.object({
  view: z.enum(['list', 'create']).optional().catch('list'),
  description: z.string().optional(),
  duration: z.string().optional(),
  issueKey: z.string().optional(),
  issueSummary: z.string().optional(),
  date: z.string().optional(),
  period: z.enum(['month', 'all']).optional().catch('month'),
})

export const Route = createFileRoute('/jira')({
  validateSearch: (search) => jiraSearchSchema.parse(search),
  component: JiraPage,
})

import { JiraIssueSelector } from '../components/JiraIssueSelector'
import { ProjectSelector } from '../components/ProjectSelector'

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
        <Hash className="w-4 h-4" /> Recent Issues
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
  const search = useSearch({ from: '/jira' })
  
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [duration, setDuration] = useState(search.duration || '')
  const [date, setDate] = useState(search.date || new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0])
  const [description, setDescription] = useState(search.description ? unescapeHtml(search.description) : '')
  const [trackerProjectId, setTrackerProjectId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleReset = () => {
    setSelectedIssue(null)
    setDuration('')
    setDescription('')
    navigate({
      search: { view: 'create' }
    })
  }

  // Sync state if search params change
  useEffect(() => {
    if (search.duration) setDuration(search.duration)
    if (search.description) setDescription(unescapeHtml(search.description))
    if (search.date) setDate(search.date)
    if (search.issueKey && !selectedIssue) {
      setSelectedIssue({
        key: search.issueKey,
        fields: { summary: search.issueSummary ? unescapeHtml(search.issueSummary) : '' }
      })
    }
  }, [search.duration, search.description, search.date, search.issueKey, search.issueSummary])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIssue) {
      toast.error('Please select an issue')
      return
    }

    const seconds = parseDurationToSeconds(duration)
    if (seconds <= 0) {
      toast.error('Invalid time format (e.g., 1h 30m)')
      return
    }

    setIsSubmitting(true)
    try {
      // @ts-ignore - Ignoring type issue with server function input
      await logTempoWorkloadFn({
        data: {
          worklogData: {
            issueId: selectedIssue.id,
            issueKey: selectedIssue.key,
            timeSpentSeconds: seconds,
            startDate: date,
            startTime: time,
            description,
            trackerProjectId,
          },
        },
      })
      toast.success('Work logged successfully in Jira/Tempo')
      // Reset form
      setSelectedIssue(null)
      setDuration('')
      setDescription('')
    } catch (error) {
      console.error('Submission failed:', error)
      toast.error('Failed to log work. Check your API key settings.')
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
    <form onSubmit={handleSubmit} className="relative p-8 space-y-8 max-w-4xl mx-auto">
      <div className="absolute top-8 right-8 flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/summary', search: { date } })}
          icon={ArrowLeft}
          className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl ring-1 ring-transparent hover:ring-blue-500/20 border-none bg-transparent"
          title="Back to Daily Summary"
        >
          Back to Summary
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
          icon={RotateCcw}
          className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl ring-1 ring-transparent hover:ring-red-500/20 border-none bg-transparent"
          title="Reset Form"
        >
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Search className="w-4 h-4" /> Search Issue
          </label>
          <JiraIssueSelector
            onSelect={setSelectedIssue}
            currentSelection={selectedIssue?.key || null}
          />
        </div>

        <RecentIssuesSelector onSelect={handleRecentSelect} />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
          <Briefcase className="w-4 h-4" /> Tracker Project (Internal)
        </label>
        <ProjectSelector 
          selectedProjectId={trackerProjectId} 
          onSelect={setTrackerProjectId} 
        />
      </div>

      {selectedIssue && (
        <div className="flex items-center justify-between px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-2xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-blue-500/20 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Selected: <span className="font-black">{selectedIssue.key}</span> - <span className="opacity-80 font-medium">{selectedIssue.fields.summary}</span>
          </div>
          {settings.jiraUrl && (
            <a 
              href={`${settings.jiraUrl.replace(/\/$/, '')}/browse/${selectedIssue.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Jira
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-48">
          <Input
            type="text"
            label="Time (e.g., 1h 30m)"
            icon={Clock}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="1h 20m"
            variant="filled"
          />
        </div>

        <div className="flex-1 md:max-w-md space-y-1.5 text-left">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
            Date and Time
          </label>
          <div className="flex gap-2">
            <Input
              type="date"
              variant="filled"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Input
              type="time"
              value={time}
              step="1"
              onChange={(e) => setTime(e.target.value)}
              className="w-44"
              variant="filled"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Type className="w-4 h-4" /> Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What were you working on?"
          rows={4}
          className="w-full bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-2xl py-4 px-4 outline-none transition-all font-medium resize-none"
        />
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!selectedIssue || !duration}
        variant="primary"
        className="w-full py-4 rounded-2xl font-bold text-lg bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/25 border-none"
        icon={PlusCircle}
      >
        Log Work
      </Button>
    </form>
  )
}

function WorklogList({ filter }: { filter: 'month' | 'all' }) {
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { settings } = useSettings()

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
        
        const results = await getTempoWorklogsFn({ data: { from, to } })
        setWorklogs(results || [])
      } catch (error) {
        console.error('Failed to fetch worklogs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWorklogs()
  }, [filter])

  const handleDelete = async (worklogId: number) => {
    if (!window.confirm('Are you sure you want to delete this worklog?')) return
    
    try {
      await deleteTempoWorklogFn({ data: { worklogId } })
      setWorklogs(prev => prev.filter(log => (log.tempoWorklogId || log.tempoId) !== worklogId))
      toast.success('Worklog deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete worklog')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading worklogs from Tempo...</p>
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No worklogs</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          No worklog records found in Tempo for this period.
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
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }

  return (
    <div className="space-y-12">
      {/* List Search Input */}
      <div className="px-6 pt-2">
        <Input
          type="text"
          icon={Search}
          size="lg"
          variant="filled"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in worklogs (key, title or description)..."
          className="text-lg font-medium shadow-sm"
        />
      </div>

      <div className="space-y-12 p-6 pt-0">
        {filteredWorklogs.length === 0 && searchQuery && (
          <div className="text-center py-20 animate-in fade-in duration-500">
            <div className="text-slate-300 dark:text-slate-700 mb-4 flex justify-center">
              <Search className="w-16 h-16 opacity-20" />
            </div>
            <p className="text-slate-500 font-bold text-lg">No results for "{searchQuery}"</p>
          </div>
        )}
        
        {sortedDates.map((date) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                  {date === new Date().toISOString().split('T')[0] ? 'Today' : getDayName(date)}
                </h3>
                <span className="text-sm font-bold text-slate-400 font-mono">{date}</span>
              </div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-black text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
                Total: {formatDailyTotal(groupedWorklogs[date])}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {groupedWorklogs[date].map((log) => (
                <div key={log.tempoId || log.tempoWorklogId} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl shadow-sm hover:ring-2 hover:ring-blue-500/50 transition-all group">
                  <div className="flex gap-5 items-center min-w-0">
                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black rounded-lg border border-blue-100 dark:border-blue-900/30 uppercase tracking-tighter shrink-0">
                      {log.issue.key}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {log.description || <span className="italic opacity-50">No description</span>}
                      </div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {log.startTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-4">
                    {settings.jiraUrl && (
                      <a
                        href={`${settings.jiraUrl.replace(/\/$/, '')}/browse/${log.issue.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 outline-none active:scale-95"
                        title="Open in Jira"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                    <Button
                      variant="icon"
                      onClick={() => handleDelete(log.tempoWorklogId || log.tempoId)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ring-1 ring-transparent hover:ring-red-500/20"
                      title="Delete worklog"
                      icon={Trash2}
                    />
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
      search: (prev) => {
        if (view === 'list') {
          return { view, period: prev.period || 'month' }
        }
        return { ...prev, view }
      },
    })
  }

  const setPeriod = (period: 'month' | 'all') => {
    navigate({
      search: (prev) => ({ ...prev, period }),
    })
  }

  const activePeriod = search.period || 'month'

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <PageHeader
        title="Jira"
        description="Manage your Jira tasks and time logging."
        icon={Database}
        iconColor="text-blue-500"
        gradientFrom="from-blue-500/20"
        gradientTo="to-indigo-500/20"
      />

      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit mb-8 ring-1 ring-slate-200 dark:ring-slate-800">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('list')}
          icon={List}
          className={`px-6 py-2.5 rounded-xl border-none ${activeTab === 'list'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent'
            }`}
        >
          <span className="font-bold text-sm tracking-wide">List</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('create')}
          icon={PlusCircle}
          className={`px-6 py-2.5 rounded-xl border-none ${activeTab === 'create'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent'
            }`}
        >
          <span className="font-bold text-sm tracking-wide">Create</span>
        </Button>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-3xl min-h-[400px]">
        {activeTab === 'list' ? (
          <div className="p-8 h-full">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-2 px-1">Period:</span>
              <Button
                variant={activePeriod === 'month' ? 'primary' : 'ghost'}
                onClick={() => setPeriod('month')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black border-none ${activePeriod === 'month'
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm'
                  }`}
              >
                This Month
              </Button>
              <Button
                variant={activePeriod === 'all' ? 'primary' : 'ghost'}
                onClick={() => setPeriod('all')}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black border-none ${activePeriod === 'all'
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm'
                  }`}
              >
                Last 30 Days
              </Button>
            </div>

            <WorklogList filter={activePeriod} />
          </div>
        ) : (
          <WorklogForm />
        )}
      </div>
    </div>
  )
}
