import { LayoutDashboard, BarChart3, Clock, Settings, History, GitCommit, Play, Pause } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTasks } from '../hooks/useTasks'

export function Sidebar() {
  const { globalTimer, toggleGlobalTimer, getDisplayGlobalTime } = useTasks()

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 text-slate-300 border-r border-slate-900 flex flex-col z-50 shadow-2xl">
      <div className="p-8 border-b border-slate-900 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          TimeTrack
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Dashboard</span>
        </Link>

        <Link
          to="/summary"
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:bg-slate-900 hover:text-white group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Today's Summary</span>
        </Link>
      </nav>

      <div className="px-6 mb-4">
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Global Timer</span>
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
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                globalTimer.isRunning
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {globalTimer.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className={`font-mono text-xl tabular-nums ${globalTimer.isRunning ? 'text-white' : 'text-slate-500'}`}>
              {formatTime(getDisplayGlobalTime(globalTimer))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-900 space-y-1">
        <Link
          to="/commits"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <GitCommit className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">Commits</span>
        </Link>

        <Link
          to="/history"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-400 group"
          activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/30' }}
        >
          <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold tracking-wide">History</span>
        </Link>
        
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all hover:bg-slate-900 hover:text-white text-slate-500 group">
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          <span className="font-medium">Settings</span>
        </button>
      </div>


    </aside>

  )
}
