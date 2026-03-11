import { createFileRoute } from '@tanstack/react-router'
import { GitCommit as GitCommitIcon, Clock, User, Hash, Folder, Calendar } from 'lucide-react'
import { getServerCommits } from '../services/git'

type CommitsSearch = {
  date?: string
}

export const Route = createFileRoute('/commits')({
  validateSearch: (search: Record<string, unknown>): CommitsSearch => {
    return {
      date: search.date as string | undefined,
    }
  },
  loaderDeps: ({ search: { date } }) => ({ date }),
  loader: async ({ deps: { date } }) => {
    return await getServerCommits({ data: { targetDate: date } })
  },
  component: CommitsComponent,
})

function CommitsComponent() {
  const commits = Route.useLoaderData()
  const { date } = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate({
      search: { date: e.target.value },
      replace: true,
    })
  }

  // Determine current date string for the input
  const currentDateValue = date || new Date().toISOString().split('T')[0]

  return (
    <div className="p-8 max-w-5xl mx-auto w-full min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 rounded-2xl ring-1 ring-violet-500/20">
              <GitCommitIcon className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            Commit History
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
            Review the latest changes from all your projects.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm p-1 transition-all focus-within:ring-violet-500">
            <div className="pl-3 pr-2 text-slate-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input 
              type="date" 
              value={currentDateValue}
              onChange={handleDateChange}
              className="bg-transparent border-none text-slate-700 dark:text-slate-200 font-medium py-2 pr-4 focus:ring-0 outline-none"
            />
          </div>

          <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
            <Hash className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {commits.length} Commits
            </span>
          </div>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-200 dark:border-slate-800/60 ml-6 space-y-8 pb-12">
        {commits.map((commit, index) => {
          const commitDate = new Date(commit.date)
          const isLatest = index === 0

          return (
            <div key={`${commit.projectName}-${commit.hash}`} className="relative pl-8 group">
              <div 
                className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-slate-50 dark:border-slate-950 transition-colors
                  ${isLatest ? 'bg-violet-500 ring-4 ring-violet-500/20' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-violet-400'}
                `} 
              />
              
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:shadow-md hover:border-violet-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {commit.message}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                     <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg ring-1 ring-indigo-500/20">
                        <Folder className="w-4 h-4" />
                        <span className="font-semibold">{commit.projectName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{commit.authorName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <time dateTime={commit.date} className="font-medium">
                          {commitDate.toLocaleTimeString()}
                        </time>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
                        {commit.hash.substring(0, 7)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {commits.length === 0 && (
          <div className="pl-8 text-slate-500 dark:text-slate-400 font-medium bg-slate-100/50 dark:bg-slate-900/50 p-6 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 border border-transparent border-dashed">
            No commits found across any projects for {currentDateValue}.
          </div>
        )}
      </div>
    </div>
  )
}
