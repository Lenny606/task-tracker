# Task Tracker: Core Concepts & Flows

A high-performance desktop application designed to bridge the gap between local development activity and official Jira worklogs. Built with the **TanStack Start** ecosystem and **Electron**.

## 🏗️ Architecture Overview

The project follows a modular, offline-first architecture using a full-stack React approach with server functions and a local SQLite database.

- **Frontend**: React 19, TanStack Router/Query, Tailwind CSS v4.
- **Backend**: TanStack Start Server Functions, Drizzle ORM, SQLite.
- **Platform**: Electron for native desktop capabilities (filesystem access for Git, system tray, etc.).

---

## 💡 Core Concepts

### 1. Local Task Tracking (`history_tasks`)
The heart of the application is the local tracking system. Unlike Jira worklogs which are often entered post-hoc, Task Tracker encourages real-time tracking:
- **Granular Tasks**: Short-lived or long-running tasks tracked with a sub-second precision timer.
- **Day Metrics**: Aggregated data per day, including a "Global Timer" that represents the total billable/working time.
- **Offline First**: All data is stored in a local SQLite database (`.db/sqlite.db`), ensuring no data loss during connectivity issues.

### 2. Evidence-Based Reporting (Git & AI)
The application helps users remember "what they actually did" by surfacing evidence:
- **Git Integration**: Scans local repositories for commits made during the day.
- **AI Summarization**: Uses Gemini/OpenAI to analyze the combination of local tasks and git commits to generate a professional summary of the day's work.

### 3. Jira & Tempo Bridge
Simplifies the overhead of corporate time tracking:
- **Issue Search**: Integrated Jira search to quickly find tickets.
- **Worklog Sync**: Batch-sync local history items into official Jira worklogs in one click.
- **Tempo Integration**: Support for Tempo-specific worklog structures and calendar views.

---

## 🌊 Primary Flows

### 1. Task Lifecycle Flow

1.  **Start**: User enters a task name on the dashboard and hits "Start".
2.  **Track**: The timer updates the local database reactively.
3.  **Transition**: When finished, the task moves to the "History" for that specific day.
4.  **Reconcile**: User reviews history items, potentially merging or editing durations.
5.  **Sync**: User selects tasks and maps them to a Jira issue key to push to the API.

### 2. AI Summary Generation
1.  **Collect**: System fetches all `history_tasks` for a specific `date`.
2.  **Enrich**: System fetches git commits from configured local paths for the same `date`.
3.  **Process**: Data is sent to the `ai.ts` service.
4.  **Display**: AI returns a structured markdown summary shown in the `Summary` route.

### 3. Jira Synchronization
1.  **Mapping**: User picks one or more history items and maps them to a Jira Issue Key (e.g., `PROJ-123`).
2.  **Validation**: `jira.ts` service validates the connection and issue existence.
3.  **Execution**: `jiraServer.ts` executes the worklog creation via the Jira REST API.
4.  **State Update**: The history item is marked as `syncedToJira` to prevent double-logging.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **UI Framework** | React 19 (TanStack Start) |
| **Routing / State** | TanStack Router & TanStack Query |
| **Styling** | Tailwind CSS v4 |
| **Database** | SQLite (Better-SQLite3) |
| **ORM** | Drizzle ORM |
| **API Clients** | Custom Jira & Tempo services (Axios/Fetch) |
| **AI** | TanStack AI (Gemini / OpenAI) |
| **Desktop** | Electron |

---

## 📁 Key Directory Structure

- `src/db/`: Drizzle schema and SQLite initialization.
- `src/repositories/`: Data access layer (CRUD operations for SQLite).
- `src/services/`: External API logic (Jira, Tempo, AI, Git).
- `src/routes/`: Application pages and server functions.
- `src/components/`: Reusable UI components (shadcn-like pattern).
- `electron/`: Main process and IPC handlers.
