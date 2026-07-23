import React from 'react'
import { ThemeToggle } from './ThemeToggle'

interface PageHeaderProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  gradientFrom?: string
  gradientTo?: string
  rightContent?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-indigo-500',
  gradientFrom = 'from-indigo-500/20',
  gradientTo = 'to-purple-500/20',
  rightContent
}: PageHeaderProps) {
  return (
    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div className="flex items-center gap-4 mb-4">
          {Icon && (
            <div className={`w-14 h-14 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl flex items-center justify-center ring-1 ring-indigo-500/10`}>
              <Icon className={`w-7 h-7 ${iconColor}`} />
            </div>
          )}
          <h1 className="text-5xl font-extrabold tracking-tight text-gradient">
            {title}
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {rightContent}
        <ThemeToggle />
      </div>
    </header>
  )
}
