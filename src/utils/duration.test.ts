import { describe, it, expect } from 'vitest'
import { roundDuration } from './duration'

describe('roundDuration', () => {
  it('returns the input unchanged when rounding is disabled (0 minutes)', () => {
    expect(roundDuration(0, 0, 'nearest')).toBe(0)
    expect(roundDuration(4032, 0, 'nearest')).toBe(4032)
    expect(roundDuration(4032, 0, 'up')).toBe(4032)
  })

  it('returns 0 seconds unchanged', () => {
    expect(roundDuration(0, 15, 'nearest')).toBe(0)
    expect(roundDuration(0, 15, 'up')).toBe(0)
  })

  it('leaves an exact multiple of the step untouched', () => {
    expect(roundDuration(3600, 15, 'nearest')).toBe(3600) // 1h
    expect(roundDuration(3600, 15, 'up')).toBe(3600)
    expect(roundDuration(900, 15, 'nearest')).toBe(900) // 15m
  })

  it('rounds down to the nearest step when closer to the lower multiple ("nearest")', () => {
    // 1h 06m = 3960s -> closer to 60m (3600s) than 75m (4500s)
    expect(roundDuration(3960, 15, 'nearest')).toBe(3600)
    // 1h 07m 12s = 4032s -> closer to 60m (3600s) than 75m (4500s)
    expect(roundDuration(4032, 15, 'nearest')).toBe(3600)
  })

  it('rounds up to the nearest step when closer to the upper multiple ("nearest")', () => {
    // 1h 10m = 4200s -> closer to 75m (4500s) than 60m (3600s)
    expect(roundDuration(4200, 15, 'nearest')).toBe(4500)
  })

  it('breaks an exact tie by rounding up ("nearest")', () => {
    // 7m 30s is exactly halfway between 0 and 15m
    expect(roundDuration(450, 15, 'nearest')).toBe(900)
  })

  it('always rounds up to the next step when any remainder exists ("up")', () => {
    // 1h 07m 12s = 4032s -> next 15m multiple is 75m (4500s)
    expect(roundDuration(4032, 15, 'up')).toBe(4500)
    expect(roundDuration(1, 15, 'up')).toBe(900)
  })

  it('supports different step sizes (5/10/30 minutes)', () => {
    expect(roundDuration(320, 5, 'nearest')).toBe(300) // 5m20s -> 5m
    expect(roundDuration(400, 10, 'up')).toBe(600) // 6m40s -> 10m
    expect(roundDuration(1000, 30, 'nearest')).toBe(1800) // ~16m40s -> 30m
  })
})
