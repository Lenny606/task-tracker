# Project Knowledge Base - Task Tracker

Tento dokument slouží jako hlavní zdroj technických informací o projektu, aby byly uchovány pro budoucí vývoj a údržbu.

## 1. Přehled projektu
**Task Tracker** je webová aplikace určená pro sledování pracovního času, správu úkolů a integraci s JIRA/Tempo. Obsahuje také AI funkce pro analýzu Git commitů a generování popisů práce.

## 2. Technologický Stack
- **Frontend**: React 19, Tailwind CSS (v4), Lucide React (ikony).
- **Framework**: TanStack Start (postaveno na Nitro serveru a TanStack Routeru).
- **Databáze**: SQLite (driver `better-sqlite3`).
- **ORM**: Drizzle ORM (pro typově bezpečné dotazy a migrace).
- **AI**: TanStack AI s integrací na Google Gemini.

## 3. Architektura
Aplikace běží ve dvou hlavních vrstvách:
1.  **Nitro Server (Backend)**: Zpracovává `createServerFn` (serverové funkce). Databázi inicializuje na základě environment proměnné `DATABASE_URL` nebo výchozí cesty.
2.  **React Frontend**: UI vrstva využívající file-based routing a TanStack Query pro synchronizaci stavu.

## 4. Databázové Schéma
Databáze je uložena v souboru `task-tracker.sqlite`.
- **Cesta**: `.db/task-tracker.sqlite` v kořeni projektu.
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
- `npx drizzle-kit generate`: Vygeneruje SQL migrace podle schématu.
- `npx drizzle-kit push`: Sync schématu přímo do lokální DB (vhodné pro rapid dev).

---
*Poslední aktualizace: 6. 7. 2026*
