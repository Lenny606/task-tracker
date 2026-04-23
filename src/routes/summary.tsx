import { createFileRoute } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { BarChart3, Clock, CheckCircle2, Circle, Timer, Sparkles, Loader2, FileText, RotateCcw, Plus, Trash2, Database, GitBranch } from 'lucide-react'
import { aiService } from '../services/ai'
import { getServerCommits } from '../services/git'
import { useState } from 'react'
import { useSettings, getJiraCredentials } from '../store/settingsStore'
import { JiraIssueSelector } from '../components/JiraIssueSelector'
import { useIsMounted } from '../hooks/useIsMounted'
import { parseDurationToSeconds, formatSecondsToDuration, formatFullTime } from '../utils/duration'
import { escapeHtml } from '../utils/sanitize'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/summary')({
  component: SummaryPage,
})

function SummaryPage() {
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

  const handleLogToJira = (task: any) => {
    const durationStr = formatSecondsToDuration(task.displaySeconds)
    navigate({
      to: '/jira',
      search: {
        view: 'create',
        description: escapeHtml(task.name),
        duration: durationStr,
        issueKey: task.jiraKey || undefined,
        issueSummary: task.jiraSummary ? escapeHtml(task.jiraSummary) : undefined
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
    addTask.mutate({ 
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
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-2 text-gradient">
            {!isMounted ? 'Summary' : displayDate === new Date().toISOString().split('T')[0] ? 'Daily Summary' : `Summary: ${displayDate}`}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {!isMounted ? 'Loading summary data...' : displayDate === new Date().toISOString().split('T')[0] ? 'Overview of your productivity today.' : `Reviewing activity from ${displayDate}.`}
          </p>
        </div>


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
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {!isMounted ? (
           Array.from({length: 4}).map((_, i) => (
             <div key={i} className="glass-panel p-6 rounded-3xl h-32 animate-pulse bg-slate-100/50 dark:bg-slate-800/50" />
           ))
        ) : (
          <>
            <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform ring-2 ring-indigo-500/10">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Global Tracked Time</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{formatFullTime(globalSeconds)}</div>
            </div>

            <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                <Timer className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tasks Time Sum</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatTime(totalSeconds)}</div>
            </div>

            <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tasks Worked On</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{tasks.length}</div>
            </div>

            <div className="glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Average per Task</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {tasks.length > 0 ? formatTime(Math.floor(totalSeconds / tasks.length)) : '0h 0m'}
              </div>
            </div>

            <div className={`glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform ${isGoalReached ? 'ring-2 ring-emerald-500/20' : ''}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isGoalReached ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                {isGoalReached ? 'Goal Reached!' : 'Remaining to 8h'}
              </div>
              <div className={`text-3xl font-bold ${isGoalReached ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                {isGoalReached ? '+ ' + formatTime(totalSeconds - WORK_GOAL_SECONDS) : formatTime(remainingSeconds)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI Summary Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            AI Commits Summary
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/commits', search: { date: displayDate } })}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-2 rounded-xl font-semibold transition-all active:scale-95 flex items-center gap-2 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <GitBranch size={18} />
              View Commits
            </button>
            {!aiSummary && !isGenerating && (
              <button
                onClick={handleGenerateSummary}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <Sparkles size={18} />
                Generate JIRA Summary
              </button>
            )}
          </div>
        </div>

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
            <button
              onClick={handleGenerateSummary}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Regenerate Summary"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl text-red-600 dark:text-red-400 flex items-center justify-between">
            <p className="font-medium">{error}</p>
            <button
              onClick={handleGenerateSummary}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-500 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="glass-panel p-10 rounded-3xl text-center border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400">Generate a professional JIRA summary based on your git activity for this day.</p>
          </div>
        )}
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
                        <button
                          onClick={() => handleLogToJira(task)}
                          className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Log to Jira"
                        >
                          <Database size={18} />
                        </button>
                        <button
                          onClick={() => deleteTask.mutate(task.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Delete task"
                        >
                          <Trash2 size={18} />
                        </button>
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
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-md shadow-indigo-500/10"
                      >
                        Add Task
                      </button>
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


