import React, { forwardRef } from 'react'
import { type LucideIcon, Loader2 } from 'lucide-react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
  variant?: 'default' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  variant = 'default',
  size = 'md',
  className = '',
  type = 'text',
  ...props
}, ref) => {
  // Premium visual tokens aligned with our design system
  const variantStyles = {
    default: 'bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
    filled: 'bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-2',
    ghost: 'bg-transparent border-none focus:ring-2 focus:ring-indigo-500/30'
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-5 py-3.5 text-base rounded-2xl'
  }

  // Adjust input paddings dynamically to accommodate left/right icons or loaders
  const iconPaddingStyles = () => {
    if (!Icon && !isLoading) return ''
    if (iconPosition === 'left') {
      return size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10'
    } else {
      return size === 'sm' ? 'pr-8' : size === 'lg' ? 'pr-12' : 'pr-10'
    }
  }

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {((Icon || isLoading) && iconPosition === 'left') && (
          <div className={`absolute ${size === 'sm' ? 'left-2.5' : size === 'lg' ? 'left-4' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10`}>
            {isLoading && iconPosition === 'left' ? (
              <Loader2 className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} animate-spin`} />
            ) : (
              Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
            )}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={`w-full outline-none transition-all duration-200 dark:text-white font-medium
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${iconPaddingStyles()}
            ${error ? 'border-red-500 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />

        {((isLoading && iconPosition === 'right') || (Icon && iconPosition === 'right' && !isLoading)) && (
          <div className={`absolute ${size === 'sm' ? 'right-2.5' : size === 'lg' ? 'right-4' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10`}>
            {isLoading && iconPosition === 'right' ? (
              <Loader2 className={`${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} animate-spin`} />
            ) : (
              Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
            )}
          </div>
        )}
      </div>
      {error && (
        <span className="block text-xs font-semibold text-red-500 ml-1">
          {error}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'
