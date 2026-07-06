# Specifikace: Agentické ovládání aplikace (Task Tracker)

Tento dokument popisuje **aktuální stav** agentického ovládání v aplikaci **Task Tracker**.
Původně sloužil jako příprava návrhu; klíčové otázky (Q1–Q3) jsou dnes zodpovězené a základní
funkčnost je naimplementovaná (viz sekce 3–5).

## 1. Souhrn projektu (Project Summary)

**Task Tracker** je webová aplikace vyvíjená v ekosystému **TanStack Start** (postaveném na
serveru Nitro a TanStack Routeru) s lokální SQLite databází (`better-sqlite3` přes `drizzle-orm`).

Hlavním cílem aplikace je:
- Sledovat odpracovaný čas na úkolech v reálném čase.
- Poskytovat přehledy práce a integrovat lokální vývojové aktivity (Git commity) pro sestavení denních reportů.
- Synchronizovat tyto aktivity s JIRA a modulem Tempo.

## 2. Dostupné AI balíčky v projektu

V `package.json` jsou připraveny knihovny `@tanstack/ai`, `@tanstack/ai-gemini`,
`@tanstack/ai-openai`. Používají se v `src/services/aiCore.ts` pro jednorázové generování textu
(např. denní report z commitů).

> **Pozn.:** Vlastní agentická smyčka (`agentService.ts`) volá Gemini/OpenAI **přímo přes streaming
> fetch (SSE/NDJSON)**, aby měla plnou kontrolu nad tool-calling a streamováním událostí do UI.

## 3. Aktuální stav implementace

### 3.1 UI (Q1)
- **Copilot chat okno** — plovoucí tlačítko vpravo dole + drawer (`src/components/AgentCopilot.tsx`,
  namontováno v `__root.tsx`). Historie v `localStorage`, streaming odpovědí, vizuální indikátory
  běžících toolů, rychlé návrhy (mj. „Prepare worklogs").

### 3.2 Backend (agentická smyčka)
- `runAgentLoop()` v `src/services/agentService.ts` — multi-turn smyčka (max **8** iterací),
  streaming přes NDJSON endpoint `POST /api/agent/chat`, podpora **Gemini i OpenAI**
  (přepínatelné v Settings), dynamické tool-calling. Logování přes `agentLogger`.

### 3.3 Předání UI kontextu (Q3)
Agent pracuje **na pozadí** (DB/API), UI se reaktivně překresluje přes React Query. Frontend navíc
posílá **read-only kontext** (`currentDate`, `route`, `viewedDate`), který se injektuje do system
promptu — díky tomu „dnes" / „den, na který se dívám" odpovídá skutečné obrazovce. Manipulace se
stavem UI (přepínání záložek apod.) záměrně **není** implementována.

### 3.4 Dostupné nástroje (Tools) (Q2)

**Lokální DB — projekty a úkoly**
- `tracker_get_projects` — seznam lokálních projektů
- `task_get_all` — úkoly (dle data / rozsahu)
- `task_create_or_update` — vytvoření/úprava úkolu
- `task_delete` — smazání úkolu
- `task_start_timer` / `task_stop_timer` — spuštění/zastavení stopek (jen jeden běžící timer;
  stop akumuluje čas do `totalSeconds`)
- `task_get_day_metrics` / `task_update_day_metrics` — denní metriky (globální timer, AI summary)
- `task_delete_day` — smazání všech úkolů/metrik dne

**Git a AI reporting**
- `git_get_commits` — commity napříč projekty za den (`collectCommits`)
- `generate_daily_report` — AI denní report z commitů (`analyzeCommitsForJira`)

**Příprava work logů** (viz sekce 4)
- `prepare_worklog_context` — deterministický sběr: commity + vytažené JIRA klíče + existující
  úkoly + dohledaná JIRA summary
- `task_link_jira` — připojí JIRA klíč/summary k **existujícímu** úkolu (časů se nedotkne)
- `task_create_suggestion` — vytvoří **návrh** úkolu (`isAiSuggested`, nulový čas)

**JIRA / Tempo**
- `jira_search_issues`, `jira_create_issue`, `jira_get_issue`
- `jira_log_work` (Tempo v4), `jira_delete_worklog`, `jira_get_worklogs`

## 4. Automatizace přípravy work logů (hlavní workflow)

Cíl: připravit denní úkoly pro zavedení work logů do JIRA z historie commitů s minimem ruční práce.

**Architektura:** deterministický sběr → sémantické párování agentem → cílené zápisy.
1. Agent zavolá `prepare_worklog_context(date?)` (1 volání = commity + regex JIRA klíčů +
   existující úkoly + JIRA lookup).
2. Sémanticky spáruje commit ↔ existující úkol **podle JIRA klíče i podle podobnosti názvu**.
3. Existující úkol: doplní JIRA přes `task_link_jira`. Nový: `task_create_suggestion` (i commity
   **bez** JIRA klíče → návrh pojmenovaný podle commit message).
4. **Nikdy nemění časy ani stopky** — ty má uživatel plně pod kontrolou.

**Vizuální označení návrhů:** úkoly s `isAiSuggested` mají v UI badge „**Návrh AI**" (v `index.tsx`
i v přehledu `SummaryBreakdownTable`). Kliknutím uživatel návrh potvrdí (flag se smaže); smazání
přes standardní tlačítko.

> **Footgun (pozor při úpravách):** `task_create_or_update` / `updateTaskFn` skládají celý řádek
> úkolu s `totalSeconds: … || 0`, takže update bez uvedení času **vynuluje odpracovaný čas**. Proto
> se JIRA na existující úkol připojuje výhradně přes parciální `task_link_jira`.

## 5. Stav klíčových otázek

| Otázka | Stav |
|---|---|
| **Q1 — UI/UX** | ✅ Chat okno (Copilot). Command bar / hlasové ovládání zatím ne. |
| **Q2 — Nástroje** | ✅ Správa úkolů, stopky, JIRA/Tempo, git commity, AI report, příprava work logů. |
| **Q3 — Kontext / UI stav** | ✅ Read-only kontext (datum/route) do promptu. Zápis do UI stavu ne (záměrně). |

## 6. Možná další rozšíření
- Command bar (⌘K) jako druhý vstup nad stejnou smyčkou.
- Potvrzovací krok u destruktivních akcí (`task_delete_day`, `jira_delete_worklog`).
- Hlasové ovládání (Speech-to-Text).

---
*Poslední úprava: 6. 7. 2026*
