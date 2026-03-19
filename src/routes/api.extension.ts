import { createFileRoute } from '@tanstack/react-router'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'

export const Route = createFileRoute('/api/extension')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const date = new Date().toISOString().split('T')[0]
        const exportsDir = path.join(process.cwd(), 'exports')
        const clipsPath = path.join(exportsDir, `extension-${date}.json`)
        const timerPath = path.join(exportsDir, `active-timer.json`)

        let clips = []
        try {
          const fileContent = await fs.readFile(clipsPath, 'utf-8')
          clips = JSON.parse(fileContent)
        } catch (e) {}

        let timerState = { isRunning: false, startTime: null, taskName: '' }
        try {
          const data = await fs.readFile(timerPath, 'utf-8')
          timerState = JSON.parse(data)
        } catch (e) {}

        return new Response(JSON.stringify({ clips, timerState }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        })
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const date = new Date().toISOString().split('T')[0]
        const exportsDir = path.join(process.cwd(), 'exports')
        const clipsPath = path.join(exportsDir, `extension-${date}.json`)
        const timerPath = path.join(exportsDir, `active-timer.json`)

        try {
          await fs.mkdir(exportsDir, { recursive: true })
        } catch (e) {}

        let responseData: any = { success: true }

        if (body.type === 'TOGGLE_TIMER') {
          let timerState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }
          try {
            const data = await fs.readFile(timerPath, 'utf-8')
            timerState = JSON.parse(data)
          } catch (e) {}

          if (timerState.isRunning) {
            // Pausing: calculate newly elapsed time and add to accumulated
            const elapsed = Math.floor((Date.now() - (timerState.startTime || Date.now())) / 1000)
            timerState = { 
              ...timerState,
              isRunning: false, 
              startTime: null, 
              accumulatedSeconds: (timerState.accumulatedSeconds || 0) + elapsed 
            }
          } else {
            // Starting/Resuming
            timerState = { 
              ...timerState,
              isRunning: true, 
              startTime: Date.now(),
              taskName: body.taskName || timerState.taskName || 'Untitled Task'
            }
          }

          await fs.writeFile(timerPath, JSON.stringify(timerState, null, 2))
          responseData.timerState = timerState
        } else if (body.type === 'SAVE_TIMER') {
          // Calculate final duration and save as task
          let timerState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }
          try {
            const data = await fs.readFile(timerPath, 'utf-8')
            timerState = JSON.parse(data)
          } catch (e) {}

          let totalElapsed = timerState.accumulatedSeconds || 0
          if (timerState.isRunning && timerState.startTime) {
            totalElapsed += Math.floor((Date.now() - timerState.startTime) / 1000)
          }

          if (totalElapsed > 0) {
            let existingClips = []
            try {
              const data = await fs.readFile(clipsPath, 'utf-8')
              existingClips = JSON.parse(data)
            } catch (e) {}

            existingClips.push({
              id: randomUUID(),
              title: timerState.taskName || 'Timed Task',
              totalSeconds: totalElapsed,
              timestamp: new Date().toISOString(),
              isTimerTask: true
            })

            await fs.writeFile(clipsPath, JSON.stringify(existingClips, null, 2))
          }

          // Reset timer
          const resetState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }
          await fs.writeFile(timerPath, JSON.stringify(resetState, null, 2))
          responseData.timerState = resetState
        } else if (body.type === 'CLEAR_TIMER') {
          const resetState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }
          await fs.writeFile(timerPath, JSON.stringify(resetState, null, 2))
          responseData.timerState = resetState
        } else {
          let existingClips = []
          try {
            const data = await fs.readFile(clipsPath, 'utf-8')
            existingClips = JSON.parse(data)
          } catch (e) {}

          existingClips.push({
            ...body,
            id: randomUUID(),
            timestamp: new Date().toISOString()
          })

          await fs.writeFile(clipsPath, JSON.stringify(existingClips, null, 2))
        }

        return new Response(JSON.stringify(responseData), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        })
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        })
      }
    }
  }
})
