import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ComponentType<{ className?: string }>
  iconPlacement?: 'left' | 'right'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    icon: Icon, 
    iconPlacement = 'left', 
    disabled, 
    type = 'button',
    ...props 
  }, ref) => {
    
    // Base interactive styles with active micro-scale transition and focus rings
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 outline-none active:scale-95 disabled:scale-100 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed select-none'
    
    // Contextual premium styling matching the existing glass/indigo theme, avoiding fialový klišé
    const variants = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:shadow-sm rounded-xl',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl',
      danger: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl',
      ghost: 'bg-transparent border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-xl',
      icon: 'p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl'
    }

    // Standard responsive sizing (except for pure icon buttons which use padding from variant)
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    const isIconButton = variant === 'icon'

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${!isIconButton ? sizes[size] : ''} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={`w-5 h-5 animate-spin ${children ? 'mr-2' : ''}`} />
            {children}
          </>
        ) : (
          <>
            {Icon && iconPlacement === 'left' && <Icon className={`w-5 h-5 ${children ? 'mr-2' : ''}`} />}
            {children}
            {Icon && iconPlacement === 'right' && <Icon className={`w-5 h-5 ${children ? 'ml-2' : ''}`} />}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
