/**
 * Parses a duration string like "1h 30m" into seconds.
 * Supports combinations of hours (h) and minutes (m).
 */
export function parseDurationToSeconds(durationStr: string): number {
  const duration = durationStr.toLowerCase().trim()
  if (!duration) return 0

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

  // If no units found, assume minutes if it's just a number
  if (!hoursMatch && !minutesMatch && /^\d+$/.test(duration)) {
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
