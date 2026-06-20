import { LayoutDashboard, BarChart3, Clock, Settings, History, GitCommit, Play, Pause, RefreshCw, Database, Calendar, LayoutGrid, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'

import { Divider } from './Divider'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const {
    globalTimer,
    toggleGlobalTimer,
    resetGlobalTimer,
    updateGlobalTimer,
    getDisplayGlobalTime,
    isSyncingExtension,
    syncExtension
  } = useTasks()

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleEditTimer = () => {
    const currentVal = formatTime(getDisplayGlobalTime(globalTimer))
    const input = prompt('Enter new global timer value (HH:MM:SS, MM:SS, or total seconds):', currentVal)
    if (input === null) return

    let totalSeconds = 0
    const parts = input.split(':').map(Number)
    if (parts.some(isNaN)) {
      const val = Number(input)
      if (!isNaN(val) && val >= 0) {
        totalSeconds = val
      } else {
        alert('Invalid time format. Please use HH:MM:SS, MM:SS, or raw seconds.')
        return
      }
    } else {
      if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
      } else if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1]
      } else if (parts.length === 1) {
        totalSeconds = parts[0]
      } else {
        alert('Invalid time format. Please use HH:MM:SS, MM:SS, or raw seconds.')
        return
      }
    }

    updateGlobalTimer.mutate(totalSeconds)
  }

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-950 text-slate-300 border-r border-slate-900 flex flex-col z-50 shadow-2xl transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      <div className="p-8 border-b border-slate-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TimeTrack
          </h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        <div className="py-2 px-2">
          <div className={`rounded-2xl p-3 border transition-all duration-500 ${
            globalTimer.isRunning
              ? 'bg-indigo-950/10 border-indigo-900/40'
              : 'bg-slate-900/30 border-slate-800/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                globalTimer.isRunning ? 'text-indigo-500' : 'text-slate-600'
              }`}>Global Timer</span>
              {globalTimer.isRunning && (
                <span className="flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleGlobalTimer.mutate()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 border border-transparent cursor-pointer ${
                  globalTimer.isRunning
                    ? 'text-indigo-400 hover:bg-indigo-950/30 hover:scale-105'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 hover:scale-105'
                }`}
                title={globalTimer.isRunning ? 'Pause Global Timer' : 'Start Global Timer'}
              >
                {globalTimer.isRunning ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <button
                  onClick={handleEditTimer}
                  className={`font-mono text-lg tabular-nums text-left w-full hover:bg-slate-800/60 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    globalTimer.isRunning ? 'text-white font-semibold' : 'text-slate-500'
                  }`}
                  title="Click to edit timer"
                >
                  {formatTime(getDisplayGlobalTime(globalTimer))}
                </button>
              </div>
              {(globalTimer.totalSeconds > 0 || globalTimer.isRunning) && (
                <button
                  onClick={() => {
                    if (confirm('Reset global timer?')) {
                      resetGlobalTimer.mutate()
                    }
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent transition-all active:scale-90 cursor-pointer"
                  title="Reset Timer"
                >
                  <RefreshCw size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Daily Dashboard</span>
        </Link>

        <Link
          to="/summary"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Today's Summary</span>
        </Link>

        <Link
          to="/calendar"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Task Calendar</span>
        </Link>

        <Link
          to="/projects"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Projects</span>
        </Link>

        <Divider />

        <Link
          to="/jira"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Log Tempo</span>
        </Link>

        <Link
          to="/tempo-calendar"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Tempo Calendar</span>
        </Link>

        <Divider />

        <Link
          to="/history"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">History</span>
        </Link>

        <SyncExtensionButton isSyncing={isSyncingExtension} onSync={syncExtension} />

        <Link
          to="/commits"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <GitCommit className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Commits</span>
        </Link>

      </nav>

      <div className="p-6 border-t border-slate-900 space-y-1">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-500 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>


    </aside>

  )
}
function SyncExtensionButton({ isSyncing, onSync }: { isSyncing: boolean, onSync: () => Promise<void> }) {
  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:bg-indigo-900/20 hover:text-indigo-400 text-slate-500 group ${isSyncing ? 'animate-pulse' : ''}`}
    >
      <div className={`w-5 h-5 flex items-center justify-center ${isSyncing ? 'animate-spin' : ''}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <span className="font-medium">{isSyncing ? 'Syncing...' : 'Sync Extension'}</span>
    </button>
  )
}
