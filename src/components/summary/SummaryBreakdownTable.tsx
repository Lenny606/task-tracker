import React from 'react'
import { CheckCircle2, Circle, Database, Trash2, Plus, Sparkles, Check } from 'lucide-react'
import { Button } from '../Button'
import { JiraIssueSelector } from '../JiraIssueSelector'
import { ProjectSelector } from '../ProjectSelector'
import { parseDurationToSeconds, formatFullTime } from '../../utils/duration'

interface TaskType {
  id: string
  name: string
  isMarked: boolean
  displaySeconds: number
  jiraKey?: string | null
  jiraSummary?: string | null
  trackerProjectId?: string | null
  isAiSuggested?: boolean
}

interface SummaryBreakdownTableProps {
  liveTasks: TaskType[]
  totalSeconds: number
  globalSeconds: number
  isGoalReached: boolean
  remainingSeconds: number
  newTaskName: string
  setNewTaskName: (val: string) => void
  pendingJiraTicket: { key: string; summary: string } | null
  setPendingJiraTicket: (val: { key: string; summary: string } | null) => void
  displayDate: string
  onToggleMarked: (id: string) => void
  onUpdateTask: (args: {
    taskId: string
    name?: string
    jiraKey?: string | null
    jiraSummary?: string | null
    trackerProjectId?: string | null
    totalSeconds?: number
    isAiSuggested?: boolean
  }) => void
  onDeleteTask: (id: string) => void
  onAddTask: (e?: React.FormEvent) => void
  onLogToJira: (task: TaskType) => void
  onLogGlobalToJira?: () => void
}

export const SummaryBreakdownTable: React.FC<SummaryBreakdownTableProps> = ({
  liveTasks,
  totalSeconds,
  globalSeconds,
  isGoalReached,
  remainingSeconds,
  newTaskName,
  setNewTaskName,
  pendingJiraTicket,
  setPendingJiraTicket,
  displayDate,
  onToggleMarked,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onLogToJira,
  onLogGlobalToJira
}) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTask(e)
  }

  return (
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
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
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
                      onClick={() => onToggleMarked(task.id)}
                      className={`transition-all active:scale-95 ${
                        task.isMarked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
                      }`}
                    >
                      {task.isMarked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={task.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== task.name) {
                            onUpdateTask({ taskId: task.id, name: e.target.value.trim() })
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            e.stopPropagation()
                            ;(e.target as HTMLInputElement).blur()
                          }
                        }}
                        className="font-medium text-slate-700 dark:text-slate-200 bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-lg px-2 -ml-2 transition-all w-full"
                      />
                      {task.isAiSuggested && (
                        <button
                          onClick={() => onUpdateTask({ taskId: task.id, isAiSuggested: false })}
                          title="Návrh od agenta — kliknutím potvrdíte"
                          className="group/sugg flex-shrink-0 flex items-center gap-1 text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-md border border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all"
                        >
                          <Sparkles size={11} className="group-hover/sugg:hidden" />
                          <Check size={11} className="hidden group-hover/sugg:block" />
                          Návrh AI
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <JiraIssueSelector
                      compact={true}
                      onSelect={(issue) => {
                        onUpdateTask({
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
                      onSelect={(projectId) => onUpdateTask({ taskId: task.id, trackerProjectId: projectId })}
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
                            onUpdateTask({ taskId: task.id, totalSeconds: seconds })
                          }
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
                        onClick={() => onLogToJira(task)}
                        className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Log to Jira"
                        icon={Database}
                      />
                      <Button
                        variant="icon"
                        onClick={() => onDeleteTask(task.id)}
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
                <form onSubmit={handleFormSubmit} className="flex items-center gap-4">
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
              <td className="px-6 py-4" colSpan={4}></td>
            </tr>
            {globalSeconds > 0 && (
              <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 font-bold border-t border-indigo-500/20">
                <td className="px-6 py-6"></td>
                <td className="px-6 py-6 text-indigo-600 dark:text-indigo-400 text-sm tracking-wide font-black">GLOBAL TRACKED TIME</td>
                <td className="px-6 py-6">
                  <span className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider">
                    PCSD-24
                  </span>
                </td>
                <td className="px-6 py-6"></td>
                <td className="px-6 py-6 font-mono text-indigo-600 dark:text-indigo-400">{formatFullTime(globalSeconds)}</td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1 text-indigo-600 dark:text-indigo-400">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60">Independent of tasks</span>
                    <span className="text-xs font-bold">{isGoalReached ? 'Goal Reached!' : `${formatTime(remainingSeconds)} remaining to 8h`}</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  {onLogGlobalToJira && (
                    <div className="flex items-center justify-end">
                      <Button
                        variant="icon"
                        onClick={onLogGlobalToJira}
                        className="p-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg inline-flex"
                        title="Log Global Tracked Time to Jira (PCSD-24)"
                        icon={Database}
                      />
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
