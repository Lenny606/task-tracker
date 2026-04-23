/**
 * Parses a duration string into seconds.
 * Supports:
 * - "1h 30m 45s" (combinations of h, m, s)
 * - "01:30:45" (HH:MM:SS)
 * - "30:45" (MM:SS)
 * - "90" (assumed minutes if no units)
 */
export function parseDurationToSeconds(durationStr: string): number {
  const duration = durationStr.toLowerCase().trim()
  if (!duration) return 0

  // Support HH:MM:SS or MM:SS
  if (duration.includes(':')) {
    const parts = duration.split(':').map(p => parseInt(p, 10) || 0)
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1]
    }
  }

  let totalSeconds = 0
  
  // Match hours
  const hoursMatch = duration.match(/(\d+)\s*h/)
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600
  }

  // Match minutes
  const minutesMatch = duration.match(/(\d+)\s*m/)
  if (minutesMatch) {
    totalSeconds += parseInt(minutesMatch[1], 10) * 60
  }

  // Match seconds
  const secondsMatch = duration.match(/(\d+)\s*s/)
  if (secondsMatch) {
    totalSeconds += parseInt(secondsMatch[1], 10)
  }

  // If no units found, assume minutes if it's just a number
  if (!hoursMatch && !minutesMatch && !secondsMatch && !duration.includes(':') && /^\d+$/.test(duration)) {
    totalSeconds = parseInt(duration, 10) * 60
  }

  return totalSeconds
}

/**
 * Formats seconds into a readable "1h 30m" string.
 */
export function formatSecondsToDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  
  return parts.join(' ') || '0m'
}

/**
 * Formats seconds into "HH:MM:SS" string.
 */
export function formatFullTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
