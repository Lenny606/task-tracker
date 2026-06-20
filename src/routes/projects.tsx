import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Plus, Trash2, Edit2, Clock, AlertTriangle, CheckCircle2, ChevronRight, Briefcase, X } from 'lucide-react'
import { getProjectsFn, saveProjectFn, deleteProjectFn } from '../services/projectsServer'
import { formatSecondsToDuration } from '../utils/duration'
import { toast } from '../store/toastStore'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjectsFn(),
  })

  const saveMutation = useMutation({
    mutationFn: saveProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsModalOpen(false)
      setEditingProject(null)
      toast.success('Project saved successfully')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProjectFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted')
    },
  })

  const handleEdit = (project: any) => {
    setEditingProject(project)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project? Tasks will lose their association.')) {
      deleteMutation.mutate({ data: { id } })
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <PageHeader
        title="Projects"
        description="Manage project budgets and track time consumption."
        icon={LayoutGrid}
        rightContent={
          <Button
            onClick={() => {
              setEditingProject(null)
              setIsModalOpen(true)
            }}
            icon={Plus}
          >
            New Project
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 glass-panel rounded-3xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-32 glass-panel rounded-[40px] border-dashed border-2 border-slate-200 dark:border-slate-800">
          <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-400">No projects yet</h2>
          <p className="text-slate-500 mt-2">Create your first project to start tracking budgets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project: any) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onEdit={() => handleEdit(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProjectModal 
          project={editingProject} 
          onClose={() => {
            setIsModalOpen(false)
            setEditingProject(null)
          }}
          onSave={(data: any) => saveMutation.mutate({ data })}
          isSubmitting={saveMutation.isPending}
        />
      )}
    </div>
  )
}

interface ProjectCardHeaderProps {
  project: any
  onEdit: () => void
  onDelete: () => void
}

export const ProjectCardHeader: React.FC<ProjectCardHeaderProps> = ({ project, onEdit, onDelete }) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-3">
        <div 
          className="w-3 h-10 rounded-full"
          style={{ backgroundColor: project.color || '#6366f1' }}
        />
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-slate-500 line-clamp-1 mt-1">{project.description}</p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button onClick={onEdit} variant="icon" icon={Edit2} />
        <Button onClick={onDelete} variant="icon" icon={Trash2} />
      </div>
    </div>
  )
}

interface ProjectBudgetProgressProps {
  project: any
  isOverBudget: boolean
  progress: number
}

export const ProjectBudgetProgress: React.FC<ProjectBudgetProgressProps> = ({ project, isOverBudget, progress }) => {
  return (
    <div className="space-y-4 flex-1">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Spent</span>
          <div className={`text-2xl font-mono font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
            {formatSecondsToDuration(project.totalSpentSeconds)}
          </div>
        </div>
        <div className="text-right space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget</span>
          <div className="text-lg font-mono font-bold text-slate-500">
            {project.timeBudgetSeconds > 0 ? formatSecondsToDuration(project.timeBudgetSeconds) : 'No Budget'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
            isOverBudget ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''
          }`}
          style={{ 
            width: `${progress}%`,
            backgroundColor: isOverBudget ? undefined : (project.color || '#6366f1')
          }}
        />
      </div>

      <div className="flex justify-between items-center pt-2">
        {isOverBudget ? (
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider animate-pulse">
            <AlertTriangle size={14} />
            Budget Overflow
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={14} />
            Within Budget ({Math.round(progress)}%)
          </div>
        )}
        
        <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Clock size={12} />
          {Math.round(project.totalSpentSeconds / 3600)}h tracked
        </div>
      </div>
    </div>
  )
}

interface ProjectRelatedTasksProps {
  relatedTasks?: any[]
  showTasks: boolean
  setShowTasks: (show: boolean) => void
}

export const ProjectRelatedTasks: React.FC<ProjectRelatedTasksProps> = ({ relatedTasks, showTasks, setShowTasks }) => {
  if (!relatedTasks || relatedTasks.length === 0) return null

  return (
    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      <button 
        onClick={() => setShowTasks(!showTasks)}
        className="flex items-center justify-between w-full text-slate-500 hover:text-indigo-500 transition-colors"
      >
        <span className="text-xs font-black uppercase tracking-widest">
          Related Tasks ({relatedTasks.length})
        </span>
        <ChevronRight 
          size={16} 
          className={`transition-transform duration-300 ${showTasks ? 'rotate-90 text-indigo-500' : ''}`} 
        />
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        showTasks ? 'max-h-60 mt-4 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <ul className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
          {relatedTasks.map((task: any, i: number) => (
            <li key={i} className="flex flex-col gap-1 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/item">
              <div className="flex justify-between items-start gap-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex-1">
                  {task.name}
                </span>
                <span className="text-[11px] font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md shrink-0">
                  {formatSecondsToDuration(task.seconds)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock size={10} />
                <span>{task.date}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ProjectCard({ project, onEdit, onDelete }: { project: any; onEdit: () => void; onDelete: () => void }) {
  const [showTasks, setShowTasks] = useState(false)
  const progress = project.timeBudgetSeconds > 0 
    ? Math.min((project.totalSpentSeconds / project.timeBudgetSeconds) * 100, 100)
    : 0
  
  const isOverBudget = project.timeBudgetSeconds > 0 && project.totalSpentSeconds > project.timeBudgetSeconds

  return (
    <div className={`glass-panel rounded-[32px] p-6 transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col ${
      isOverBudget ? 'ring-2 ring-red-500/50' : ''
    }`}>
      {/* Background Accent */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-5 blur-3xl rounded-full -mr-10 -mt-10"
        style={{ backgroundColor: project.color || '#6366f1' }}
      />

      <ProjectCardHeader project={project} onEdit={onEdit} onDelete={onDelete} />

      <ProjectBudgetProgress project={project} isOverBudget={isOverBudget} progress={progress} />

      <ProjectRelatedTasks 
        relatedTasks={project.relatedTasks} 
        showTasks={showTasks} 
        setShowTasks={setShowTasks} 
      />
    </div>
  )
}

function ProjectModal({ project, onClose, onSave, isSubmitting }: any) {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [budgetType, setBudgetType] = useState('hours') // 'hours' or 'md'
  const [budgetValue, setBudgetValue] = useState(() => {
    if (!project?.timeBudgetSeconds) return ''
    return (project.timeBudgetSeconds / 3600).toString()
  })
  const [color, setColor] = useState(project?.color || '#6366f1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let seconds = 0
    const val = parseFloat(budgetValue) || 0
    if (budgetType === 'hours') {
      seconds = val * 3600
    } else {
      seconds = val * 8 * 3600 // 1MD = 8h
    }

    onSave({
      id: project?.id,
      name,
      description,
      timeBudgetSeconds: seconds,
      color,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <Button variant="icon" onClick={onClose} icon={X} />
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <Input
            required
            variant="filled"
            size="lg"
            label="Project Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="px-5 py-4 text-lg font-semibold"
            placeholder="e.g. Website Redesign"
          />

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-2xl px-5 py-4 outline-none transition-all font-medium resize-none"
              placeholder="What is this project about?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Budget Value</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  variant="filled"
                  value={budgetValue}
                  onChange={e => setBudgetValue(e.target.value)}
                  className="px-5 py-4 font-mono font-bold flex-1"
                  placeholder="0.0"
                />
                <select 
                  value={budgetType}
                  onChange={e => setBudgetType(e.target.value)}
                  className="w-24 bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl px-3 outline-none font-bold text-xs uppercase tracking-tighter"
                >
                  <option value="hours">Hours</option>
                  <option value="md">MD (8h)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Theme Color</label>
              <div className="flex items-center gap-4 h-[60px] px-4 bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl">
                <Input
                  type="color"
                  variant="ghost"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer p-0 border-none"
                />
                <span className="text-sm font-mono font-bold text-slate-500 uppercase">{color}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!name}
              className="flex-[2] py-4 rounded-2xl font-bold text-lg"
            >
              Save Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
