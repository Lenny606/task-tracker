import { settingsRepository } from './settings.repository';
import { worklogRepository } from './worklog.repository';

async function testDatabase() {
  console.log('--- Testing Repository Layer ---');

  try {
    // 1. Test Settings
    console.log('[Settings] Saving test settings...');
    await settingsRepository.saveSettings({
      jiraUrl: 'https://test.atlassian.net',
      jiraEmail: 'test@example.com',
    });
    
    const settings = await settingsRepository.getSettings();
    console.log('[Settings] Retrieved:', settings?.jiraUrl === 'https://test.atlassian.net' ? 'SUCCESS' : 'FAILED');

    // 2. Test Worklogs
    console.log('[Worklogs] Creating test worklog...');
    const now = new Date();
    await worklogRepository.create({
      id: `test-${Date.now()}`,
      jiraIssueKey: 'TEST-1',
      summary: 'Test Worklog',
      timeSpentSeconds: 3600,
      startedAt: now,
      comment: 'Verification test',
    });

    const recent = await worklogRepository.getRecent(1);
    console.log('[Worklogs] Recent count:', recent.length);
    console.log('[Worklogs] First entry summary:', recent[0]?.summary);

    console.log('--- Test Completed Successfully ---');
  } catch (error) {
    console.error('--- Test Failed ---');
    console.error(error);
  }
}

// Check if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabase();
}

export { testDatabase };
