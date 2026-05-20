import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'

const tokenPath = path.join(process.cwd(), 'exports', 'extension-token.json')

/**
 * Retrieves the existing extension authentication token or generates a new one.
 * If process.env.EXTENSION_AUTH_TOKEN is set, it overrides the generated token.
 */
export async function getOrCreateExtensionToken(): Promise<string> {
  // Respect environmental override if set (rule check: no exposed secret values in code)
  if (process.env.EXTENSION_AUTH_TOKEN) {
    return process.env.EXTENSION_AUTH_TOKEN
  }

  try {
    await fs.mkdir(path.dirname(tokenPath), { recursive: true })
  } catch (e) {}

  try {
    const content = await fs.readFile(tokenPath, 'utf-8')
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed.token === 'string' && parsed.token.length > 0) {
      return parsed.token
    }
  } catch (e) {}

  // Generate a brand new, highly secure token on first run
  const newToken = randomUUID().replace(/-/g, '')
  await fs.writeFile(tokenPath, JSON.stringify({ token: newToken }, null, 2), 'utf-8')
  console.log(`[Extension Auth] Created a persistent extension auth token.`)
  return newToken
}

/**
 * Verifies if the incoming token matches the pre-shared token.
 */
export async function verifyExtensionToken(incomingToken: string | null | undefined): Promise<boolean> {
  if (!incomingToken) return false
  const secureToken = await getOrCreateExtensionToken()
  return secureToken === incomingToken
}
