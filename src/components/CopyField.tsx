import React, { useState } from 'react'
import { Check } from 'lucide-react'

interface CopyFieldProps {
  value: string
  placeholder?: string
  className?: string
  inputClassName?: string
  buttonClassName?: string
}

export function CopyField({
  value,
  placeholder = '',
  className = '',
  inputClassName = '',
  buttonClassName = ''
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      <input
        type="text"
        readOnly
        value={value}
        placeholder={placeholder}
        className={`flex-1 px-4 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-mono text-sm ${inputClassName}`}
      />
      <button
        type="button"
        onClick={handleCopy}
        className={`px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 shrink-0 ${buttonClassName}`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied!</span>
          </>
        ) : (
          <span>Copy Key</span>
        )}
      </button>
    </div>
  )
}
