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
          let timerState = { isRunning: false, startTime: null, taskName: '' }
          try {
            const data = await fs.readFile(timerPath, 'utf-8')
            timerState = JSON.parse(data)
          } catch (e) {}

          if (timerState.isRunning) {
            timerState = { isRunning: false, startTime: null, taskName: '' }
          } else {
            timerState = { isRunning: true, startTime: Date.now(), taskName: body.taskName || 'Untitled Task' }
          }

          await fs.writeFile(timerPath, JSON.stringify(timerState, null, 2))
          responseData.timerState = timerState
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
