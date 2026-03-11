import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'
import { describe, it, expect } from 'vitest'

// A simple mock for Link component since we are not rendering within a Router
// We might need a better wrapper if components rely heavily on router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>{children}</a>
  ),
  useRouterState: () => ({ location: { pathname: '/' } }),
}))

describe('Sidebar Component', () => {
  it('renders the sidebar navigation links', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('TimeTrack')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText("Today's Summary")).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})
