import { useEffect, useRef } from 'react'
import { useTasks, type Task } from './useTasks'
import { toast } from '../store/toastStore'

// Hardcoded constants for thresholds as requested
const THRESHOLDS = [
  { seconds: 5, message: 'Test: 5 seconds reached!', type: 'success' as const },
  { seconds: 60, message: 'Test: 1 minute reached!', type: 'info' as const },
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
      if (!task.isRunning) return

      const currentTime = getDisplayTime(task)

      // Initialize tracker for this task if needed
      if (!triggeredRef.current[task.id]) {
        triggeredRef.current[task.id] = new Set()
      }

      const taskTriggered = triggeredRef.current[task.id]

      THRESHOLDS.forEach((threshold) => {
        // If we crossed a threshold and haven't notified yet
        if (currentTime >= threshold.seconds && !taskTriggered.has(threshold.seconds)) {
          toast.show(`Task "${task.name}": ${threshold.message}`, threshold.type)
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
