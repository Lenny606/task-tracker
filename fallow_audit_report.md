## Fallow: 29 issues found

### Unused exports (18)

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
- `src/services/agentService.ts`
  - :28 `tools`
- `src/services/ai.ts`
  - :12 `AI_MODELS`
  - :47 `isConfigured`
- `src/services/jira.ts`
  - :45 `jiraClient`
- `src/services/jiraServer.ts`
  - :64 `createJiraIssueFn`
  - :139 `getJiraProjectsFn`
  - :152 `getJiraMyselfFn`
- `src/store/settingsStore.ts`
  - :35 `loadSettings`
  - :57 `saveSettings`

### Unused type exports (5)

- `src/hooks/useTasks.ts`
  - :13 `Task`
  - :25 `GlobalTimer`
- `src/models/jira.ts`
  - :57 `JiraProject`
  - :58 `JiraIssueType`
- `src/services/jira.ts`
  - :2 `JiraIssue` (re-export)

### Unused dependencies (2)

- `@tanstack/ai-react`
- `@tanstack/react-router-ssr-query`

### Unused devDependencies (1)

- `wait-on`

### Unused class members (1)

- `src/repositories/base.repository.ts`
  - :35 `BaseRepository.findById`

### Test-only production dependencies (consider moving to devDependencies) (2)

- `@tailwindcss/vite`
- `nitro`


## Fallow: 2 clone groups found (0.6% duplication)

### Duplicates

**Clone group 1** (10 lines, 3 instances)

- `src/components/AgentCopilot.tsx:127-136`
- `src/services/agentService.ts:595-604`
- `src/services/agentService.ts:706-715`

**Clone group 2** (12 lines, 3 instances)

- `src/hooks/useTasks.test.tsx:128-139`
- `src/hooks/useTasks.test.tsx:171-182`
- `src/hooks/useTasks.test.tsx:230-241`

### Clone Families

**Family 1** (1 group, 12 lines across `src/hooks/useTasks.test.tsx`)

- Extract shared function (12 lines) from useTasks.test.tsx, useTasks.test.tsx, useTasks.test.tsx (~24 lines saved)

**Family 2** (1 group, 10 lines across `src/components/AgentCopilot.tsx`, `src/services/agentService.ts`)

- Extract shared function (10 lines) from AgentCopilot.tsx, agentService.ts, agentService.ts (~20 lines saved)

**Summary:** 66 duplicated lines (0.6%) across 3 files

## Vital Signs

| Metric | Value |
|:-------|------:|
| Total LOC | 11023 |
| Avg Cyclomatic | 2.2 |
| P90 Cyclomatic | 4 |
| Dead Files | 0.0% |
| Dead Exports | 19.2% |
| Maintainability (avg) | 90.3 |
| Circular Deps | 0 |
| Unused Deps | 3 |

## Fallow: 39 high complexity functions

| File | Function | Severity | Cyclomatic | Cognitive | CRAP | Lines |
|:-----|:---------|:---------|:-----------|:----------|:-----|:------|
| `src/routes/summary.tsx:23` | `SummaryPage` | high | 31 **!** | 36 **!** | 34.2 **!** | 552 |
| `src/components/Input.tsx:14` | `Input` | critical | 30 **!** | 41 **!** | 33.0 **!** | 84 |
| `src/services/agentService.ts:657` | `streamOpenAIResponse` | critical | 26 **!** | 54 **!** | 172.0 **!** | 105 |
| `src/services/agentService.ts:550` | `streamGeminiResponse` | critical | 25 **!** | 38 **!** | 160.0 **!** | 106 |
| `src/services/migration.ts:23` | `<arrow>` | critical | 21 **!** | 31 **!** | 462.0 **!** | 58 |
| `src/routes/api.extension.ts:70` | `POST` | critical | 20 | 28 **!** | 420.0 **!** | 111 |
| `src/components/AgentCopilot.tsx:93` | `handleSendMessage` | critical | 19 | 27 **!** | 380.0 **!** | 104 |
| `src/routes/projects.tsx:112` | `ProjectCard` | critical | 17 | 15 | 306.0 **!** | 132 |
| `src/components/AgentCopilot.tsx:39` | `AgentCopilot` | critical | 17 | 10 | 306.0 **!** | 390 |
| `src/services/agentService.ts:817` | `runAgentLoop` | moderate | 16 | 22 **!** | - | 81 |
| `src/components/ProjectSelector.tsx:12` | `ProjectSelector` | moderate | 14 | 17 **!** | - | 91 |
| `src/services/agentService.ts:453` | `mapMessagesToGemini` | high | 13 | 26 **!** | - | 54 |
| `src/services/tasksServer.ts:124` | `<arrow>` | moderate | 13 | 13 | 49.5 **!** | 29 |
| `src/services/tasksServer.ts:9` | `<arrow>` | moderate | 12 | 17 **!** | 43.1 **!** | 97 |
| `src/services/agentService.ts:335` | `task_create_or_update` | moderate | 12 | 12 | 43.1 **!** | 24 |
| `src/routes/index.tsx:74` | `<arrow>` | critical | 12 | 11 | 156.0 **!** | 116 |
| `extension/popup.js:127` | `<arrow>` | critical | 10 | 10 | 110.0 **!** | 45 |
| `src/routes/jira.tsx:476` | `JiraPage` | critical | 10 | 13 | 110.0 **!** | 102 |
| `src/routes/jira.tsx:74` | `WorklogForm` | high | 9 | 6 | 90.0 **!** | 217 |
| `src/components/AgentCopilot.tsx:303` | `<arrow>` | high | 9 | 10 | 90.0 **!** | 39 |
| `src/routes/calendar.tsx:121` | `<arrow>` | high | 9 | 7 | 90.0 **!** | 85 |
| `src/routes/tempo-calendar.tsx:184` | `<arrow>` | high | 8 | 7 | 72.0 **!** | 99 |
| `src/components/SectionCard.tsx:14` | `SectionCard` | high | 8 | 5 | 72.0 **!** | 46 |
| `src/routes/projects.tsx:245` | `ProjectModal` | high | 8 | 4 | 72.0 **!** | 123 |
| `src/store/toastStore.ts:36` | `show` | high | 7 | 5 | 56.0 **!** | 23 |
| `src/routes/settings.tsx:17` | `SettingsPage` | high | 7 | 6 | 56.0 **!** | 171 |
| `src/routes/__root.tsx:47` | `checkMigration` | high | 7 | 10 | 56.0 **!** | 30 |
| `src/routes/jira.tsx:98` | `<arrow>` | high | 7 | 7 | 56.0 **!** | 11 |
| `src/routes/commits.tsx:63` | `CommitsComponent` | high | 7 | 6 | 56.0 **!** | 177 |
| `src/routes/history.tsx:77` | `<arrow>` | moderate | 6 | 3 | 42.0 **!** | 73 |
| `src/routes/history.tsx:11` | `HistoryPage` | moderate | 6 | 6 | 42.0 **!** | 144 |
| `extension/popup.js:34` | `refreshUI` | moderate | 6 | 10 | 42.0 **!** | 41 |
| `src/routes/jira.tsx:348` | `filteredWorklogs` | moderate | 6 | 3 | 42.0 **!** | 9 |
| `src/routes/jira.tsx:292` | `WorklogList` | moderate | 6 | 4 | 42.0 **!** | 183 |
| `src/routes/tempo-calendar.tsx:46` | `fetchWorklogs` | moderate | 5 | 4 | 30.0 **!** | 29 |
| `src/routes/settings.tsx:189` | `ModelSelector` | moderate | 5 | 4 | 30.0 **!** | 88 |
| `extension/popup.js:20` | `updateDisplay` | moderate | 5 | 4 | 30.0 **!** | 13 |
| `extension/popup.js:79` | `<arrow>` | moderate | 5 | 4 | 30.0 **!** | 20 |
| `src/routes/api.extension.ts:7` | `getCorsHeaders` | moderate | 5 | 3 | 30.0 **!** | 16 |

**65** files, **766** functions analyzed (thresholds: cyclomatic > 20, cognitive > 15, CRAP >= 30.0)

