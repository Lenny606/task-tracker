import React from 'react'
import { BarChart3, Clock, CheckCircle2, Timer } from 'lucide-react'
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
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  isMounted,
  globalSeconds,
  totalSeconds,
  tasksCount,
  WORK_GOAL_SECONDS,
  isGoalReached,
  remainingSeconds
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
        value={tasksCount}
        icon={CheckCircle2}
        variant="emerald"
      />

      <StatCard
        title="Average per Task"
        value={tasksCount > 0 ? formatTime(Math.floor(totalSeconds / tasksCount)) : '0h 0m'}
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
    </div>
  )
}
