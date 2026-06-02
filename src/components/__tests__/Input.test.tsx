import React, { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input'

// Dummy icon for testing icon rendering
const DummyIcon = ({ className }: { className?: string }) => (
  <svg data-testid="dummy-icon" className={className} />
)

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input placeholder="Enter text..." />)
    const inputElement = screen.getByPlaceholderText('Enter text...')
    expect(inputElement).toBeInTheDocument()
    expect(inputElement).toHaveClass('bg-white')
    expect(inputElement).toHaveClass('px-4') // default size md styles
  })

  it('renders a label when the label prop is provided', () => {
    render(<Input label="Username" placeholder="Enter username" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('renders an error message and applies error styles', () => {
    render(<Input error="Field is required" placeholder="Input" />)
    expect(screen.getByText('Field is required')).toBeInTheDocument()
    const inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('border-red-500')
  })

  it('renders the icon on the left by default', () => {
    render(<Input icon={DummyIcon} placeholder="Input" />)
    const icon = screen.getByTestId('dummy-icon')
    expect(icon).toBeInTheDocument()
    const inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('pl-10') // size md pl padding
  })

  it('renders the icon on the right when iconPosition is right', () => {
    render(<Input icon={DummyIcon} iconPosition="right" placeholder="Input" />)
    const icon = screen.getByTestId('dummy-icon')
    expect(icon).toBeInTheDocument()
    const inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('pr-10') // size md pr padding
  })

  it('shows a loading spinner instead of the icon on the left', () => {
    render(<Input icon={DummyIcon} isLoading={true} iconPosition="left" placeholder="Input" />)
    // Should render SVG with animate-spin
    const inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('pl-10')
  })

  it('applies correct variant styling classes', () => {
    const { rerender } = render(<Input variant="filled" placeholder="Input" />)
    let inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('bg-slate-50')

    rerender(<Input variant="ghost" placeholder="Input" />)
    inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('bg-transparent')
    expect(inputElement).toHaveClass('border-none')
  })

  it('applies correct size styling classes', () => {
    const { rerender } = render(<Input size="sm" placeholder="Input" />)
    let inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('px-3')
    expect(inputElement).toHaveClass('text-xs')

    rerender(<Input size="lg" placeholder="Input" />)
    inputElement = screen.getByPlaceholderText('Input')
    expect(inputElement).toHaveClass('px-5')
    expect(inputElement).toHaveClass('text-base')
  })

  it('forwards the ref correctly', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Input" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.placeholder).toBe('Input')
  })

  it('allows user text input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })
})
