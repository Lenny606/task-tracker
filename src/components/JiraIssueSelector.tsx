import { useState, useEffect, useRef } from 'react'
import { Loader2, Search } from 'lucide-react'
import { searchJiraIssuesFn } from '../services/jiraServer'
import type { JiraIssue } from '../models/jira'

export function JiraIssueSelector({ onSelect, credentials, currentSelection, compact = false }: {
  onSelect: (issue: JiraIssue | { key: string; fields: { summary: string } }) => void,
  credentials: any,
  currentSelection: string | null,
  compact?: boolean
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
    <div className={`relative ${compact ? 'w-36' : 'w-full'}`} ref={dropdownRef}>
      <div className="relative">
        <div className={`absolute ${compact ? 'left-3' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`}>
          {isLoading ? (
            <Loader2 className={`${compact ? 'w-3 h-3' : 'w-5 h-5'} animate-spin`} />
          ) : (
            <Search className={`${compact ? 'w-3 h-3' : 'w-5 h-5'}`} />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={compact ? "Ticket..." : "Hledat ticket (klíč nebo název)..."}
          className={`w-full bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl outline-none transition-all font-medium shadow-sm ${
            compact ? 'py-1.5 pl-8 pr-2 text-xs' : 'py-4 pl-12 pr-4 text-lg'
          }`}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className={`absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden backdrop-blur-xl bg-opacity-95 ${compact ? 'w-64' : ''}`}>
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
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                {issue.key}
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                {issue.fields.summary}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
