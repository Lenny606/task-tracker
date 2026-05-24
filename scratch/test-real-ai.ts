import { chat } from '@tanstack/ai'
import { createGeminiChat } from '@tanstack/ai-gemini'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.VITE_GEMINI_API_KEY || ''
console.log('API Key length:', apiKey.length)

async function run() {
  try {
    const adapter = createGeminiChat('gemini-2.5-flash', apiKey)
    console.log('Adapter created.')
    const response = await chat({
      adapter,
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    })
    console.log('Response type:', typeof response)
    console.log('Response keys:', Object.keys(response || {}))
    console.log('Response raw:', response)
  } catch (error) {
    console.error('Error running chat:', error)
  }
}

run()
