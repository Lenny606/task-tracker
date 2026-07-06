import { createFileRoute } from '@tanstack/react-router'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'
import { verifyExtensionToken } from '../services/extensionAuth'

type TimerState = {
  isRunning: boolean
  startTime: number | null
  accumulatedSeconds?: number
  taskName?: string
}

const EMPTY_TIMER: TimerState = { isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }

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

function getExportPaths() {
  const date = new Date().toISOString().split('T')[0]
  const exportsDir = path.join(process.cwd(), 'exports')
  return {
    exportsDir,
    clipsPath: path.join(exportsDir, `extension-${date}.json`),
    timerPath: path.join(exportsDir, `active-timer.json`),
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T
  } catch {
    return fallback
  }
}

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function handleUnauthorized(corsHeaders: Record<string, string>) {
  return jsonResponse({ error: 'Unauthorized: Invalid extension authentication token.' }, corsHeaders, 401)
}

async function writeTimer(timerPath: string, state: TimerState) {
  await fs.writeFile(timerPath, JSON.stringify(state, null, 2))
  return state
}

async function toggleTimer(timerPath: string, body: any) {
  const timerState = await readJsonFile<TimerState>(timerPath, { ...EMPTY_TIMER })

  if (timerState.isRunning) {
    // Pausing: fold newly elapsed time into the accumulated total.
    const elapsed = Math.floor((Date.now() - (timerState.startTime || Date.now())) / 1000)
    return writeTimer(timerPath, {
      ...timerState,
      isRunning: false,
      startTime: null,
      accumulatedSeconds: (timerState.accumulatedSeconds || 0) + elapsed,
    })
  }

  // Starting/resuming
  return writeTimer(timerPath, {
    ...timerState,
    isRunning: true,
    startTime: Date.now(),
    taskName: body.taskName || timerState.taskName || 'Untitled Task',
  })
}

async function saveTimerAsClip(timerPath: string, clipsPath: string) {
  const timerState = await readJsonFile<TimerState>(timerPath, { ...EMPTY_TIMER })

  let totalElapsed = timerState.accumulatedSeconds || 0
  if (timerState.isRunning && timerState.startTime) {
    totalElapsed += Math.floor((Date.now() - timerState.startTime) / 1000)
  }

  if (totalElapsed > 0) {
    const existingClips = await readJsonFile<any[]>(clipsPath, [])
    existingClips.push({
      id: randomUUID(),
      title: timerState.taskName || 'Timed Task',
      totalSeconds: totalElapsed,
      timestamp: new Date().toISOString(),
      isTimerTask: true,
    })
    await fs.writeFile(clipsPath, JSON.stringify(existingClips, null, 2))
  }

  return writeTimer(timerPath, { ...EMPTY_TIMER })
}

async function updateTimer(timerPath: string, body: any) {
  const timerState = await readJsonFile<TimerState>(timerPath, { ...EMPTY_TIMER })
  return writeTimer(timerPath, {
    ...timerState,
    accumulatedSeconds: body.accumulatedSeconds ?? timerState.accumulatedSeconds,
    startTime: body.isRunning ? (body.startTime ?? Date.now()) : null,
    isRunning: body.isRunning ?? timerState.isRunning,
  })
}

async function appendClip(clipsPath: string, body: any) {
  const existingClips = await readJsonFile<any[]>(clipsPath, [])
  existingClips.push({
    ...body,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  })
  await fs.writeFile(clipsPath, JSON.stringify(existingClips, null, 2))
}

async function applyExtensionAction(body: any, timerPath: string, clipsPath: string) {
  const responseData: any = { success: true }

  switch (body.type) {
    case 'TOGGLE_TIMER':
      responseData.timerState = await toggleTimer(timerPath, body)
      break
    case 'SAVE_TIMER':
      responseData.timerState = await saveTimerAsClip(timerPath, clipsPath)
      break
    case 'CLEAR_TIMER':
      responseData.timerState = await writeTimer(timerPath, { ...EMPTY_TIMER })
      break
    case 'UPDATE_TIMER':
      responseData.timerState = await updateTimer(timerPath, body)
      break
    default:
      await appendClip(clipsPath, body)
  }

  return responseData
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

        const { clipsPath, timerPath } = getExportPaths()
        const clips = await readJsonFile<any[]>(clipsPath, [])
        const timerState = await readJsonFile<TimerState>(timerPath, {
          isRunning: false,
          startTime: null,
          taskName: '',
        })

        return jsonResponse({ clips, timerState }, corsHeaders)
      },
      POST: async ({ request }) => {
        const corsHeaders = getCorsHeaders(request)

        // Verify the X-Extension-Auth token (rule check: no exposed secret values in code)
        const incomingToken = request.headers.get('X-Extension-Auth')
        if (!(await verifyExtensionToken(incomingToken))) {
          return handleUnauthorized(corsHeaders)
        }

        const body = await request.json()
        const { exportsDir, clipsPath, timerPath } = getExportPaths()

        try {
          await fs.mkdir(exportsDir, { recursive: true })
        } catch (e) {}

        const responseData = await applyExtensionAction(body, timerPath, clipsPath)

        return jsonResponse(responseData, corsHeaders)
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
