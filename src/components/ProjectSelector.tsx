import { useQuery } from '@tanstack/react-query'
import { getProjectsFn } from '../services/projectsServer'
import { Briefcase, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ProjectSelectorProps {
  selectedProjectId: string | null
  onSelect: (projectId: string | null) => void
  compact?: boolean
}

export function ProjectSelector({ selectedProjectId, onSelect, compact = false }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  })

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (compact) {
    return (
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border ${
            selectedProject 
              ? 'bg-white dark:bg-slate-900 border-indigo-500/30 text-indigo-500 shadow-sm' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
          }`}
          style={selectedProject ? { color: selectedProject.color, borderColor: `${selectedProject.color}33` } : {}}
        >
          <Briefcase size={12} />
          {selectedProject ? selectedProject.name : 'No Project'}
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-2 z-[60] animate-in fade-in slide-in-from-top-1 duration-150">
            <ProjectList 
              projects={projects} 
              onSelect={(id) => {
                onSelect(id)
                setIsOpen(false)
              }} 
              selectedId={selectedProjectId}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-indigo-500/50 rounded-xl transition-all shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800"
            style={selectedProject ? { backgroundColor: `${selectedProject.color}15` } : {}}
          >
            <Briefcase size={16} className={selectedProject ? '' : 'text-slate-400'} style={selectedProject ? { color: selectedProject.color } : {}} />
          </div>
          <div className="text-left">
            <div className={`text-sm font-bold ${selectedProject ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
              {selectedProject ? selectedProject.name : 'Assign Project'}
            </div>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-3 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <ProjectList 
            projects={projects} 
            onSelect={(id) => {
              onSelect(id)
              setIsOpen(false)
            }} 
            selectedId={selectedProjectId}
          />
        </div>
      )}
    </div>
  )
}

function ProjectList({ projects, onSelect, selectedId }: { projects: any[], onSelect: (id: string | null) => void, selectedId: string | null }) {
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-bold ${
          selectedId === null ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-slate-300" />
        No Project (Independent)
      </button>
      
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => onSelect(project.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-bold ${
            selectedId === project.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
          {project.name}
        </button>
      ))}

      {projects.length === 0 && (
        <div className="py-4 text-center text-xs text-slate-400 font-medium">
          No projects found. Create one in the Projects page.
        </div>
      )}
    </div>
  )
}
