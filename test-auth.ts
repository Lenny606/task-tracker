import { jiraClient } from './src/services/jira'
import 'dotenv/config'

async function test() {
  const creds = {
    url: process.env.VITE_JIRA_URL || '',
    email: process.env.VITE_JIRA_EMAIL || '',
    apiKey: process.env.VITE_JIRA_API_KEY || '',
  }

  console.log('Testing Jira credentials:', {
    url: creds.url,
    email: creds.email,
    apiKeyLength: creds.apiKey.length,
  })

  try {
    const data = await jiraClient.fetch(creds, '/rest/api/3/myself')
    console.log('Success! User:', data.displayName)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

test()
