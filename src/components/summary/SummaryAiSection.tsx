import React from 'react'
import { Sparkles, Loader2, FileText, RotateCcw, GitBranch } from 'lucide-react'
import { Button } from '../Button'
import { CollapseChevron } from '../CollapseChevron'

interface SummaryAiSectionProps {
  aiSummary: string | null
  isGenerating: boolean
  error: string | null
  isSummaryCollapsed: boolean
  onToggleCollapse: () => void
  onGenerateSummary: () => void
  onViewCommits: () => void
}

export const SummaryAiSection: React.FC<SummaryAiSectionProps> = ({
  aiSummary,
  isGenerating,
  error,
  isSummaryCollapsed,
  onToggleCollapse,
  onGenerateSummary,
  onViewCommits
}) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            AI Commits Summary
          </h2>
          <CollapseChevron
            isCollapsed={isSummaryCollapsed}
            onToggle={onToggleCollapse}
            title={isSummaryCollapsed ? "Show AI Summary" : "Hide AI Summary"}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onViewCommits}
            icon={GitBranch}
            className="px-6 py-2 rounded-xl"
          >
            View Commits
          </Button>
          {!aiSummary && !isGenerating && (
            <Button
              variant="primary"
              onClick={onGenerateSummary}
              icon={Sparkles}
              className="px-6 py-2 rounded-xl"
            >
              Generate JIRA Summary
            </Button>
          )}
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isSummaryCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'
      }`}>
        {isGenerating ? (
          <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-indigo-200 dark:border-indigo-900">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Analyzing your commits and generating a professional summary...</p>
          </div>
        ) : aiSummary ? (
          <div className="glass-panel p-8 rounded-3xl border-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-900/10 relative group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <div className=" prose-slate dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                    {aiSummary}
                  </pre>
                </div>
              </div>
            </div>
            <Button
              variant="icon"
              onClick={onGenerateSummary}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 hover:text-indigo-500"
              title="Regenerate Summary"
              icon={RotateCcw}
            />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl text-red-600 dark:text-red-400 flex items-center justify-between">
            <p className="font-medium">{error}</p>
            <Button
              variant="danger"
              onClick={onGenerateSummary}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-500"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="glass-panel p-10 rounded-3xl text-center border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400">Generate a professional JIRA summary based on your git activity for this day.</p>
          </div>
        )}
      </div>
    </div>
  )
}
