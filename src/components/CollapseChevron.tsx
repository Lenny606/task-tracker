import React from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapseChevronProps {
  isCollapsed: boolean
  onToggle: () => void
  className?: string
  title?: string
}

export function CollapseChevron({
  isCollapsed,
  onToggle,
  className = '',
  title = 'Toggle Section'
}: CollapseChevronProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/20 ${className}`}
      title={title}
      aria-label={title}
      aria-expanded={!isCollapsed}
    >
      <ChevronDown
        className={`w-5 h-5 transition-transform duration-300 ease-out ${
          isCollapsed ? '-rotate-90' : 'rotate-0'
        }`}
      />
    </button>
  )
}
