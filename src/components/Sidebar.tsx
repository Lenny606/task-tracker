import { LayoutDashboard, BarChart3, Clock, Settings, History, GitCommit, Play, Pause, RefreshCw, Database, Calendar, LayoutGrid, Menu, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'
import { useState } from 'react'
import { formatFullTime } from '../utils/duration'

import { ThemeToggle } from './ThemeToggle'

export function Sidebar() {
  const {
    globalTimer,
    toggleGlobalTimer,
    resetGlobalTimer,
    updateGlobalTimer,
    getDisplayGlobalTime,
    isSyncingExtension,
    syncExtension
  } = useTasks()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleEditTimer = () => {
    const currentVal = formatFullTime(getDisplayGlobalTime(globalTimer))
    const input = prompt('Zadejte novou hodnotu globálního časovače (HH:MM:SS, MM:SS nebo počet sekund):', currentVal)
    if (input === null) return

    let totalSeconds = 0
    const parts = input.split(':').map(Number)
    if (parts.some(isNaN)) {
      const val = Number(input)
      if (!isNaN(val) && val >= 0) {
        totalSeconds = val
      } else {
        alert('Neplatný formát času. Použijte HH:MM:SS, MM:SS nebo počet sekund.')
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
        alert('Neplatný formát času. Použijte HH:MM:SS, MM:SS nebo počet sekund.')
        return
      }
    }

    updateGlobalTimer.mutate(totalSeconds)
  }

  return (
    <>
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      aria-label={isMobileOpen ? 'Zavřít navigaci' : 'Otevřít navigaci'}
      aria-expanded={isMobileOpen}
      className="lg:hidden fixed top-4 left-4 z-[70] w-11 h-11 rounded-xl bg-slate-950 text-slate-300 shadow-lg flex items-center justify-center active:scale-95 transition-all"
    >
      {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
    </button>

    {isMobileOpen && (
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40"
        aria-hidden="true"
        onClick={() => setIsMobileOpen(false)}
      />
    )}

    <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-950 text-slate-300 border-r border-slate-900 flex flex-col z-50 shadow-2xl transform transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 border-b border-slate-900 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          TimeTrack
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setIsMobileOpen(false) }}>
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Přehled</span>
        </Link>

        <Link
          to="/summary"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Denní souhrn</span>
        </Link>

        <Link
          to="/calendar"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Kalendář</span>
        </Link>

        <Link
          to="/projects"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Projekty</span>
        </Link>

        <div className="py-2 px-2">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Globální časovač</span>
              {globalTimer.isRunning && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleGlobalTimer.mutate()}
                aria-label={globalTimer.isRunning ? 'Pozastavit globální časovač' : 'Spustit globální časovač'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${globalTimer.isRunning
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                {globalTimer.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="flex-1">
                <button
                  onClick={handleEditTimer}
                  className={`font-mono text-xl tabular-nums text-left w-full hover:bg-slate-800/80 px-2 py-0.5 rounded ring-1 ring-transparent hover:ring-slate-700 transition-all ${globalTimer.isRunning ? 'text-white' : 'text-slate-400'}`}
                  title="Kliknutím upravíte časovač"
                  aria-label="Upravit hodnotu globálního časovače"
                >
                  {formatFullTime(getDisplayGlobalTime(globalTimer))}
                </button>
              </div>
              {(globalTimer.totalSeconds > 0 || globalTimer.isRunning) && (
                <button
                  onClick={() => {
                    if (confirm('Resetovat globální časovač?')) {
                      resetGlobalTimer.mutate()
                    }
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-90"
                  title="Resetovat časovač"
                  aria-label="Resetovat globální časovač"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <SyncExtensionButton isSyncing={isSyncingExtension} onSync={syncExtension} />

        <Link
          to="/commits"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <GitCommit className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Commity</span>
        </Link>

        <Link
          to="/jira"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Jira</span>
        </Link>

        <Link
          to="/tempo-calendar"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Tempo kalendář</span>
        </Link>

        <Link
          to="/history"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Historie</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-900 flex items-center justify-between gap-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group flex-1 min-w-0"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform shrink-0" />
          <span className="font-medium truncate">Nastavení</span>
        </Link>
        <ThemeToggle />
      </div>


    </aside>
    </>
  )
}
function SyncExtensionButton({ isSyncing, onSync }: { isSyncing: boolean, onSync: () => Promise<void> }) {
  return (
    <button 
      onClick={onSync}
      disabled={isSyncing}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:bg-indigo-900/20 hover:text-indigo-400 text-slate-400 group ${isSyncing ? 'animate-pulse' : ''}`}
    >
      <div className={`w-5 h-5 flex items-center justify-center ${isSyncing ? 'animate-spin' : ''}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <span className="font-medium">{isSyncing ? 'Synchronizuji…' : 'Synchronizovat rozšíření'}</span>
    </button>
  )
}
