# Tech Debt Tracking

Generated from `npx fallow` — kept here so we can track cleanup over time.
Last updated: **2026-07-06**

## Baseline metrics

| Metric | Before | After this pass |
|--------|-------:|----------------:|
| Dead files | 3.6% (3/84) | **0.0%** |
| Dead exports | 5.0% (6/121) | **0.0%** |
| Maintainability Index | 91.4 | **92.2** |
| Duplication | 6.3% | 6.4% (untouched) |
| LOC | 11,999 | 11,796 |

---

## ✅ Done in this pass

- **Dead code removed**: deleted `Footer.tsx`, `Header.tsx`, `ThemeToggle.tsx`; un-exported `getSettings`, `AppSettings`, `AppSettingsPatch` (used internally only); removed unused `GitCommit` re-export from `git.ts` and unused `ClientAppSettings` type; removed unused dep `@thomas666/frontend-lib`.
- **Refactor `src/services/migration.ts`** — extracted `migrateSettings` / `migrateDay` / `migrateTask` from the monolithic handler (was cognitive 31).
- **Refactor `src/routes/api.extension.ts`** — extracted the POST timer switch into `toggleTimer` / `saveTimerAsClip` / `updateTimer` / `appendClip` + `readJsonFile` / `jsonResponse` / `getExportPaths` helpers (POST was cognitive 36). Behavior preserved.

---

## 🔴 Refactoring targets — remaining (by priority)

These need dedicated, carefully-verified sessions (they touch high-impact / high-risk code) so were **not** done blindly here.

| Pri | File | Action | Effort | Notes |
|----:|------|--------|--------|-------|
| **25.1** | `src/services/settingsServer.ts` | Split high-impact file (4 dependents amplify every change) | medium | Only 61 LOC and cohesive — splitting is debatable; revisit only if it keeps growing. |
| **21.5** | `src/services/agentService.ts` | Extract `streamOpenAIResponse` (cognitive 54) & `streamGeminiResponse` (cognitive 39) in 904-LOC file | high | Streaming logic — needs the app running to verify. **Highest real value.** |

---

## 🟠 Large functions (>60 LOC = very high risk) — 46 total, top offenders

| LOC | Function | Location |
|----:|----------|----------|
| 804 | `useTasks` | `src/hooks/useTasks.ts:61` |
| 390 | `AgentCopilot` | `src/components/AgentCopilot.tsx:39` |
| 272 | `TempoCalendarPage` | `src/routes/tempo-calendar.tsx:14` |
| 249 | `SummaryBreakdownTable` | `src/components/summary/SummaryBreakdownTable.tsx:44` |
| 223 | `SummaryPage` | `src/routes/summary.tsx:21` |
| 214 | `WorklogForm` | `src/routes/jira.tsx:74` |
| 208 | `Sidebar` | `src/components/Sidebar.tsx:6` |
| 208 | `Dashboard` | `src/routes/index.tsx:17` |
| 200 | `CalendarPage` | `src/routes/calendar.tsx:12` |

> `useTasks` (804 LOC) is the clear next target after the refactoring targets above.

## 🟡 Duplication (2 clone groups ≥3 instances)

| Lines | Instances | Location |
|------:|----------:|----------|
| 12 | 3× | `src/hooks/useTasks.test.tsx:143 / :186 / :261` (test setup — extract a helper) |
| 10 | 3× | `AgentCopilot.tsx:127` · `agentService.ts:601` · `agentService.ts:712` |

## 🟢 Dependencies — test-only in `dependencies` (low priority)

Fallow suggests moving to `devDependencies`. **Not moved** — they are Vite/build tooling and the move could break a production build depending on the deploy flow. Verify deploy installs devDependencies before moving:

- `@tailwindcss/vite`
- `nitro`

---

## Churn hotspots (high churn + complexity)

- `src/routes/commits.tsx` (score 7.9, stable)
- `src/routes/api.extension.ts` (7.4 — partially addressed this pass)
- `src/components/Input.tsx` (6.4, **accelerating** — watch this one)
