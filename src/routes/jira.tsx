import { createFileRoute } from '@tanstack/react-router'
import { Database, List, PlusCircle, Search, Clock, Calendar, Type, Loader2, CheckCircle2, Hash } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { searchJiraIssuesFn, logTempoWorkloadFn } from '../services/jiraServer'
import { useSettings, getJiraCredentials } from '../store/settingsStore'
import { parseDurationToSeconds } from '../utils/duration'
import { toast } from '../store/toastStore'
import type { JiraIssue } from '../models/jira'

export const Route = createFileRoute('/jira')({
  component: JiraPage,
})

function IssueSelector({ onSelect, credentials }: { onSelect: (issue: JiraIssue) => void, credentials: any }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JiraIssue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    if (query.length < 2) {
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
  }, [query, credentials])

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

function WorklogForm() {
  const { settings } = useSettings()
  const credentials = getJiraCredentials(settings)
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null)
  const [duration, setDuration] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0])
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Hash className="w-4 h-4" /> Jira Ticket
        </label>
        <IssueSelector credentials={credentials} onSelect={setSelectedIssue} />
        {selectedIssue && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-4 h-4" />
            Vybráno: <span className="font-bold">{selectedIssue.key}</span> - {selectedIssue.fields.summary}
          </div>
        )}
      </div>

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

function JiraPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [filter, setFilter] = useState<'month' | 'all'>('month')

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
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mr-2">Filter:</span>
              <button
                onClick={() => setFilter('month')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${filter === 'month'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                Tento měsíc
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                Všechno
              </button>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
                <List className="w-8 h-8 text-blue-500 opacity-40" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Issue List</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Your Jira issues will be displayed here soon.
              </p>
            </div>
          </div>
        ) : (
          <WorklogForm />
        )}
      </div>
    </div>
  )
}
