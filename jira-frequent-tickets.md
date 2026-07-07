# Plan: Frequent Jira Tickets in Search

This document outlines the plan to implement a feature showing frequently used JIRA tickets in the search suggestions, prioritising them at the top of results.

## Overview
Many users work on the same Jira issues repeatedly. Instead of searching and waiting for remote JIRA API calls, frequently logged tickets should be easily accessible. We will read worklogs from the local SQLite database, rank them by frequency of use, and show matching frequent tickets at the top of the JIRA search results dropdown.

## Project Type
WEB (TanStack Start / React)

## Success Criteria
1. Extract frequently used JIRA tickets from local worklogs database.
2. Render matching frequent tickets (limit of top 3) at the top of the search suggestions dropdown.
3. Allow selecting these frequent tickets instantly without waiting for JIRA API responses.
4. Clean UI/UX following the existing application aesthetics.

## Tech Stack
- React 19 / TanStack Start
- SQLite (via Drizzle ORM)
- Tailwind CSS v4

## File Structure & Proposed Changes

### [Component Name: Database/Backend]

#### [MODIFY] [worklog.repository.ts](file:///home/tomas/my-projects/task-tracker/src/repositories/worklog.repository.ts)
- Add a query to fetch the top frequently logged issues.

#### [MODIFY] [jiraServer.ts](file:///home/tomas/my-projects/task-tracker/src/services/jiraServer.ts)
- Expose the frequent issues query as a server function `getFrequentTicketsFn`.

### [Component Name: Frontend]

#### [MODIFY] [JiraIssueSelector.tsx](file:///home/tomas/my-projects/task-tracker/src/components/JiraIssueSelector.tsx)
- Load frequent issues on mount.
- Merge and prioritize matching frequent issues (max 3) at the top of the results dropdown.
- Add visual indicators for "frequent" tickets (e.g. an icon or badge).

---

## Task Breakdown

### Task 1: Add getFrequent query in WorklogRepository
- **Agent**: `database-architect`
- **Priority**: High
- **Dependencies**: None
- **INPUT**: Nothing
- **OUTPUT**: Method `getFrequent(limit?: number)` in `WorklogRepository` returning array of unique `jiraIssueKey` and `summary` grouped by key and ordered by count desc.
- **VERIFY**: Call method in a script or test to ensure it queries correct SQL.

### Task 2: Create getFrequentTicketsFn server function
- **Agent**: `backend-specialist`
- **Priority**: High
- **Dependencies**: Task 1
- **INPUT**: None
- **OUTPUT**: Server function `getFrequentTicketsFn` in `src/services/jiraServer.ts`.
- **VERIFY**: Ensure it can be resolved on the frontend.

### Task 3: Implement Frequent Ticket Prioritisation in JiraIssueSelector
- **Agent**: `frontend-specialist`
- **Priority**: High
- **Dependencies**: Task 2
- **INPUT**: JiraIssueSelector React component
- **OUTPUT**: Updated JiraIssueSelector displaying matching frequent tickets first (limit 3).
- **VERIFY**: Run development server, open search dropdown, check if matching local frequent tickets are prioritized.

---

## Phase X: Verification
- [x] Run typescript checks: `npx tsc --noEmit`
- [x] Verify no purple/violet colors used (UI rules)
- [x] Verify test suite passes: `npm run test` or relevant commands
- [x] Verify build is successful: `npm run build`

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-07-07

