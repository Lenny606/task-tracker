import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock react-router createFileRoute
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (path: string) => {
    return (options: any) => ({
      path,
      options,
    })
  },
}))

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}))

import {
  ProjectCardHeader,
  ProjectBudgetProgress,
  ProjectRelatedTasks,
  ProjectCard
} from '../projects'

describe('Project Components', () => {
  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A mock project description',
    color: '#ff0000',
    totalSpentSeconds: 7200, // 2 hours
    timeBudgetSeconds: 10800, // 3 hours
    relatedTasks: [
      { name: 'Task 1', seconds: 3600, date: '2026-06-01' },
      { name: 'Task 2', seconds: 3600, date: '2026-06-02' }
    ]
  }

  describe('ProjectCardHeader', () => {
    it('renders project name and description correctly', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <ProjectCardHeader
          project={mockProject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.getByText('A mock project description')).toBeInTheDocument()
    })

    it('triggers onEdit and onDelete callbacks', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()

      render(
        <ProjectCardHeader
          project={mockProject}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )

      // The edit button uses Edit2 icon. Let's find it.
      // There are 2 buttons, first is Edit, second is Delete.
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)

      fireEvent.click(buttons[0])
      expect(onEdit).toHaveBeenCalled()

      fireEvent.click(buttons[1])
      expect(onDelete).toHaveBeenCalled()
    })
  })

  describe('ProjectBudgetProgress', () => {
    it('renders within budget status correctly', () => {
      render(
        <ProjectBudgetProgress
          project={mockProject}
          isOverBudget={false}
          progress={66}
        />
      )

      expect(screen.getByText('Within Budget (66%)')).toBeInTheDocument()
      expect(screen.queryByText('Budget Overflow')).not.toBeInTheDocument()
      expect(screen.getByText('2h')).toBeInTheDocument() // 7200 seconds
      expect(screen.getByText('3h')).toBeInTheDocument() // 10800 seconds
    })

    it('renders budget overflow status when over budget', () => {
      const overBudgetProject = {
        ...mockProject,
        totalSpentSeconds: 14400, // 4 hours
      }

      render(
        <ProjectBudgetProgress
          project={overBudgetProject}
          isOverBudget={true}
          progress={100}
        />
      )

      expect(screen.getByText('Budget Overflow')).toBeInTheDocument()
      expect(screen.queryByText(/Within Budget/)).not.toBeInTheDocument()
      expect(screen.getByText('4h')).toBeInTheDocument()
    })
  })

  describe('ProjectRelatedTasks', () => {
    it('returns null if no related tasks are provided', () => {
      const { container } = render(
        <ProjectRelatedTasks
          relatedTasks={[]}
          showTasks={false}
          setShowTasks={vi.fn()}
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders task list toggle header and triggers click callback', () => {
      const setShowTasks = vi.fn()
      render(
        <ProjectRelatedTasks
          relatedTasks={mockProject.relatedTasks}
          showTasks={false}
          setShowTasks={setShowTasks}
        />
      )

      const toggleButton = screen.getByRole('button', { name: /Related Tasks/ })
      expect(toggleButton).toHaveTextContent('Related Tasks (2)')
      
      fireEvent.click(toggleButton)
      expect(setShowTasks).toHaveBeenCalledWith(true)
    })

    it('displays tasks details when showTasks is true', () => {
      render(
        <ProjectRelatedTasks
          relatedTasks={mockProject.relatedTasks}
          showTasks={true}
          setShowTasks={vi.fn()}
        />
      )

      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getAllByText('1h')).toHaveLength(2) // 3600 seconds each formatted to 1h
      expect(screen.getByText('2026-06-01')).toBeInTheDocument()
      expect(screen.getByText('2026-06-02')).toBeInTheDocument()
    })
  })

  describe('ProjectCard integration', () => {
    it('calculates budget progress and renders all components properly', () => {
      render(
        <ProjectCard
          project={mockProject}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      // Header is rendered
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      // Budget progress is rendered (7200 / 10800 = 66.666% progress -> ~67%)
      expect(screen.getByText('Within Budget (67%)')).toBeInTheDocument()
      // Related tasks toggle is rendered
      expect(screen.getByText(/Related Tasks \(2\)/)).toBeInTheDocument()
    })
  })
})
