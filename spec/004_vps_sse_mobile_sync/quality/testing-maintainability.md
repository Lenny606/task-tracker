# Testy, type safety a udržovatelnost

## Ověřené výsledky

| Kontrola | Výsledek | Interpretace |
|---|---|---|
| `npm test` | 14 files / 70 tests passed | stávající unit/component scénáře jsou zelené |
| `npm run build` | exit 0 | Nitro node-server artifact vznikne |
| `npm exec tsc -- --noEmit` | 95 chyb / 25 souborů | build není typecheck gate |
| Fallow health | A / 88,1 | dobrá agregovaná strukturální známka |
| Fallow thresholds | 53 funkcí, 9 critical, 14 high | riziko je koncentrované v několika velkých funkcích |
| Fallow dead code | 1 unused export, 0 cycles | malý cleanup dluh |
| `npm audit --omit=dev` | 8 vulnerabilities: 6 high, 2 low | aktualizovat a ověřit runtime dosažitelnost advisories |

## Nejvýznamnější TypeScript skupiny

- 20 chyb v `src/hooks/useTasks.ts`, převážně unused callback args a typy optimistic cache.
- 20 chyb v `src/services/agentService.test.ts`.
- 9 chyb v `src/services/tasksServer.ts`, včetně implicitního `any` kvůli DB union castu.
- 8 chyb v `src/routes/summary.tsx`, převážně TanStack Router search typy.
- `JiraCredentials` musí být type-only import; stejný problém hlásí SSR build warning v [src/services/agentService.ts:5](../../../src/services/agentService.ts#L5).
- `migrateLocalStorageFn` nemá správně typovaný/inputValidator kontrakt ([src/services/migration.ts:68](../../../src/services/migration.ts#L68)).

Před sync refaktorem je vhodné zavést `typecheck` script a postupně opravit baseline. Jinak nové chyby v serializaci server functions, command DTO a event payloadu zaniknou ve stávajícím šumu.

## Fallow hotspoty

| Severity | Funkce | Metrika |
|---|---|---|
| critical | `AgentCopilot.handleSendMessage` | cyclomatic 21, cognitive 29, 117 řádků, bez odhadované coverage |
| critical | `AgentCopilot` | 416 řádků, CRAP 342 |
| critical | dashboard callback v `routes/index.tsx` | cyclomatic 18, CRAP 342 |
| critical | `SettingsPage` | 437 řádků, CRAP 182 |
| critical | `WorklogForm` | 228 řádků, CRAP 132 |
| high | task server handlers | cyclomatic až 15, pouze částečná odhadovaná coverage |

Fallow používá statický odhad coverage, takže CRAP čísla nejsou náhradou reálného coverage reportu. Směr je ale konzistentní s ruční kontrolou: UI a mutační orchestrace mají mnoho odpovědností.

## Testovací mezery relevantní pro sync

Stávající hook/component testy často mockují server functions. Chybí integrační testy pro:

- skutečný `tasksServer` + temp SQLite;
- auth/ownership na server functions a API routes;
- extension API, token pairing a CORS;
- agent route limity a authorization;
- DB transakce, compare-and-swap a one-running-timer invariant;
- idempotentní retry `clientMutationId`;
- snapshot/changes cursor, tombstones a retenční gap;
- SSE framing, heartbeat, `Last-Event-ID`, disconnect/reconnect a slow consumer;
- migraci a rollback nad kopií reálného schématu;
- local SQLite i Turso adapter contract parity.

## Test isolation problém

Běh testů inicializoval Turso klienta podle lokální `.env`. To znamená, že test suite není hermetická, i když konkrétní test nemusel provést DB dotaz. Povinná náprava:

1. `vitest.setup.ts` nastaví explicitní temp SQLite konfiguraci ještě před importem DB.
2. DB factory v test režimu odmítne `libsql://`, `https://` a jiné remote URL.
3. Každý integrační test dostane vlastní temp DB a migrace.
4. Po testu se zavřou DB klienti, streamy, intervaly a servery; Vitest nesmí čekat na hanging process.

## Doporučené gates

- `npm run typecheck` — nejprve opravit baseline, potom povinný CI gate.
- `npm test` — vždy hermetický.
- `npm run build` — povinný.
- plan-specific integration suite pro sync/SSE.
- Fallow jako trend/gate pro nové issues, ne jako jediný release verdikt.
- dependency SCA a secret scan v CI; Fallow není CVE scanner.

## Dokumentační drift

README je stále téměř výchozí TanStack template. `docs/PROJECT_KNOWLEDGE.md` popisuje settings jako localStorage, ale kód je server-backed. Před VPS rolloutem musí vzniknout jeden kanonický runbook s env kontraktem, migrací, backupem, restore a SSE proxy nastavením.
