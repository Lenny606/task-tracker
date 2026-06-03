import React from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '../Button'

interface SummaryDateNavProps {
  displayDate: string
  isToday: boolean
  onNavigateDay: (offset: number) => void
  onNavigateToday: () => void
  onDateSelect: (date: string) => void
  getFormattedDate: (dateStr: string) => string
  isMounted: boolean
}

export const SummaryDateNav: React.FC<SummaryDateNavProps> = ({
  displayDate,
  isToday,
  onNavigateDay,
  onNavigateToday,
  onDateSelect,
  getFormattedDate,
  isMounted
}) => {
  return (
    <div className="glass-panel p-4 rounded-3xl mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => onNavigateDay(-1)}
          className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Previous Day"
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </Button>

        <Button
          variant="ghost"
          onClick={() => onNavigateDay(1)}
          className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
          title="Next Day"
        >
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
        </Button>

        {isMounted && !isToday && (
          <Button
            variant="ghost"
            onClick={onNavigateToday}
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
                  onDateSelect(e.target.value)
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
  )
}
