import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle, getCurrentThemeMode } from './ThemeToggle'

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to auto mode and applies system theme', () => {
    render(<ThemeToggle />)
    expect(getCurrentThemeMode()).toBe('auto')
  })

  it('switches to dark mode on dark button click and sets dark class on html', () => {
    render(<ThemeToggle />)
    const darkBtn = screen.getByLabelText('Tmavý režim')
    fireEvent.click(darkBtn)

    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches to light mode on light button click and sets light class on html', () => {
    render(<ThemeToggle />)
    const lightBtn = screen.getByLabelText('Světlý režim')
    fireEvent.click(lightBtn)

    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})
