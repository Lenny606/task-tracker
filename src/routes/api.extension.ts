import { createFileRoute } from '@tanstack/react-router'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'
import { verifyExtensionToken } from '../services/extensionAuth'
import { timerEventEmitter } from '../services/timerEvents'

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || ''
  const isAllowedOrigin = 
    origin.startsWith('chrome-extension://') || 
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:')
  
  const allowOrigin = isAllowedOrigin ? origin : 'http://localhost:3000'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Extension-Auth',
    'Access-Control-Max-Age': '86400',
  }
}

async function handleUnauthorized(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: 'Unauthorized: Invalid extension authentication token.' }), {
    status: 401,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    }
  })
}

async function handleToggleTimer(body: any, timerPath: string) {
  let timerState = { isRunning: false, startTime: null as number | null, accumulatedSeconds: 0, taskName: '' }
  try {
    const data = await fs.readFile(timerPath, 'utf-8')
    timerState = JSON.parse(data)
  } catch (e) {}

  if (timerState.isRunning) {
    const elapsed = Math.floor((Date.now() - (timerState.startTime || Date.now())) / 1000)
    timerState = { 
      ...timerState,
      isRunning: false, 
      startTime: null, 
      accumulatedSeconds: (timerState.accumulatedSeconds || 0) + elapsed 
    }
  } else {
    timerState = { 
      ...timerState,
      isRunning: true, 
      startTime: Date.now(),
      taskName: body.taskName || timerState.taskName || 'Untitled Task'
    }
  }

  await fs.writeFile(timerPath, JSON.stringify(timerState, null, 2))
  return timerState
}

async function handleSaveTimer(clipsPath: string, timerPath: string) {
  let timerState = { isRunning: false, startTime: null as number | null, accumulatedSeconds: 0, taskName: '' }
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

  const resetState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }
  await fs.writeFile(timerPath, JSON.stringify(resetState, null, 2))
  return resetState
}

async function handleClearTimer(timerPath: string) {
  const resetState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }
  await fs.writeFile(timerPath, JSON.stringify(resetState, null, 2))
  return resetState
}

async function handleUpdateTimer(body: any, timerPath: string) {
  let timerState = { isRunning: false, startTime: null as number | null, accumulatedSeconds: 0, taskName: '' }
  try {
    const data = await fs.readFile(timerPath, 'utf-8')
    timerState = JSON.parse(data)
  } catch (e) {}

  timerState = {
    ...timerState,
    accumulatedSeconds: body.accumulatedSeconds ?? timerState.accumulatedSeconds,
    startTime: body.isRunning ? (body.startTime ?? Date.now()) : null,
    isRunning: body.isRunning ?? timerState.isRunning,
  }

  await fs.writeFile(timerPath, JSON.stringify(timerState, null, 2))
  return timerState
}

async function handleDefaultClip(body: any, clipsPath: string) {
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

export const Route = createFileRoute('/api/extension')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const corsHeaders = getCorsHeaders(request)

        // Verify the X-Extension-Auth token (rule check: no exposed secret values in code)
        const incomingToken = request.headers.get('X-Extension-Auth')
        if (!(await verifyExtensionToken(incomingToken))) {
          return handleUnauthorized(corsHeaders)
        }

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

        return new Response(JSON.stringify({ clips, timerState, serverTime: Date.now() }), {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        })
      },
      POST: async ({ request }) => {
        const corsHeaders = getCorsHeaders(request)

        // Verify the X-Extension-Auth token (rule check: no exposed secret values in code)
        const incomingToken = request.headers.get('X-Extension-Auth')
        if (!(await verifyExtensionToken(incomingToken))) {
          return handleUnauthorized(corsHeaders)
        }

        const body = await request.json()
        const date = new Date().toISOString().split('T')[0]
        const exportsDir = path.join(process.cwd(), 'exports')
        const clipsPath = path.join(exportsDir, `extension-${date}.json`)
        const timerPath = path.join(exportsDir, `active-timer.json`)

        try {
          await fs.mkdir(exportsDir, { recursive: true })
        } catch (e) {}

        let responseData: any = { success: true }
        let timerUpdated = false

        if (body.type === 'TOGGLE_TIMER') {
          responseData.timerState = await handleToggleTimer(body, timerPath)
          timerUpdated = true
        } else if (body.type === 'SAVE_TIMER') {
          responseData.timerState = await handleSaveTimer(clipsPath, timerPath)
          timerUpdated = true
        } else if (body.type === 'CLEAR_TIMER') {
          responseData.timerState = await handleClearTimer(timerPath)
          timerUpdated = true
        } else if (body.type === 'UPDATE_TIMER') {
          responseData.timerState = await handleUpdateTimer(body, timerPath)
          timerUpdated = true
        } else {
          await handleDefaultClip(body, clipsPath)
        }

        responseData.serverTime = Date.now()

        if (timerUpdated && responseData.timerState) {
          timerEventEmitter.broadcastUpdate({
            type: 'TIMER_UPDATE',
            timerState: responseData.timerState,
            serverTime: responseData.serverTime
          })
        }

        return new Response(JSON.stringify(responseData), {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        })
      },
      OPTIONS: async ({ request }) => {
        const corsHeaders = getCorsHeaders(request)
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        })
      }
    }
  }
})
