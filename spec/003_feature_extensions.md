# Specifikace: 003 - Rozšíření funkcí aplikace

Tento dokument je výsledkem analýzy možných rozšíření aplikace **Task Tracker** (nové funkce + úpravy stávajících) provedené 19. 7. 2026. Navazuje na spec 001 (migrace na Turso) a 002 (UX vylepšení) — **neduplikuje** jejich obsah, pouze na něj odkazuje.

> **Progress tracking**: Stav úkolů se udržuje přímo v tomto souboru — checkboxy + tabulka v sekci [Stav prací](#stav-prací). Při dokončení zaškrtni checkbox a aktualizuj tabulku.

---

## 1. Analýza současného stavu

### 1.1 Co aplikace dnes umí

| Oblast | Stav |
|--------|------|
| Denní tracking | Dashboard s úkoly a stopkami, globální timer, flag „vykázáno" (`isMarked`), AI návrhy úkolů (`isAiSuggested`) |
| Přehledy | Denní souhrn (AI sekce, breakdown, statistiky), Historie dnů, týdenní Kalendář (5 dní), Tempo kalendář |
| Jira/Tempo | Vyhledávání issue, zápis worklogů (Tempo v4), výpis/mazání worklogů, formulář s přenosem kontextu přes search params |
| Git | Výpis commitů za den napříč projekty, AI denní report (Gemini/OpenAI) |
| Projekty | Lokální projekty s barvou a časovým rozpočtem vč. progress baru a indikace překročení |
| Agent | Copilot chat s tool-callingem, workflow „příprava worklogů" (deterministický sběr → párování → chirurgické zápisy) |
| Ostatní | Chrome extension (sync timeru), motivační notifikace běžícího úkolu (`useTaskMonitor`), Turso cloud DB, plán mobilní aplikace nad sdílenou DB |

### 1.2 Identifikované mezery (gap analýza)

Hlavní workflow uživatele je: **trackuju čas → na konci dne párují úkoly s Jirou → vykazuju do Tempo**. Analýza kódu ukazuje, že poslední krok je nejpracnější a nejméně podporovaný:

- **G1 — Vykazování je po jednom.** Zápis do Jiry se dělá úkol po úkolu (tlačítko na řádku → formulář `/jira` → submit → ručně `isMarked`). Pro den s 6–8 úkoly to znamená 6–8 průchodů formulářem.
- **G2 — Žádné zaokrouhlování.** Trackované časy jsou na sekundy (`totalSeconds`), ale do Tempo se běžně vykazuje po 15 min. Uživatel zaokrouhluje z hlavy při každém zápisu.
- **G3 — Žádná rekoncilace.** Aplikace nikde neporovná „natrackováno 7:42 vs. vykázáno do Tempo 6:30". Tempo kalendář a lokální data jsou dvě oddělené obrazovky; rozdíl si musí uživatel spočítat sám.
- **G4 — Zapomenutý timer nemá záchranu.** `isRunning` + `startTime` běží klidně přes noc; při dalším otevření aplikace se čas tiše přičte. `useTaskMonitor` jen zobrazuje motivační toasty.
- **G5 — Opakující se úkoly se zakládají ručně.** Standup, meetingy, code review — každý den znovu psát název a párovat Jira klíč.
- **G6 — Analytika končí u dne/týdne.** Neexistuje měsíční pohled, součty per projekt za období, ani export (CSV) pro fakturaci/výkaz.
- **G7 — Dva kalendáře.** `/calendar` (lokální data) a `/tempo-calendar` (Tempo data) zobrazují týž koncept dvěma stránkami — souvisí s G3.

### 1.3 Již rozpracované/naplánované věci (nezahrnovat znovu)

| Dokument | Obsah | Vztah k této spec |
|----------|-------|-------------------|
| `spec/002_ux_improvements.md` | Undo, dialogy, a11y, ikony, jazyk, responsivita, hardcoded `PCSD-24` a 8h cíl → Settings | Prerekvizita pro F4 (rekoncilace čte 8h cíl ze Settings) |
| `jira-frequent-tickets.md` | Časté Jira tickety v našeptávači | Převzato sem jako **F8** (hotový plán, jen realizovat) |
| `soft-delete-projects.md` | Soft delete projektů (`deletedAt`) | Převzato sem jako **F9** (hotový plán) |
| `Specifikace/agenticke_ovladani.md` §6 | Command bar ⌘K, potvrzování destruktivních toolů | Převzato sem jako **F7** a **F10** |

---

## 2. Navržené funkce

Řazeno podle poměru dopad/náročnost. U každé funkce: co, proč, jak (dotčené soubory, změny schématu) a akceptační kritéria.

### F1 — Hromadné vykázání dne do Jiry („Uzavřít den") 🔥

**Problém:** G1 + G2. **Typ:** nová funkce.

Nová akce „Vykázat den" na stránce Souhrn: otevře přehled všech úkolů dne, které mají `jiraKey` a nejsou `isMarked`, s předvyplněnými zaokrouhlenými časy. Uživatel časy zkontroluje/upraví, jedním tlačítkem se vše zapíše do Tempo a úkoly se označí `isMarked`.

**Návrh řešení:**
- Nová komponenta `DayLogReview` (modal nebo sekce v `summary.tsx`): tabulka úkol → Jira klíč → trackovaný čas → navržený (zaokrouhlený) čas (editovatelný) → komentář.
- Úkoly bez `jiraKey` zobrazit taky (šedě) s možností doplnit klíč přes `JiraIssueSelector` — jinak se přeskočí.
- Server: nová fn `bulkLogWorklogsFn` v `jiraServer.ts` — sekvenčně volá stávající Tempo zápis, vrací per-item výsledek (úspěch/chyba). Částečný úspěch: úspěšné položky označit, neúspěšné nechat s chybovou hláškou.
- Po úspěchu zapsat worklogy i do lokální tabulky `worklogs` (`syncedToJira: true`, `jiraWorklogId`) — dnes se to děje per-zápis, zachovat.
- **Invariant:** funkce nikdy nemění `totalSeconds` úkolu — zaokrouhlený čas žije jen ve worklogu (viz paměť projektu: hazard přepisu trackovaného času).

**Akceptační kritéria:**
- Den s 6 úkoly lze vykázat na max. 3 kliknutí (otevřít review → zkontrolovat → potvrdit).
- Chyba u jednoho úkolu nezablokuje ostatní; neúspěšné zůstanou nevykázané a viditelně označené.
- `totalSeconds` žádného úkolu se nezmění.

### F2 — Zaokrouhlování časů pro vykazování

**Problém:** G2. **Typ:** nová funkce (podpůrná pro F1).

- Settings: nové pole `worklogRoundingMinutes` (0 = vypnuto, 5/10/15/30) + strategie (`nearest` / `up`). Rozšíření tabulky `settings` + `settings.tsx`.
- Utilita `roundDuration(seconds, minutes, strategy)` v `src/utils/duration.ts` + testy (hraniční případy: 0 s, přesný násobek, `up` vs `nearest`).
- Použití: předvyplnění ve F1 a ve formuláři `/jira` (pole duration se předvyplní zaokrouhleně, trackovaná hodnota zobrazena vedle pro kontrolu).

**Akceptační kritéria:** Při nastavení 15 min/nearest se 1:07:12 předvyplní jako 1h 15m (a 1:06 jako 1h); vypnuté zaokrouhlování chová se jako dnes.

### F3 — Detekce zapomenutého timeru

**Problém:** G4. **Typ:** nová funkce.

Při načtení aplikace (a periodicky v `useTaskMonitor`) zkontrolovat běžící úkoly a globální timer:
- **Timer běží přes půlnoc** (`startTime` < dnešní 00:00): zobrazit blokující prompt „Úkol X běží od včera 17:32 — kde ho zastavit?" s volbami: zastavit k času `startTime` dne (tj. zahodit noční čas — nabídnout editovatelný čas konce, default např. konec pracovní doby), nebo nechat běžet.
- **Timer běží podezřele dlouho** (konfigurovatelný práh, default 4 h): nenápadný warning toast s akcí „Zastavit".
- Oprava se provede přes existující stop-mutaci s explicitním výpočtem přírůstku — **nikdy** přes přepis celého řádku (hazard `totalSeconds`).

**Návrh řešení:** rozšířit `useTaskMonitor.ts` (dnes jen motivační toasty), práh do Settings (`longRunThresholdMinutes`). Dialog využije `ConfirmDialog` z 002/Fáze 2 — závislost.

**Akceptační kritéria:** Úkol spuštěný včera v 17:00 při dnešním otevření aplikace nepřičte 16 h bez interakce uživatele.

### F4 — Rekoncilace dne (natrackováno vs. vykázáno)

**Problém:** G3. **Typ:** úprava stávajících (Souhrn, Historie, Kalendář).

- V `SummaryStats` přidat třetí metriku: „Vykázáno do Tempo" za den (z Tempo API, cache do `day_metrics` nebo dotaz on-demand) + barevný delta indikátor vůči trackovanému času.
- V Historii a Kalendáři badge stavu dne: ✅ vykázáno vše (delta < tolerance), ⚠️ částečně, ⬜ nevykázáno. Tolerance = zaokrouhlovací krok z F2.
- Návrh schématu: do `day_metrics` přidat `tempoLoggedSeconds` (integer, nullable) + `tempoSyncedAt` (timestamp) jako cache posledního stavu, aby Historie nefetchovala Tempo pro 30 dní najednou.

**Akceptační kritéria:** Na Souhrnu je na první pohled vidět, kolik z trackovaného času je reálně v Tempu; Historie ukazuje stav vykázání bez otevírání Tempo kalendáře.

### F5 — Šablony úkolů a „převzít včerejšek"

**Problém:** G5. **Typ:** nová funkce.

Dvě doplňkové cesty, obě levné:
1. **Převzít úkoly z předchozího dne**: na prázdném Dashboardu (empty state) tlačítko „Převzít včerejší úkoly" — zkopíruje názvy + `jiraKey`/`jiraSummary` + projekt z posledního neprázdného dne, s nulovým časem, `isRunning: false`. (Server fn `copyTasksFromDayFn` v `tasksServer.ts`.)
2. **Šablony**: nová tabulka `task_templates` (`id`, `name`, `jiraKey`, `jiraSummary`, `trackerProjectId`, `sortOrder`). Správa v Settings nebo na Dashboardu („uložit jako šablonu" v řádku úkolu), rychlé přidání přes „+" menu na Dashboardu.

**Akceptační kritéria:** Ranní setup dne (standup + 2 stálé úkoly) zvládnutelný na 2 kliknutí; kopie nikdy nepřenáší čas ani stav stopek.

### F6 — Měsíční přehled a export

**Problém:** G6. **Typ:** nová funkce.

- Nová stránka `/report` (nebo rozšíření Historie): výběr období (měsíc / vlastní rozsah), souhrn per projekt (barvy projektů, podíl, součet) a per Jira klíč, porovnání s cílem (dny × denní cíl ze Settings — závislost na 002/7.5).
- Export CSV (den; úkol; Jira klíč; projekt; sekundy; HH:MM) — čistě klientsky (`Blob` + download), žádná serverová závislost.
- Data: rozšířit `historyTasks.repository.ts` o agregační dotaz per období/projekt (SQL `GROUP BY`, ne načítání všech řádků do JS).

**Akceptační kritéria:** Za libovolný měsíc lze zobrazit součty per projekt a stáhnout CSV; agregace pro 31 dní proběhne jedním dotazem.

### F7 — Command bar (⌘K)

**Problém:** rychlost ovládání; navazuje na `agenticke_ovladani.md` §6. **Typ:** nová funkce.

- Globální overlay (⌘K / Ctrl+K): fuzzy akce — „nový úkol {název}", start/stop úkolu podle názvu, navigace na stránky, „vykázat den" (F1), volný text → předat Copilot agentovi (stejná smyčka, jiný vstup).
- Implementace bez nové závislosti (vlastní komponenta + `useMemo` filtr) nebo `cmdk` — rozhodnout při realizaci.

**Akceptační kritéria:** Start/stop úkolu a založení nového úkolu bez sáhnutí na myš.

### F8 — Časté Jira tickety v našeptávači *(převzato z `jira-frequent-tickets.md`)*

Hotový plán: frekvenční dotaz nad lokální `worklogs` (`worklog.repository.ts` + `getFrequentTicketsFn`), top 3 v dropdownu `JiraIssueSelector` s badge, výběr bez čekání na Jira API. Realizovat beze změn dle původního dokumentu; po dokončení původní soubor smazat/archivovat do `spec/`.

### F9 — Soft delete projektů *(převzato z `soft-delete-projects.md`)*

Hotový plán: `deletedAt` v `tracker_projects`, filtrování v repository a UI, zachování barev/názvů u historických úkolů. Realizovat dle původního dokumentu; poté soubor archivovat.

### F10 — Potvrzování destruktivních akcí agenta

**Problém:** `task_delete_day` a `jira_delete_worklog` agent provede bez potvrzení (viz `agenticke_ovladani.md` §6). **Typ:** úprava stávající funkce.

- V `agentService.ts` označit nástroje `destructive: true`; smyčka u nich nevykoná akci hned, ale emituje event `confirmation_required` do NDJSON streamu; `AgentCopilot.tsx` zobrazí inline potvrzení (Provést / Zrušit) a pošle rozhodnutí zpět.
- Alternativa (jednodušší, ale slabší): destruktivní tooly pouze vrátí „vyžaduje potvrzení" a agent instruovaný promptem se zeptá — nevynucené kódem, nedoporučeno.

**Akceptační kritéria:** Agent nemůže smazat den ani worklog bez explicitního kliknutí uživatele v UI.

---

## 3. Prioritizace a plán

| Pri | Funkce | Dopad | Náročnost | Odhad | Závislosti |
|----:|--------|-------|-----------|-------|------------|
| 1 | F2 Zaokrouhlování | vysoký | nízká | 0,5 dne | — |
| 2 | F1 Hromadné vykázání dne | **nejvyšší** | střední | 1,5–2 dny | F2; Settings pro `PCSD-24` (002/7.4) vhodné dřív |
| 3 | F3 Zapomenutý timer | vysoký (ochrana dat) | nízká–střední | 1 den | ConfirmDialog (002/Fáze 2) |
| 4 | F8 Časté tickety | střední | nízká | 0,5 dne | — (hotový plán) |
| 5 | F4 Rekoncilace dne | vysoký | střední | 1–1,5 dne | F2 (tolerance), 002/7.5 (8h cíl) |
| 6 | F5 Šablony + včerejšek | střední | nízká | 1 den | — |
| 7 | F9 Soft delete projektů | nízký–střední | nízká | 0,5 dne | — (hotový plán) |
| 8 | F6 Měsíční report + CSV | střední | střední | 1,5 dne | 002/7.5 |
| 9 | F10 Potvrzování agenta | střední (bezpečnost) | střední | 1 den | — |
| 10 | F7 Command bar | nízký–střední | střední | 1–1,5 dne | F1 (akce „vykázat den") |

**Doporučené pořadí realizace:** F2 → F1 → F3 tvoří ucelený balík „bezpečné a rychlé vykazování" a řeší tři nejbolestivější mezery (G1, G2, G4). Následně F8 + F4 (viditelnost stavu vykázání), zbytek podle chuti.

**Vazba na 002:** Fáze 1–2 z 002 (undo, ConfirmDialog, toast infrastruktura) jsou stavební kameny pro F1/F3/F10 — doporučeno dokončit aspoň Fázi 2 z 002 před F3.

### Změny DB schématu (souhrn napříč funkcemi)

| Tabulka | Změna | Funkce |
|---------|-------|--------|
| `settings` | + `worklogRoundingMinutes`, `worklogRoundingStrategy`, `longRunThresholdMinutes` | F2, F3 |
| `day_metrics` | + `tempoLoggedSeconds`, `tempoSyncedAt` | F4 |
| `task_templates` | nová tabulka | F5 |
| `tracker_projects` | + `deletedAt` | F9 |

> Pozn.: DB je sdílená s plánovanou mobilní aplikací (Turso) — po každé změně schématu spustit `npm run db:schema:export` a aktualizovat `docs/DB_SCHEMA.md`. Nové sloupce navrhovat nullable/s defaultem, aby mobilní klient nebyl rozbitý.

---

## 4. Otevřená rozhodnutí (potvrdit před realizací)

1. **F1:** Review vykázání jako modal na Souhrnu, nebo samostatná route (např. `/day-close`)? (Spec předpokládá modal/sekci na Souhrnu.)
2. **F3:** Co je default pro „konec dne" u timeru běžícího přes noc — konec pracovní doby (nastavitelný), nebo vždy ruční zadání?
3. **F4:** Cache Tempo stavu v `day_metrics` (rychlé, ale může být stale) vs. on-demand fetch (čerstvé, pomalejší Historie)? Spec doporučuje cache + ruční refresh.
4. **F6:** Samostatná route `/report`, nebo záložka v Historii?
5. **F7:** Vlastní implementace vs. závislost `cmdk`.

---

## Stav prací

Legenda: ⬜ nezahájeno · 🟡 rozpracováno · ✅ hotovo · ⏸️ blokováno/odloženo

| Funkce | Stav | Poslední změna | Poznámka |
|--------|------|----------------|----------|
| F1 — Hromadné vykázání dne | ⬜ | — | |
| F2 — Zaokrouhlování | ✅ | 2026-07-19 | Settings pole, `roundDuration` + testy, použito v `/jira` formuláři |
| F3 — Zapomenutý timer | ⬜ | — | čeká na ConfirmDialog (002) |
| F4 — Rekoncilace dne | ⬜ | — | |
| F5 — Šablony + včerejšek | ⬜ | — | |
| F6 — Měsíční report + CSV | ⬜ | — | |
| F7 — Command bar | ⬜ | — | |
| F8 — Časté tickety | ⬜ | — | hotový plán v `jira-frequent-tickets.md` |
| F9 — Soft delete projektů | ⬜ | — | hotový plán v `soft-delete-projects.md` |
| F10 — Potvrzování agenta | ⬜ | — | |

### Log změn

| Datum | Kdo | Změna |
|-------|-----|-------|
| 2026-07-19 | Claude (analýza rozšíření) | Vytvoření specifikace |
| 2026-07-19 | Claude | F2 implementováno: `settings.worklogRoundingMinutes`/`worklogRoundingStrategy`, `roundDuration()` v `src/utils/duration.ts` + testy, Settings UI karta, prefill v `/jira` formuláři. Migrace `drizzle/0002_deep_jane_foster.sql` vygenerována, ještě nenasazena do Turso — nutno nasadit a poté přegenerovat `docs/DB_SCHEMA.md`. |
