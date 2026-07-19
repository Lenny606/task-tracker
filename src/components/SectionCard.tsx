import React from 'react'

interface SectionCardProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  iconBgColor?: string
  iconColor?: string
  children: React.ReactNode
  className?: string
  headerActions?: React.ReactNode
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  iconBgColor = 'bg-indigo-50 dark:bg-indigo-900/20',
  iconColor = 'text-indigo-600 dark:text-indigo-400',
  children,
  className = '',
  headerActions
}: SectionCardProps) {
  return (
    <section className={`glass-panel rounded-3xl relative ${className}`}>
      {(Icon || title || description || headerActions) && (
        <div className="px-8 py-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-9 h-9 ${iconBgColor} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}

      <div className="px-8 py-6">
        {children}
      </div>
    </section>
  )
}
