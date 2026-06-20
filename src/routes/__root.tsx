import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { ToastContainer } from '../components/ToastContainer'
import { AgentCopilot } from '../components/AgentCopilot'


import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

interface MyRouterContext {
  queryClient: QueryClient
}

import { NotFound } from '../components/NotFound'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TimeTrack - Task Tracker' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
})

import { useEffect, useState } from 'react'
import { migrateLocalStorageFn } from '../services/migration'
import { reconcileTimersFn } from '../services/tasksServer'
import { useTasks } from '../hooks/useTasks'
import { Menu, Clock } from 'lucide-react'

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { globalTimer } = useTasks()

  // Stop stale timers (left running from a previous day / over 10h) once per app start.
  // This used to happen as a side-effect of reading history; now it is explicit.
  useEffect(() => {
    reconcileTimersFn()
      .then((result) => {
        if (result && (result.reconciledTasks > 0 || result.reconciledTimers > 0)) {
          console.log('[Reconcile] Stopped stale timers:', result)
          queryClient.invalidateQueries({ queryKey: ['history'] })
        }
      })
      .catch((error) => console.error('[Reconcile] Failed to reconcile timers:', error))
  }, [queryClient])

  useEffect(() => {
    const checkMigration = async () => {
      const isMigrated = localStorage.getItem('migrated_to_sql_v2') === 'true'
      if (isMigrated) return

      const historyData = localStorage.getItem('task-tracker-history')
      const settingsData = localStorage.getItem('task-tracker-settings')

      if (historyData || settingsData) {
        console.log('[Migration] Migration data found in localStorage. Starting...')
        try {
          const payload = {
            history: historyData ? JSON.parse(historyData) : undefined,
            settings: settingsData ? JSON.parse(settingsData) : undefined,
          }

          await migrateLocalStorageFn({ data: payload })
          
          localStorage.setItem('migrated_to_sql_v2', 'true')
          console.log('[Migration] Migration successful!')
          
          // Invalidate queries to refresh data from SQL
          queryClient.invalidateQueries()
        } catch (error) {
          console.error('[Migration] Migration failed:', error)
        }
      } else {
        // No data to migrate, mark as migrated anyway to skip future checks
        localStorage.setItem('migrated_to_sql_v2', 'true')
      }
    }

    checkMigration()
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950 text-slate-300 border-b border-slate-900 sticky top-0 z-40 w-full shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                TimeTrack
              </span>
            </div>
          </div>

          {/* Running timer status indicator */}
          {globalTimer.isRunning && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/50 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold animate-pulse-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Tracking
            </span>
          )}
        </header>

        {/* Mobile Sidebar backdrop */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          />
        )}

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 md:ml-64 min-h-screen pt-4 md:pt-0 w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <AgentCopilot />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </QueryClientProvider>
  )
}


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* fallow-ignore-next-line security-sink */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-100 dark:selection:bg-indigo-900/40">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

