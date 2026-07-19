import { useQuery } from '@tanstack/react-query'
import { getProjectsFn } from '../services/projectsServer'
import { Briefcase, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useId } from 'react'

interface ProjectSelectorProps {
  selectedProjectId: string | null
  onSelect: (projectId: string | null) => void
  compact?: boolean
}

export function ProjectSelector({ selectedProjectId, onSelect, compact = false }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  })

  const selectedProject = projects.find((p: any) => p.id === selectedProjectId)

  // Options: index 0 = "no project", then projects
  const optionCount = projects.length + 1

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const close = (refocus = false) => {
    setIsOpen(false)
    setActiveIndex(-1)
    if (refocus) triggerRef.current?.focus()
  }

  const selectByIndex = (index: number) => {
    if (index === 0) {
      onSelect(null)
    } else {
      const project = projects[index - 1]
      if (project) onSelect(project.id)
    }
    close(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        e.stopPropagation()
        close(true)
      }
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(0)
        return
      }
      setActiveIndex((prev) => {
        const delta = e.key === 'ArrowDown' ? 1 : -1
        return (prev + delta + optionCount) % optionCount
      })
      return
    }
    if ((e.key === 'Enter' || e.key === ' ') && isOpen && activeIndex >= 0) {
      e.preventDefault()
      selectByIndex(activeIndex)
    }
  }

  const listboxId = useId()

  const dropdown = isOpen && (
    <div
      role="listbox"
      id={listboxId}
      aria-label="Výběr projektu"
      className={
        compact
          ? 'absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-2 z-[60] animate-in fade-in slide-in-from-top-1 duration-150'
          : 'absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-3 z-[60] animate-in fade-in slide-in-from-top-2 duration-200'
      }
    >
      <ProjectList
        projects={projects}
        onSelect={selectByIndex}
        selectedId={selectedProjectId}
        activeIndex={activeIndex}
      />
    </div>
  )

  if (compact) {
    return (
      <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-label={selectedProject ? `Projekt: ${selectedProject.name}` : 'Přiřadit projekt'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border ${
            selectedProject
              ? 'bg-white dark:bg-slate-900 border-indigo-500/30 text-indigo-500 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
          }`}
          style={selectedProject ? { color: selectedProject.color, borderColor: `${selectedProject.color}33` } : {}}
        >
          <Briefcase size={12} />
          {selectedProject ? selectedProject.name : 'Bez projektu'}
          <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdown}
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={selectedProject ? `Projekt: ${selectedProject.name}` : 'Přiřadit projekt'}
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
              {selectedProject ? selectedProject.name : 'Přiřadit projekt'}
            </div>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdown}
    </div>
  )
}

function ProjectList({ projects, onSelect, selectedId, activeIndex }: {
  projects: any[]
  onSelect: (index: number) => void
  selectedId: string | null
  activeIndex: number
}) {
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
      <button
        role="option"
        aria-selected={selectedId === null}
        onClick={() => onSelect(0)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-bold ${
          selectedId === null ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        } ${activeIndex === 0 ? 'ring-2 ring-indigo-500/40' : ''}`}
      >
        <div className="w-2 h-2 rounded-full bg-slate-300" />
        Bez projektu (nezávislý)
      </button>

      {projects.map((project, i) => (
        <button
          key={project.id}
          role="option"
          aria-selected={selectedId === project.id}
          onClick={() => onSelect(i + 1)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-bold ${
            selectedId === project.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          } ${activeIndex === i + 1 ? 'ring-2 ring-indigo-500/40' : ''}`}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
          {project.name}
        </button>
      ))}

      {projects.length === 0 && (
        <div className="py-4 text-center text-xs text-slate-400 font-medium">
          Žádné projekty. Vytvořte je na stránce Projekty.
        </div>
      )}
    </div>
  )
}
