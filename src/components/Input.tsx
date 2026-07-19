import React, { forwardRef } from 'react'
import { type LucideIcon, Loader2 } from 'lucide-react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
  isLoading?: boolean
  variant?: 'default' | 'filled' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

interface InputIconProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  isLoading: boolean
  size: 'sm' | 'md' | 'lg'
  position: 'left' | 'right'
  iconPosition: 'left' | 'right'
}

const InputIcon: React.FC<InputIconProps> = ({
  icon: Icon,
  isLoading,
  size,
  position,
  iconPosition
}) => {
  if (position !== iconPosition) return null
  if (!Icon && !isLoading) return null

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const wrapperClasses = {
    sm: position === 'left' ? 'left-2.5' : 'right-2.5',
    md: position === 'left' ? 'left-3' : 'right-3',
    lg: position === 'left' ? 'left-4' : 'right-4'
  }

  return (
    <div className={`absolute ${wrapperClasses[size]} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10`}>
      {isLoading ? (
        <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      ) : (
        Icon && <Icon className={sizeClasses[size]} />
      )}
    </div>
  )
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

  const iconPadding = (Icon || isLoading)
    ? (iconPosition === 'left'
        ? { sm: 'pl-8', md: 'pl-10', lg: 'pl-12' }[size]
        : { sm: 'pr-8', md: 'pr-10', lg: 'pr-12' }[size])
    : ''

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <InputIcon
          icon={Icon}
          isLoading={isLoading}
          size={size}
          position="left"
          iconPosition={iconPosition}
        />

        <input
          ref={ref}
          type={type}
          className={`w-full outline-none transition-all duration-200 dark:text-white font-medium
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${iconPadding}
            ${error ? 'border-red-500 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />

        <InputIcon
          icon={Icon}
          isLoading={isLoading}
          size={size}
          position="right"
          iconPosition={iconPosition}
        />
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
