import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export type ThemeMode = 'auto' | 'light' | 'dark'

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('theme', mode)
    const prefersDark = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
    const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    if (mode === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', mode)
    }
    root.style.colorScheme = resolved
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: mode }))
  } catch (e) {
    console.error('Failed to save theme:', e)
  }
}

export function getCurrentThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  try {
    const stored = localStorage.getItem('theme')
    return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto'
  } catch (e) {
    return 'auto'
  }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    setMode(getCurrentThemeMode())

    const handleThemeChange = (e: Event) => {
      setMode((e as CustomEvent<ThemeMode>).detail)
    }
    window.addEventListener('theme-changed', handleThemeChange)
    return () => window.removeEventListener('theme-changed', handleThemeChange)
  }, [])

  const handleSelect = (newMode: ThemeMode) => {
    setMode(newMode)
    applyTheme(newMode)
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 ${className}`}
      role="radiogroup"
      aria-label="Přepínač motivu vzhledu"
    >
      <button
        type="button"
        onClick={() => handleSelect('light')}
        title="Světlý režim"
        aria-label="Světlý režim"
        aria-checked={mode === 'light'}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          mode === 'light'
            ? 'bg-white text-amber-500 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => handleSelect('dark')}
        title="Tmavý režim"
        aria-label="Tmavý režim"
        aria-checked={mode === 'dark'}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          mode === 'dark'
            ? 'bg-slate-800 text-indigo-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => handleSelect('auto')}
        title="Automaticky podle systému"
        aria-label="Automaticky podle systému"
        aria-checked={mode === 'auto'}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          mode === 'auto'
            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  )
}
