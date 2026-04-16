# Project Knowledge Base - Task Tracker

Tento dokument slouží jako hlavní zdroj technických informací o projektu, aby byly uchovány pro budoucí vývoj a údržbu.

## 1. Přehled projektu
**Task Tracker** je desktopová aplikace (Electron) určená pro sledování pracovního času, správu úkolů a integraci s JIRA/Tempo. Obsahuje také AI funkce pro analýzu Git commitů a generování popisů práce.

## 2. Technologický Stack
- **Frontend**: React 19, Tailwind CSS (v4), Lucide React (ikony).
- **Framework**: TanStack Start (postaveno na Nitro serveru a TanStack Routeru).
- **Desktop Wrapper**: Electron.
- **Databáze**: SQLite (driver `better-sqlite3`).
- **ORM**: Drizzle ORM (pro typově bezpečné dotazy a migrace).
- **AI**: TanStack AI s integrací na Google Gemini.

## 3. Architektura
Aplikace běží ve třech hlavních vrstvách:
1.  **Electron Main Process** (`electron/main.js`): Spravuje životní cyklus oken a spouští backend server. Zjišťuje cestu k uživatelským datům přes `app.getPath('userData')` a tuto cestu předává do backendu.
2.  **Nitro Server (Backend)**: Běží jako sidecar proces v produkci. Zpracovává `createServerFn` (serverové funkce). Databázi inicializuje na základě environment proměnné `DATABASE_URL`.
3.  **React Frontend**: UI vrstva využívající file-based routing a TanStack Query pro synchronizaci stavu.

## 4. Databázové Schéma
Databáze je uložena v souboru `task-tracker.sqlite`.
- **Cesta (Vývoj)**: `.db/task-tracker.sqlite` v kořeni projektu.
- **Cesta (Produkce)**: Složka `userData` (standardní systémové umístění pro data aplikací).
- **Struktura**:
    - **`settings`**: Singleton tabulka pro uložení API klíčů (Jira, Tempo) a výběru AI modelu.
    - **`worklogs`**: Záznamy o odpracovaném čase (issue key, summary, duration, timestamp, sync status).
    - **`projects`**: Cache pro Jira projekty (key, name, avatar).

## 5. Repozitářová vrstva (`src/repositories/`)
Implementuje **Repository Pattern** pro oddělení datové logiky od business logiky:
- `BaseRepository`: Abstraktní třída s generickými metodami.
- `SettingsRepository`: Správa konfigurace aplikace.
- `WorklogRepository`: Správa časových záznamů a jejich synchronizačního stavu.

## 6. Klíčové Služby
- **Jira Service** (`src/services/jira.ts`): Zapouzdřuje komunikaci s Jira Cloud API a Tempo API.
- **AI Service** (`src/services/ai.ts`): Využívá Gemini modely pro analýzu commitů a generování profi reportů pro Jirku.
- **Settings Store** (`src/store/settingsStore.ts`): (Aktuálně) React state s localStorage, určen k postupné migraci na `SettingsRepository`.

## 7. Důležité Příkazy
- `npm run dev`: Spustí Vite dev server.
- `npm run electron:dev`: Spustí Vite + Electron zároveň.
- `npx drizzle-kit generate`: Vygeneruje SQL migrace podle schématu.
- `npx drizzle-kit push`: Sync schématu přímo do lokální DB (vhodné pro rapid dev).

---
*Poslední aktualizace: 16. 4. 2026*
