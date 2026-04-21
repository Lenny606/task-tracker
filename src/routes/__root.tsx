import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from '../components/Sidebar'
import { ToastContainer } from '../components/ToastContainer'


import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export interface MyRouterContext {
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
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
})

import { useEffect } from 'react'
import { migrateLocalStorageFn } from '../services/migration'

function RootComponent() {
  const { queryClient } = Route.useRouteContext()

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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
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

