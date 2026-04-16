import { createFileRoute } from '@tanstack/react-router'
import { Database, List, PlusCircle } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/jira')({
  component: JiraPage,
})

function JiraPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [filter, setFilter] = useState<'month' | 'all'>('month')

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center ring-1 ring-blue-500/20">
            <Database className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-gradient">Jira</h1>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Manage your Jira tasks and time logging.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit mb-8 ring-1 ring-slate-200 dark:ring-slate-800">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'list'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <List className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wide">List</span>
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${activeTab === 'create'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span className="font-bold text-sm tracking-wide">Vytvořit</span>
        </button>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-3xl min-h-[400px]">
        {activeTab === 'list' ? (
          <div className="p-8 h-full">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mr-2">Filter:</span>
              <button
                onClick={() => setFilter('month')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${filter === 'month'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                Tento měsíc
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${filter === 'all'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                Všechno
              </button>
            </div>

            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
                <List className="w-8 h-8 text-blue-500 opacity-40" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Issue List</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Your Jira issues will be displayed here soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center h-full">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
              <PlusCircle className="w-8 h-8 text-blue-500 opacity-40" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create New Issue</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              The form to create new Jira issues is coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
