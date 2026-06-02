## Fallow: 49 issues found

### Unused files (9)

- `scratch/check_db.js`
- `scratch/db-migration.js`
- `scratch/fix_db.js`
- `scratch/test-real-ai.ts`
- `scratch/test_params.js`
- `scripts/verify-migration.js`
- `src/repositories/test-db.ts`
- `test-auth.ts`
- `test-search.ts`

### Unused exports (22)

- `src/models/jira.ts`
  - :6 `JiraProjectSchema`
  - :16 `JiraIssueTypeSchema`
  - :26 `JiraIssueSchema`
  - :45 `WorklogSchema`
- `src/repositories/dayMetrics.repository.ts`
  - :5 `DayMetricsRepository`
- `src/repositories/historyTasks.repository.ts`
  - :5 `HistoryTasksRepository`
- `src/repositories/settings.repository.ts`
  - :5 `SettingsRepository`
- `src/repositories/trackerProject.repository.ts`
  - :5 `TrackerProjectRepository`
- `src/repositories/worklog.repository.ts`
  - :5 `WorklogRepository`
- `src/routes/summary.tsx`
  - :23 `SummaryPage`
- `src/services/agentService.ts`
  - :28 `tools`
  - :319 `toolRegistry`
  - :453 `mapMessagesToGemini`
  - :508 `mapMessagesToOpenAI`
- `src/services/ai.ts`
  - :12 `AI_MODELS`
  - :47 `isConfigured`
  - :64 `getAiAdapter`
- `src/services/jiraServer.ts`
  - :64 `createJiraIssueFn`
  - :139 `getJiraProjectsFn`
  - :152 `getJiraMyselfFn`
- `src/store/settingsStore.ts`
  - :35 `loadSettings`
  - :57 `saveSettings`

### Unused type exports (10)

- `src/components/Button.tsx`
  - :4 `ButtonProps`
- `src/components/Input.tsx`
  - :4 `InputProps`
- `src/hooks/useTasks.ts`
  - :31 `DayData`
- `src/models/jira.ts`
  - :57 `JiraProject`
  - :58 `JiraIssueType`
- `src/routes/__root.tsx`
  - :14 `MyRouterContext`
- `src/services/jira.ts`
  - :2 `JiraIssue` (re-export)
  - :3 `TempoWorklogData`
  - :14 `CreateIssueData`
- `src/services/migration.ts`
  - :6 `MigrationPayload`

### Unused dependencies (2)

- `@tanstack/ai-react`
- `@tanstack/react-router-ssr-query`

### Unused devDependencies (1)

- `wait-on`

### Unused class members (1)

- `src/repositories/base.repository.ts`
  - :35 `BaseRepository.findById`

### Unlisted dependencies (2)

- `axios`
- `dotenv`

### Test-only production dependencies (consider moving to devDependencies) (2)

- `@tailwindcss/vite`
- `nitro`


## Fallow: 1 clone group found (0.3% duplication)

### Duplicates

**Clone group 1** (10 lines, 3 instances)

- `src/components/AgentCopilot.tsx:127-136`
- `src/services/agentService.ts:595-604`
- `src/services/agentService.ts:706-715`

### Clone Families

**Family 1** (1 group, 10 lines across `src/components/AgentCopilot.tsx`, `src/services/agentService.ts`)

- Extract shared function (10 lines) from AgentCopilot.tsx, agentService.ts, agentService.ts (~20 lines saved)

**Summary:** 30 duplicated lines (0.3%) across 2 files

## Vital Signs

| Metric | Value |
|:-------|------:|
| Total LOC | 9970 |
| Avg Cyclomatic | 2.6 |
| P90 Cyclomatic | 6 |
| Dead Files | 13.6% |
| Dead Exports | 25.0% |
| Maintainability (avg) | 88.3 |
| Circular Deps | 0 |
| Unused Deps | 3 |

## Fallow: 76 high complexity functions

| File | Function | Severity | Cyclomatic | Cognitive | CRAP | Lines |
|:-----|:---------|:---------|:-----------|:----------|:-----|:------|
| `src/routes/summary.tsx:23` | `SummaryPage` | critical | 31 **!** | 36 **!** | 992.0 **!** | 552 |
| `src/components/Input.tsx:14` | `Input` | critical | 30 **!** | 41 **!** | 930.0 **!** | 84 |
| `src/services/agentService.ts:657` | `streamOpenAIResponse` | critical | 26 **!** | 54 **!** | 702.0 **!** | 105 |
| `src/services/agentService.ts:550` | `streamGeminiResponse` | critical | 25 **!** | 38 **!** | 650.0 **!** | 106 |
| `src/services/migration.ts:23` | `<arrow>` | critical | 21 **!** | 31 **!** | 462.0 **!** | 58 |
| `src/routes/api.extension.ts:70` | `POST` | critical | 20 | 28 **!** | 420.0 **!** | 111 |
| `src/components/AgentCopilot.tsx:93` | `handleSendMessage` | critical | 19 | 27 **!** | 380.0 **!** | 104 |
| `src/routes/projects.tsx:112` | `ProjectCard` | critical | 17 | 15 | 306.0 **!** | 132 |
| `src/components/AgentCopilot.tsx:39` | `AgentCopilot` | critical | 17 | 10 | 306.0 **!** | 390 |
| `src/services/agentService.ts:817` | `runAgentLoop` | critical | 16 | 22 **!** | 272.0 **!** | 81 |
| `src/components/ProjectSelector.tsx:12` | `ProjectSelector` | critical | 14 | 17 **!** | 210.0 **!** | 91 |
| `src/services/agentService.ts:453` | `mapMessagesToGemini` | critical | 13 | 26 **!** | 182.0 **!** | 54 |
| `src/services/tasksServer.ts:124` | `<arrow>` | critical | 13 | 13 | 182.0 **!** | 29 |
| `src/utils/duration.ts:9` | `parseDurationToSeconds` | critical | 13 | 11 | 182.0 **!** | 44 |
| `src/services/tasksServer.ts:9` | `<arrow>` | critical | 12 | 17 **!** | 156.0 **!** | 97 |
| `src/services/agentService.ts:335` | `task_create_or_update` | critical | 12 | 12 | 156.0 **!** | 24 |
| `src/routes/index.tsx:74` | `<arrow>` | critical | 12 | 11 | 156.0 **!** | 116 |
| `src/services/ai.ts:64` | `getAiAdapter` | critical | 11 | 11 | 132.0 **!** | 38 |
| `src/components/Button.tsx:13` | `Button` | critical | 11 | 11 | 132.0 **!** | 57 |
| `extension/popup.js:127` | `<arrow>` | critical | 10 | 10 | 110.0 **!** | 45 |
| `src/routes/jira.tsx:476` | `JiraPage` | critical | 10 | 13 | 110.0 **!** | 102 |
| `src/services/agentService.ts:510` | `<arrow>` | high | 9 | 9 | 90.0 **!** | 27 |
| `src/routes/jira.tsx:74` | `WorklogForm` | high | 9 | 6 | 90.0 **!** | 217 |
| `src/routes/calendar.tsx:121` | `<arrow>` | high | 9 | 7 | 90.0 **!** | 85 |
| `src/components/AgentCopilot.tsx:303` | `<arrow>` | high | 9 | 10 | 90.0 **!** | 39 |
| `src/services/ai.ts:117` | `generateText` | high | 8 | 7 | 72.0 **!** | 21 |
| `src/routes/tempo-calendar.tsx:184` | `<arrow>` | high | 8 | 7 | 72.0 **!** | 99 |
| `src/components/Input.tsx:40` | `iconPaddingStyles` | high | 8 | 14 | 72.0 **!** | 8 |
| `src/components/SectionCard.tsx:14` | `SectionCard` | high | 8 | 5 | 72.0 **!** | 46 |
| `src/routes/projects.tsx:245` | `ProjectModal` | high | 8 | 4 | 72.0 **!** | 123 |
| `src/components/JiraIssueSelector.tsx:7` | `JiraIssueSelector` | high | 8 | 6 | 72.0 **!** | 97 |
| `src/services/jira.ts:46` | `fetch` | high | 8 | 6 | 72.0 **!** | 47 |
| `src/services/extensionAuth.ts:11` | `getOrCreateExtensionToken` | high | 7 | 5 | 56.0 **!** | 24 |
| `src/store/toastStore.ts:36` | `show` | high | 7 | 5 | 56.0 **!** | 23 |
| `src/routes/settings.tsx:17` | `SettingsPage` | high | 7 | 6 | 56.0 **!** | 171 |
| `src/services/jiraServer.ts:99` | `<arrow>` | high | 7 | 6 | 56.0 **!** | 36 |
| `src/routes/__root.tsx:47` | `checkMigration` | high | 7 | 10 | 56.0 **!** | 30 |
| `src/hooks/useTasks.ts:69` | `mutationFn` | high | 7 | 5 | 56.0 **!** | 31 |
| `src/hooks/useTasks.ts:106` | `<arrow>` | high | 7 | 4 | 56.0 **!** | 36 |
| `src/hooks/useTasks.ts:347` | `mutationFn` | high | 7 | 6 | 56.0 **!** | 15 |
| `src/hooks/useTasks.ts:369` | `newTasks` | high | 7 | 9 | 56.0 **!** | 13 |
| `src/components/Sidebar.tsx:6` | `Sidebar` | high | 7 | 6 | 56.0 **!** | 172 |
| `src/repositories/base.repository.ts:15` | `tableName` | high | 7 | 2 | 56.0 **!** | 10 |
| `src/routes/jira.tsx:98` | `<arrow>` | high | 7 | 7 | 56.0 **!** | 11 |
| `src/routes/commits.tsx:63` | `CommitsComponent` | high | 7 | 6 | 56.0 **!** | 177 |
| `src/services/tasksServer.ts:183` | `<arrow>` | moderate | 6 | 2 | 42.0 **!** | 14 |
| `src/services/agentService.ts:324` | `task_get_all` | moderate | 6 | 5 | 42.0 **!** | 11 |
| `src/services/agentService.ts:368` | `task_update_day_metrics` | moderate | 6 | 6 | 42.0 **!** | 11 |
| `src/services/agentService.ts:432` | `convertSchemaToGemini` | moderate | 6 | 6 | 42.0 **!** | 18 |
| `src/routes/history.tsx:77` | `<arrow>` | moderate | 6 | 3 | 42.0 **!** | 73 |
| `src/routes/history.tsx:11` | `HistoryPage` | moderate | 6 | 6 | 42.0 **!** | 144 |
| `src/utils/agentLogger.ts:90` | `logToolResult` | moderate | 6 | 4 | 42.0 **!** | 17 |
| `src/routes/summary.tsx:394` | `<arrow>` | moderate | 6 | 5 | 42.0 **!** | 116 |
| `src/hooks/useTasks.ts:152` | `<arrow>` | moderate | 6 | 6 | 42.0 **!** | 33 |
| `src/hooks/useTasks.ts:477` | `mutationFn` | moderate | 6 | 4 | 42.0 **!** | 26 |
| `src/hooks/useTasks.ts:507` | `<arrow>` | moderate | 6 | 6 | 42.0 **!** | 29 |
| `src/services/projectsServer.ts:22` | `<arrow>` | moderate | 6 | 6 | 42.0 **!** | 19 |
| `extension/popup.js:34` | `refreshUI` | moderate | 6 | 10 | 42.0 **!** | 41 |
| `src/services/jira.ts:182` | `logWork` | moderate | 6 | 6 | 42.0 **!** | 32 |
| `src/services/jira.ts:241` | `<arrow>` | moderate | 6 | 3 | 42.0 **!** | 17 |
| `src/services/jira.ts:218` | `getWorklogs` | moderate | 6 | 6 | 42.0 **!** | 52 |
| `src/routes/jira.tsx:348` | `filteredWorklogs` | moderate | 6 | 3 | 42.0 **!** | 9 |
| `src/routes/jira.tsx:292` | `WorklogList` | moderate | 6 | 4 | 42.0 **!** | 183 |
| `src/routes/tempo-calendar.tsx:46` | `fetchWorklogs` | moderate | 5 | 4 | 30.0 **!** | 29 |
| `src/services/agentService.ts:763` | `executeToolCalls` | moderate | 5 | 6 | 30.0 **!** | 53 |
| `src/repositories/test-db.ts:4` | `testDatabase` | moderate | 5 | 2 | 30.0 **!** | 36 |
| `src/routes/settings.tsx:189` | `ModelSelector` | moderate | 5 | 4 | 30.0 **!** | 88 |
| `src/services/jiraServer.ts:18` | `<arrow>` | moderate | 5 | 6 | 30.0 **!** | 25 |
| `src/services/jiraServer.ts:173` | `<arrow>` | moderate | 5 | 1 | 30.0 **!** | 21 |
| `src/utils/agentLogger.ts:27` | `appendToFile` | moderate | 5 | 5 | 30.0 **!** | 17 |
| `src/store/settingsStore.ts:35` | `loadSettings` | moderate | 5 | 7 | 30.0 **!** | 17 |
| `extension/popup.js:20` | `updateDisplay` | moderate | 5 | 4 | 30.0 **!** | 13 |
| `extension/popup.js:79` | `<arrow>` | moderate | 5 | 4 | 30.0 **!** | 20 |
| `src/services/jira.ts:94` | `tempoFetch` | moderate | 5 | 4 | 30.0 **!** | 25 |
| `test-auth.ts:4` | `test` | moderate | 5 | 4 | 30.0 **!** | 20 |
| `src/routes/api.extension.ts:7` | `getCorsHeaders` | moderate | 5 | 3 | 30.0 **!** | 16 |

**66** files, **571** functions analyzed (thresholds: cyclomatic > 20, cognitive > 15, CRAP >= 30.0)

