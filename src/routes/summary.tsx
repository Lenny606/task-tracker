import { createFileRoute } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { BarChart3, Clock, CheckCircle2, Circle, Timer, Sparkles, Loader2, FileText, RotateCcw, Plus, Trash2, Database, GitBranch, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { aiService } from '../services/ai'
import { getServerCommits } from '../services/git'
import { useState } from 'react'
import { useSettings, getJiraCredentials } from '../store/settingsStore'
import { JiraIssueSelector } from '../components/JiraIssueSelector'
import { useIsMounted } from '../hooks/useIsMounted'
import { parseDurationToSeconds, formatSecondsToDuration, formatFullTime } from '../utils/duration'
import { escapeHtml } from '../utils/sanitize'
import { useNavigate } from '@tanstack/react-router'
import { ProjectSelector } from '../components/ProjectSelector'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { Button } from '../components/Button'
import { CollapseChevron } from '../components/CollapseChevron'

export const Route = createFileRoute('/summary')({
  component: SummaryPage,
})

export function SummaryPage() {
  const { date } = Route.useSearch<{ date?: string }>()
  const isMounted = useIsMounted()
  const displayDate = date || (isMounted ? new Date().toISOString().split('T')[0] : '')
  const { 
    tasks, getDisplayTime, globalTimer, getDisplayGlobalTime, aiSummary, 
    saveAiSummary, toggleMarked, updateTask, addTask, deleteTask,
    newTaskName, setNewTaskName, pendingJiraTicket, setPendingJiraTicket 
  } = useTasks(displayDate)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { settings } = useSettings()
  const credentials = getJiraCredentials(settings)

  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai_summary_collapsed') === 'true'
    }
    return false
  })

  const toggleSummaryCollapse = () => {
    setIsSummaryCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('ai_summary_collapsed', String(next))
      return next
    })
  }

  const navigateDay = (offset: number) => {
    if (!displayDate) return
    const parts = displayDate.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      
      const currentDate = new Date(year, month, day)
      currentDate.setDate(currentDate.getDate() + offset)
      
      const nextDateStr = currentDate.getFullYear() + '-' +
        (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
        currentDate.getDate().toString().padStart(2, '0')
        
      navigate({
        search: (prev) => ({ ...prev, date: nextDateStr }),
      })
    }
  }

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const dateObj = new Date(year, month, day)
      return dateObj.toLocaleDateString('cs-CZ', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    return dateStr
  }

  const handleLogToJira = (task: any) => {
    const durationStr = formatSecondsToDuration(task.displaySeconds)
    navigate({
      to: '/jira',
      search: {
        view: 'create',
        description: escapeHtml(task.name),
        duration: durationStr,
        issueKey: task.jiraKey || undefined,
        issueSummary: task.jiraSummary ? escapeHtml(task.jiraSummary) : undefined,
        date: displayDate
      }
    })
  }

  const liveTasks = tasks.map(t => ({
    ...t,
    displaySeconds: getDisplayTime(t)
  }))

  const totalSeconds = liveTasks.reduce((acc, t) => acc + t.displaySeconds, 0)
  const globalSeconds = getDisplayGlobalTime(globalTimer)

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }


  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const commits = await getServerCommits({ data: { targetDate: displayDate } })
      const summary = await aiService.analyzeCommitsForJira(commits)
      saveAiSummary.mutate(summary)
    } catch (err) {
      console.error('Failed to generate summary:', err)
      setError('Failed to generate AI summary. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newTaskName.trim()) return
    const id = crypto.randomUUID()
    addTask.mutate({ 
      id,
      name: newTaskName.trim(),
      jiraKey: pendingJiraTicket?.key,
      jiraSummary: pendingJiraTicket?.summary
    })
    setNewTaskName('')
    setPendingJiraTicket(null)
  }

  const WORK_GOAL_SECONDS = 8 * 3600 // 8 hours
  const remainingSeconds = Math.max(0, WORK_GOAL_SECONDS - totalSeconds)
  const isGoalReached = totalSeconds >= WORK_GOAL_SECONDS
  const totalProgress = Math.min(100, (totalSeconds / WORK_GOAL_SECONDS) * 100)

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <PageHeader
        title={!isMounted ? 'Summary' : displayDate === new Date().toISOString().split('T')[0] ? 'Daily Summary' : `Summary: ${displayDate}`}
        description={!isMounted ? 'Loading summary data...' : displayDate === new Date().toISOString().split('T')[0] ? 'Overview of your productivity today.' : `Reviewing activity from ${displayDate}.`}
        rightContent={
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Day Progress</div>
            <div className="w-64 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className={`h-full transition-all duration-1000 ${isGoalReached ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <div className="text-xs font-medium text-slate-500">{Math.round(totalProgress)}% of 8h goal</div>
          </div>
        }
      />

      {/* Date Navigation Bar */}
      <div className="glass-panel p-4 rounded-3xl mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigateDay(-1)}
            className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Previous Day"
          >
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigateDay(1)}
            className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Next Day"
          >
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
          </Button>

          {isMounted && displayDate !== new Date().toISOString().split('T')[0] && (
            <Button
              variant="ghost"
              onClick={() => navigate({ search: (prev) => ({ ...prev, date: undefined }) })}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400"
            >
              Dnes
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 relative group hover:border-indigo-500/30 transition-colors">
          <Calendar size={18} className="text-indigo-500" />
          {isMounted ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200 pr-1 capitalize">
                {getFormattedDate(displayDate)}
              </span>
              <input
                type="date"
                value={displayDate}
                onChange={(e) => {
                  if (e.target.value) {
                    navigate({ search: (prev) => ({ ...prev, date: e.target.value }) })
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Select Date"
              />
            </>
          ) : (
            <span className="text-slate-400">Načítání data...</span>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {!isMounted ? (
           Array.from({length: 5}).map((_, i) => (
             <div key={i} className="glass-panel p-6 rounded-3xl h-32 animate-pulse bg-slate-100/50 dark:bg-slate-800/50" />
           ))
        ) : (
          <>
            <StatCard
              title="Global Tracked Time"
              value={formatFullTime(globalSeconds)}
              icon={Clock}
              variant="indigo"
              hasRing={true}
              valueClassName="font-mono tabular-nums"
            />

            <StatCard
              title="Tasks Time Sum"
              value={formatTime(totalSeconds)}
              icon={Timer}
              variant="slate"
            />

            <StatCard
              title="Tasks Worked On"
              value={tasks.length}
              icon={CheckCircle2}
              variant="emerald"
            />

            <StatCard
              title="Average per Task"
              value={tasks.length > 0 ? formatTime(Math.floor(totalSeconds / tasks.length)) : '0h 0m'}
              icon={BarChart3}
              variant="amber"
            />

            <StatCard
              title={isGoalReached ? 'Goal Reached!' : 'Remaining to 8h'}
              value={isGoalReached ? '+ ' + formatTime(totalSeconds - WORK_GOAL_SECONDS) : formatTime(remainingSeconds)}
              icon={Clock}
              variant={isGoalReached ? 'emerald' : 'slate'}
              hasRing={isGoalReached}
              valueClassName={isGoalReached ? 'text-emerald-600' : ''}
            />
          </>
        )}
      </div>

      {/* AI Summary Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              AI Commits Summary
            </h2>
            <CollapseChevron
              isCollapsed={isSummaryCollapsed}
              onToggle={toggleSummaryCollapse}
              title={isSummaryCollapsed ? "Show AI Summary" : "Hide AI Summary"}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/commits', search: { date: displayDate } })}
              icon={GitBranch}
              className="px-6 py-2 rounded-xl"
            >
              View Commits
            </Button>
            {!aiSummary && !isGenerating && (
              <Button
                variant="primary"
                onClick={handleGenerateSummary}
                icon={Sparkles}
                className="px-6 py-2 rounded-xl"
              >
                Generate JIRA Summary
              </Button>
            )}
          </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSummaryCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'
        }`}>
          {isGenerating ? (
            <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-indigo-200 dark:border-indigo-900">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Analyzing your commits and generating a professional summary...</p>
            </div>
          ) : aiSummary ? (
            <div className="glass-panel p-8 rounded-3xl border-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-900/10 relative group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <div className=" prose-slate dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                      {aiSummary}
                    </pre>
                  </div>
                </div>
              </div>
              <Button
                variant="icon"
                onClick={handleGenerateSummary}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 hover:text-indigo-500"
                title="Regenerate Summary"
                icon={RotateCcw}
              />
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl text-red-600 dark:text-red-400 flex items-center justify-between">
              <p className="font-medium">{error}</p>
              <Button
                variant="danger"
                onClick={handleGenerateSummary}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-500"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-3xl text-center border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-400">Generate a professional JIRA summary based on your git activity for this day.</p>
            </div>
          )}
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
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 w-12"></th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Task Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 w-40">Jira Ticket</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Project</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Duration</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Percentage</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {liveTasks.length === 0 && !newTaskName && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No data available for {displayDate}. Use the input below to add tasks retrospectively.
                  </td>
                </tr>
              )}
              {liveTasks.map((task) => {
                const percentage = totalSeconds > 0 ? (task.displaySeconds / totalSeconds) * 100 : 0
                return (
                  <tr 
                    key={task.id} 
                    className={`transition-colors group ${
                      task.isMarked 
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMarked.mutate(task.id)}
                        className={`transition-all active:scale-95 ${
                          task.isMarked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
                        }`}
                      >
                        {task.isMarked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        defaultValue={task.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== task.name) {
                            updateTask.mutate({ taskId: task.id, name: e.target.value.trim() })
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.stopPropagation()
                              ; (e.target as HTMLInputElement).blur()
                          }
                        }}
                        className="font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 -ml-2 transition-all w-full"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <JiraIssueSelector
                        credentials={credentials}
                        compact={true}
                        onSelect={(issue) => {
                          updateTask.mutate({ 
                            taskId: task.id, 
                            jiraKey: issue.key, 
                            jiraSummary: issue.fields.summary 
                          })
                        }}
                        currentSelection={task.jiraKey || null}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ProjectSelector 
                        compact 
                        selectedProjectId={task.trackerProjectId} 
                        onSelect={(projectId) => updateTask.mutate({ taskId: task.id, trackerProjectId: projectId })}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative group/duration">
                        <input
                          type="text"
                          defaultValue={formatFullTime(task.displaySeconds)}
                          onBlur={(e) => {
                            const seconds = parseDurationToSeconds(e.target.value)
                            if (seconds !== task.displaySeconds) {
                              updateTask.mutate({ taskId: task.id, totalSeconds: seconds })
                            }
                            // Reset to formatted value if needed
                            e.target.value = formatFullTime(seconds)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              ;(e.target as HTMLInputElement).blur()
                            }
                          }}
                          title="Manual duration edit (e.g. 1h 30m, 01:30:00, or 90)"
                          className="font-mono text-slate-600 dark:text-slate-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 -ml-2 transition-all w-24 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-edit"
                        />
                      </div>
                    </td>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="icon"
                          onClick={() => handleLogToJira(task)}
                          className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Log to Jira"
                          icon={Database}
                        />
                        <Button
                          variant="icon"
                          onClick={() => deleteTask.mutate(task.id)}
                          className="p-2 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete task"
                          icon={Trash2}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}

              {/* Add Task Row */}
              <tr className="bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                <td className="px-6 py-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <form onSubmit={handleAddTask} className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Add task retrospectively..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium py-1"
                    />
                    {newTaskName.trim() && (
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                      >
                        Add Task
                      </Button>
                    )}
                  </form>
                </td>
                <td className="px-6 py-4">
                  <JiraIssueSelector
                    credentials={credentials}
                    compact={true}
                    onSelect={(issue) => {
                      if (!newTaskName.trim()) {
                        setNewTaskName(issue.fields.summary)
                      }
                      setPendingJiraTicket({ key: issue.key, summary: issue.fields.summary })
                    }}
                    currentSelection={pendingJiraTicket?.key || null}
                  />
                </td>
                <td className="px-6 py-4" colSpan={3}></td>
              </tr>
              {globalSeconds > 0 && (
                <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 font-bold border-t-2 border-indigo-500/20">
                  <td className="px-6 py-6 text-indigo-600 dark:text-indigo-400">GLOBAL TRACKED TIME</td>
                  <td className="px-6 py-6 font-mono text-indigo-600 dark:text-indigo-400">{formatFullTime(globalSeconds)}</td>
                  <td className="px-6 py-6" colSpan={4}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-indigo-500/60">Independent of tasks</span>
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <span className="text-xs uppercase tracking-widest opacity-60">Remaining to 8h:</span>
                        <span className="text-sm font-bold">{isGoalReached ? 'Goal Reached!' : formatTime(remainingSeconds)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


