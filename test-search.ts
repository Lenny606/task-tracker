import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const JIRA_URL = process.env.VITE_JIRA_URL || '';
const JIRA_EMAIL = process.env.VITE_JIRA_EMAIL || '';
const JIRA_API_KEY = process.env.VITE_JIRA_API_KEY || '';

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_KEY}`).toString('base64');

async function testSearch() {
  console.log('Testing Jira Search...');
  console.log('URL:', JIRA_URL);
  
  try {
    const response = await axios.post(`${JIRA_URL}/rest/api/3/search`, {
      jql: 'order by updated DESC',
      maxResults: 5,
      fields: ['summary', 'key']
    }, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response Status:', response.status);
    console.log('Issues found:', response.data.issues.length);
    response.data.issues.forEach((issue: any) => {
      console.log(`- ${issue.key}: ${issue.fields.summary}`);
    });
  } catch (error: any) {
    console.error('Search Error:', error.response?.status, error.response?.data);
  }
}

testSearch();
