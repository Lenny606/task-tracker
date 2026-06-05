import { createFileRoute } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { aiService } from '../services/ai'
import { getServerCommits } from '../services/git'
import { useState } from 'react'
import { useSettings, getJiraCredentials } from '../store/settingsStore'
import { useIsMounted } from '../hooks/useIsMounted'
import { formatSecondsToDuration } from '../utils/duration'
import { escapeHtml } from '../utils/sanitize'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '../components/PageHeader'

// Import extracted sub-components
import { SummaryDateNav } from '../components/summary/SummaryDateNav'
import { SummaryStats } from '../components/summary/SummaryStats'
import { SummaryAiSection } from '../components/summary/SummaryAiSection'
import { SummaryBreakdownTable } from '../components/summary/SummaryBreakdownTable'

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

  const handleLogGlobalToJira = () => {
    const durationStr = formatSecondsToDuration(globalSeconds)
    
    let dayOfWeek = ''
    if (displayDate) {
      const parts = displayDate.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        const dateObj = new Date(year, month, day)
        const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'long' })
        dayOfWeek = dayName.charAt(0).toUpperCase() + dayName.slice(1)
      }
    }

    navigate({
      to: '/jira',
      search: {
        view: 'create',
        description: dayOfWeek || 'Global Tracked Time',
        duration: durationStr,
        issueKey: 'PCSD-24',
        issueSummary: 'PCSD-24',
        date: displayDate
      }
    })
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

      <SummaryDateNav
        displayDate={displayDate}
        isToday={displayDate === new Date().toISOString().split('T')[0]}
        onNavigateDay={navigateDay}
        onNavigateToday={() => navigate({ search: (prev) => ({ ...prev, date: undefined }) })}
        onDateSelect={(val) => navigate({ search: (prev) => ({ ...prev, date: val }) })}
        getFormattedDate={getFormattedDate}
        isMounted={isMounted}
      />

      <SummaryStats
        isMounted={isMounted}
        globalSeconds={globalSeconds}
        totalSeconds={totalSeconds}
        tasksCount={tasks.length}
        WORK_GOAL_SECONDS={WORK_GOAL_SECONDS}
        isGoalReached={isGoalReached}
        remainingSeconds={remainingSeconds}
        onLogGlobalToJira={handleLogGlobalToJira}
      />

      <SummaryAiSection
        aiSummary={aiSummary}
        isGenerating={isGenerating}
        error={error}
        isSummaryCollapsed={isSummaryCollapsed}
        onToggleCollapse={toggleSummaryCollapse}
        onGenerateSummary={handleGenerateSummary}
        onViewCommits={() => navigate({ to: '/commits', search: { date: displayDate } })}
      />

      <SummaryBreakdownTable
        liveTasks={liveTasks}
        totalSeconds={totalSeconds}
        globalSeconds={globalSeconds}
        isGoalReached={isGoalReached}
        remainingSeconds={remainingSeconds}
        newTaskName={newTaskName}
        setNewTaskName={setNewTaskName}
        pendingJiraTicket={pendingJiraTicket}
        setPendingJiraTicket={setPendingJiraTicket}
        credentials={credentials}
        displayDate={displayDate}
        onToggleMarked={(id) => toggleMarked.mutate(id)}
        onUpdateTask={(args) => updateTask.mutate(args)}
        onDeleteTask={(id) => deleteTask.mutate(id)}
        onAddTask={handleAddTask}
        onLogToJira={handleLogToJira}
        onLogGlobalToJira={handleLogGlobalToJira}
      />
    </div>
  )
}
