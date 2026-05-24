import React from 'react'

type StatCardVariant = 'indigo' | 'slate' | 'emerald' | 'amber'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  variant?: StatCardVariant
  hasRing?: boolean
  className?: string
  valueClassName?: string
}

const variantStyles: Record<StatCardVariant, {
  iconBg: string
  iconColor: string
  ring: string
}> = {
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-2 ring-indigo-500/10'
  },
  slate: {
    iconBg: 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-400',
    ring: 'ring-2 ring-slate-500/5'
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-2 ring-emerald-500/20'
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-2 ring-amber-500/15'
  }
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'slate',
  hasRing = false,
  className = '',
  valueClassName = ''
}: StatCardProps) {
  const styles = variantStyles[variant]
  const ringClass = hasRing ? styles.ring : ''

  return (
    <div className={`glass-panel p-6 rounded-3xl shadow-sm border-transparent hover:scale-[1.02] transition-transform ${ringClass} ${className}`}>
      <div className={`w-12 h-12 ${styles.iconBg} ${styles.iconColor} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
        {title}
      </div>
      <div className={`text-3xl font-bold text-slate-900 dark:text-white ${valueClassName}`}>
        {value}
      </div>
    </div>
  )
}
