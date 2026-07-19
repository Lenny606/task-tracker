# Specifikace: 002 - UX vylepšení front-endu

Tento dokument specifikuje plán UX vylepšení aplikace **TimeTrack** na základě UX auditu z 19. 7. 2026. Práce je rozdělena do fází podle priority (dopad na uživatele vs. náročnost).

> **Progress tracking**: Stav jednotlivých úkolů se udržuje přímo v tomto souboru — checkboxy u úkolů + souhrnná tabulka v sekci [Stav prací](#stav-prací) na konci. Při dokončení úkolu zaškrtni checkbox a aktualizuj tabulku.

---

## 1. Východiska (shrnutí auditu)

**Silné stránky (neměnit):** viditelnost běžícího úkolu (ring, pulz), optimistické aktualizace s rollbackem, empty/loading stavy, toast systém s pauzou na hover, potvrzování AI návrhů kliknutím, přenos kontextu do Jira formuláře přes search params, anti-FOUC dark mode.

**Hlavní problémy:**

| # | Problém | Závažnost |
|---|---------|-----------|
| P1 | Smazání/reset úkolu bez potvrzení a bez undo, hned vedle Play/Pause | Kritická |
| P2 | Nativní `prompt()/alert()/confirm()` místo vlastního UI | Kritická |
| P3 | Chybějící přístupnost (aria-labels, klávesnice, kontrast) | Kritická |
| P4 | Matoucí ikonografie (Database pro Jira, LayoutGrid 2×) | Významná |
| P5 | Jazyková nekonzistence (mix CZ/EN) | Významná |
| P6 | Strukturální šum v sidebaru (timer uprostřed navigace, viditelný /test) | Významná |
| P7 | Nulová responzivita (fixní `w-64` + `ml-64`) | Významná |
| P8 | Skrytá funkcionalita bez afordance (inline editace, editace timeru) | Významná |
| P9 | Mrtvý design systém v styles.css + dva fonty (Manrope + Inter) | Drobná |
| P10 | Hardcoded hodnoty (`PCSD-24`, 8h cíl), validace až po submitu, duplicitní `formatTime` | Drobná |

---

## 2. Fáze 1 — Ochrana dat uživatele (P1)

**Cíl:** Uživatel nemůže jedním překlikem nenávratně přijít o natrackovaný čas.

**Řešení:** Undo toast (preferováno před confirm dialogem — nezdržuje běžný flow).

- [ ] 2.1 Rozšířit `toastStore.ts` o toast s akčním tlačítkem (`toast.undo(message, onUndo)`)
- [ ] 2.2 Smazání úkolu (`index.tsx`, `SummaryBreakdownTable.tsx`): odložit skutečné smazání o ~6 s, toast „Task deleted — Undo"; po vypršení zavolat `deleteTask.mutate`
- [ ] 2.3 Reset úkolu (`index.tsx`): stejný vzor — „Timer reset — Undo" s návratem původního `totalSeconds`
- [ ] 2.4 Vizuálně oddělit destruktivní tlačítka od Play/Pause (větší mezera nebo Delete schovat do „…" menu / zobrazit až na hover řádku)

**Akceptační kritéria:**
- Smazání i reset lze do 6 s vrátit zpět bez ztráty času.
- Play/Pause a Delete nesousedí bez vizuálního oddělení.
- Pozor na hazard z paměti projektu: undo nesmí nikdy přepsat `totalSeconds` jinou hodnotou, než jaká byla v okamžiku akce.

---

## 3. Fáze 2 — Náhrada nativních dialogů (P2)

**Cíl:** Žádné `prompt()`, `alert()`, `confirm()` v kódu.

- [ ] 3.1 Editace globálního timeru (`Sidebar.tsx:24-53`): nahradit `prompt()` inline editací — klik na čas přepne na `<input>` přímo v sidebaru, Enter potvrdí, Escape zruší, validace formátu inline (červený ring + hint)
- [ ] 3.2 `alert()` chyby (`Sidebar.tsx:36,47`, `commits.tsx:79`): nahradit `toast.error(...)`
- [ ] 3.3 `confirm()` na 4 místech (`Sidebar.tsx:136`, `jira.tsx:321`, `history.tsx:133`, `projects.tsx:50`, `AgentCopilot.tsx:87`): vytvořit sdílenou komponentu `ConfirmDialog` (modal, focus trap, Escape zavře) a nasadit ji
- [ ] 3.4 Reset globálního timeru: zvážit undo toast místo confirmu (konzistence s Fází 1)

**Akceptační kritéria:**
- `grep -rn "confirm(\|prompt(\|alert(" src/` vrací 0 výskytů mimo testy.
- Inline editace timeru zvládá formáty HH:MM:SS, MM:SS i raw sekundy (stejně jako dnes).

---

## 4. Fáze 3 — Přístupnost (P3)

**Cíl:** Aplikace je ovladatelná klávesnicí a čitelná pro čtečky obrazovky.

- [ ] 4.1 `aria-label` na všechna icon-only tlačítka (Play/Pause, Reset, Delete, Log to Jira na Dashboardu; reset a play v Sidebaru; dismiss v Toastu)
- [ ] 4.2 `ProjectSelector.tsx`: klávesnicová navigace — Escape zavře, šipky posouvají, Enter vybere; `aria-expanded`, `aria-haspopup`, `role="listbox"`/`option`; fokus se po zavření vrací na trigger
- [ ] 4.3 Toggle „marked" (`index.tsx:87-94`): doplnit `aria-pressed` a `aria-label`
- [ ] 4.4 `JiraIssueSelector.tsx`: stejná klávesnicová pravidla jako 4.2
- [ ] 4.5 Kontrast: projít texty `text-slate-400/500` a mikropopisky `text-[10px]` proti WCAG AA (nástroj: skill `a11y-debugging` / Lighthouse); ztmavit kde nevyhoví
- [ ] 4.6 Toasty: `role="status"` (info/success) a `role="alert"` (error) na kontejneru

**Akceptační kritéria:**
- Celý flow „přidat úkol → spustit → zastavit → smazat → undo" projde jen klávesnicí.
- Lighthouse accessibility skóre ≥ 90 na Dashboardu a Summary.

---

## 5. Fáze 4 — Navigace a ikonografie (P4, P6)

- [ ] 5.1 Vyměnit ikonu **Database** za Jira-příznačnou (např. `Ticket`/`SquareKanban` z lucide) — v sidebaru i na tlačítku „Log to Jira"
- [ ] 5.2 Odstranit duplicitu **LayoutGrid** (Projects vs. Tempo Calendar — Tempo např. `CalendarRange`)
- [ ] 5.3 Přesunout widget Global Timer nad/pod navigaci, aby nedělil seznam odkazů na dvě skupiny
- [ ] 5.4 Přesunout „Sync Extension" k akcím (např. do patičky sidebaru k Settings)
- [ ] 5.5 Skrýt položku **Test** v produkci (zobrazit jen v dev módu — `import.meta.env.DEV`)
- [ ] 5.6 Sjednotit label „Today's Summary" ↔ nadpis stránky „Daily Summary"

**Akceptační kritéria:** Každá ikona v sidebaru je unikátní; navigace je souvislý blok; /test není v produkční navigaci.

---

## 6. Fáze 5 — Jazyk a afordance (P5, P8)

- [ ] 6.1 Rozhodnout cílový jazyk UI (doporučení: **angličtina** všude, formáty datumů mohou zůstat `cs-CZ`) a sjednotit texty („Návrh AI", tooltip „Návrh od agenta…")
- [ ] 6.2 Inline editace názvu úkolu: afordance na hover (ikona tužky nebo podtržení + `cursor: text`)
- [ ] 6.3 Editace globálního timeru: vizuální náznak klikatelnosti (hover ring — část řeší 3.1)
- [ ] 6.4 Vysvětlit význam „marked" toggle (tooltip + aria-label, např. „Mark as done/billed")

---

## 7. Fáze 6 — Úklid a drobnosti (P7, P9, P10)

- [ ] 7.1 Odstranit mrtvý „lagoon/island" design systém ze `styles.css` (proměnné `--sea-*`, `--lagoon*`, `.nav-link`, `.island-shell`, `.feature-card`…), pokud je nepoužívá `about.tsx` — ověřit grepem
- [ ] 7.2 Sjednotit fonty: ponechat jeden (Manrope v CSS **nebo** Inter v `__root.tsx:32`), druhý import smazat
- [ ] 7.3 Minimální responzivita: sidebar sbalitelný pod ~1024 px (hamburger / icon-only rail), task řádek zalamovat (`flex-wrap`)
- [ ] 7.4 Přesunout hardcoded `PCSD-24` (`summary.tsx:133`) do Settings
- [ ] 7.5 Přesunout 8h denní cíl (`summary.tsx:168`) do Settings
- [ ] 7.6 Živá validace formátu duration v Jira formuláři (hint „e.g. 1h 30m" + validace při psaní)
- [ ] 7.7 Skeleton pro `RecentIssuesSelector` místo `null` při načítání (odstranit layout shift)
- [ ] 7.8 Deduplikovat `formatTime` (`Sidebar.tsx:17`, `index.tsx:46`) → `utils/duration.ts`

---

## 8. Doporučené pořadí a odhad

| Fáze | Obsah | Odhad | Poznámka |
|------|-------|-------|----------|
| 1 | Undo pro delete/reset | 0,5 dne | Největší dopad, dělat první |
| 2 | Náhrada nativních dialogů | 0,5–1 den | Závisí na toast/dialog infrastruktuře z Fáze 1 |
| 3 | Přístupnost | 1 den | Nezávislá, lze dělat paralelně |
| 4 | Navigace a ikony | 0,5 dne | Rychlé výhry |
| 5 | Jazyk a afordance | 0,5 dne | Vyžaduje rozhodnutí o jazyce (6.1) |
| 6 | Úklid a drobnosti | 1 den | Lze dávkovat průběžně |

**Otevřená rozhodnutí (nutno potvrdit před realizací):**
1. Undo toast vs. confirm dialog pro mazání (spec předpokládá undo).
2. Cílový jazyk UI (spec doporučuje angličtinu).
3. Rozsah responzivity — stačí sbalitelný sidebar, nebo plný mobile layout? (Pozn.: mobilní použití má řešit samostatná mobilní aplikace nad sdílenou Turso DB — viz paměť projektu; plný mobile web layout je proto pravděpodobně zbytečný.)

---

## Stav prací

Legenda: ⬜ nezahájeno · 🟡 rozpracováno · ✅ hotovo · ⏸️ blokováno/odloženo

| Fáze | Stav | Dokončeno úkolů | Poslední změna | Poznámka |
|------|------|-----------------|----------------|----------|
| 1 — Ochrana dat | ⬜ | 0/4 | — | |
| 2 — Nativní dialogy | ⬜ | 0/4 | — | |
| 3 — Přístupnost | ⬜ | 0/6 | — | |
| 4 — Navigace a ikony | ⬜ | 0/6 | — | |
| 5 — Jazyk a afordance | ⬜ | 0/4 | — | čeká na rozhodnutí o jazyce |
| 6 — Úklid | ⬜ | 0/8 | — | |

### Log změn

| Datum | Kdo | Změna |
|-------|-----|-------|
| 2026-07-19 | Claude (UX audit) | Vytvoření specifikace |
