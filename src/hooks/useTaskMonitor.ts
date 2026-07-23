import { useEffect, useRef } from 'react'
import { useTasks } from './useTasks'
import { toast } from '../store/toastStore'

// Hardcoded constants for thresholds as requested
const THRESHOLDS = [
  { seconds: 1200, message: 'Great job! You\'ve been working for 20 minutes.', type: 'info' as const },
  { seconds: 1500, message: 'Time for a break? 25 minutes reached.', type: 'success' as const },
  { seconds: 3600, message: 'One hour milestone! Take a long stretch.', type: 'warning' as const },
  { seconds: 7200, message: 'Two hours! Real dedication here.', type: 'warning' as const },
]

export function useTaskMonitor() {
  const { tasks, getDisplayTime } = useTasks()

  // Track triggered thresholds to avoid spamming
  // map taskId -> Set of threshold seconds
  const triggeredRef = useRef<Record<string, Set<number>>>({})

  useEffect(() => {
    tasks.forEach((task) => {
      if (!task.isRunning) {
        if (getDisplayTime(task) === 0) {
          delete triggeredRef.current[task.id]
        }
        return
      }

      const currentTime = getDisplayTime(task)
      const isFirstCheck = !triggeredRef.current[task.id]

      // Initialize tracker for this task if needed
      if (isFirstCheck) {
        triggeredRef.current[task.id] = new Set()
      }

      const taskTriggered = triggeredRef.current[task.id]

      THRESHOLDS.forEach((threshold) => {
        // If we crossed a threshold and haven't notified yet
        if (currentTime >= threshold.seconds && !taskTriggered.has(threshold.seconds)) {
          // On initial check for an already-running task, only notify if crossed within the last 30s
          const isRecentlyCrossed = currentTime - threshold.seconds <= 30
          if (!isFirstCheck || isRecentlyCrossed) {
            toast.show(`Task "${task.name}": ${threshold.message}`, threshold.type)
          }
          taskTriggered.add(threshold.seconds)
        }
      })
    })

    // Cleanup untracked tasks from ref periodically or on delete
    const currentIds = new Set(tasks.map((t) => t.id))
    Object.keys(triggeredRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        delete triggeredRef.current[id]
      }
    })
  }, [tasks, getDisplayTime])
}
