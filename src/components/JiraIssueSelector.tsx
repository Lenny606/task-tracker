import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { searchJiraIssuesFn, getFrequentTicketsFn } from '../services/jiraServer'
import type { JiraIssue } from '../models/jira'
import { Input } from './Input'

export function JiraIssueSelector({ onSelect, currentSelection, compact = false }: {
  onSelect: (issue: JiraIssue | { key: string; fields: { summary: string } }) => void,
  currentSelection: string | null,
  compact?: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JiraIssue[]>([])
  const [frequentTickets, setFrequentTickets] = useState<{ key: string; summary: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load frequent tickets on mount
  useEffect(() => {
    const fetchFrequent = async () => {
      try {
        const data = await getFrequentTicketsFn()
        setFrequentTickets(data || [])
      } catch (err) {
        console.error('Failed to fetch frequent tickets:', err)
      }
    }
    fetchFrequent()
  }, [])

  // Sync internal query with external selection
  useEffect(() => {
    if (currentSelection) {
      setQuery(currentSelection)
    } else {
      setQuery('')
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
        const issues = await searchJiraIssuesFn({ data: { jql, maxResults: 10 } }) as JiraIssue[]
        setResults(issues)
        setIsOpen(true)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [query, currentSelection])

  // Filter and prioritize matching frequent tickets (limit to top 3)
  const matchingFrequent = frequentTickets
    .filter(ticket => {
      if (!query.trim() || query === currentSelection) return true
      const q = query.toLowerCase()
      return ticket.key.toLowerCase().includes(q) || ticket.summary.toLowerCase().includes(q)
    })
    .slice(0, 3)

  // Merge frequent and remote results (de-duplicating)
  const displayedResults = [
    ...matchingFrequent.map(t => ({ ...t, id: `freq-${t.key}`, isFrequent: true })),
    ...results
      .filter(remote => !matchingFrequent.some(freq => freq.key === remote.key))
      .map(t => ({ key: t.key, summary: t.fields.summary, id: t.id, isFrequent: false }))
  ]

  return (
    <div className={`relative ${compact ? 'w-36' : 'w-full'}`} ref={dropdownRef}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={compact ? "Ticket..." : "Search ticket (key or summary)..."}
        icon={Search}
        isLoading={isLoading}
        size={compact ? 'sm' : 'lg'}
        variant="filled"
        className={compact ? 'text-xs' : 'text-lg font-medium shadow-sm'}
      />

      {isOpen && displayedResults.length > 0 && (
        <div className={`absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden backdrop-blur-xl bg-opacity-95 ${compact ? 'w-64' : ''}`}>
          {displayedResults.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect({ key: item.key, fields: { summary: item.summary } })
                setQuery(item.key)
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {item.key}
                </span>
                {item.isFrequent && (
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10">
                    Frequent
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                {item.summary}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

