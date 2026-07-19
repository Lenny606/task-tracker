import React from 'react'
import { BarChart3, Clock, CheckCircle2, Timer, Database } from 'lucide-react'
import { StatCard } from '../StatCard'
import { formatFullTime } from '../../utils/duration'

interface SummaryStatsProps {
  isMounted: boolean
  globalSeconds: number
  totalSeconds: number
  tasksCount: number
  WORK_GOAL_SECONDS: number
  isGoalReached: boolean
  remainingSeconds: number
  onLogGlobalToJira?: () => void
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  isMounted,
  globalSeconds,
  totalSeconds,
  tasksCount,
  WORK_GOAL_SECONDS,
  isGoalReached,
  remainingSeconds,
  onLogGlobalToJira
}) => {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl h-32 animate-pulse bg-slate-100/50 dark:bg-slate-800/50" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
      <StatCard
        title="Globální čas"
        value={formatFullTime(globalSeconds)}
        icon={Clock}
        variant="indigo"
        hasRing={true}
        valueClassName="font-mono tabular-nums"
        action={
          globalSeconds > 0 && onLogGlobalToJira && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLogGlobalToJira()
              }}
              className="p-2 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-95 cursor-pointer border-none bg-transparent"
              title="Zapsat globální čas do Jiry (PCSD-24)"
              aria-label="Zapsat globální čas do Jiry"
            >
              <Database className="w-5 h-5" />
            </button>
          )
        }
      />

      <StatCard
        title="Součet času úkolů"
        value={formatTime(totalSeconds)}
        icon={Timer}
        variant="slate"
      />

      <StatCard
        title="Počet úkolů"
        value={tasksCount}
        icon={CheckCircle2}
        variant="emerald"
      />

      <StatCard
        title="Průměr na úkol"
        value={tasksCount > 0 ? formatTime(Math.floor(totalSeconds / tasksCount)) : '0h 0m'}
        icon={BarChart3}
        variant="amber"
      />

      <StatCard
        title={isGoalReached ? 'Cíl splněn!' : 'Zbývá do 8 h'}
        value={isGoalReached ? '+ ' + formatTime(totalSeconds - WORK_GOAL_SECONDS) : formatTime(remainingSeconds)}
        icon={Clock}
        variant={isGoalReached ? 'emerald' : 'slate'}
        hasRing={isGoalReached}
        valueClassName={isGoalReached ? 'text-emerald-600' : ''}
      />
    </div>
  )
}
