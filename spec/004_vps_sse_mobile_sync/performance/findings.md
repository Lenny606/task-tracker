# Performance a škálovatelnost

## Verdikt

Pro osobní lokální dataset není vidět okamžitý performance blocker. Před multi-client/mobile provozem je ale vhodné odstranit N+1 dotazy, full-table načítání a duplicitní intervaly; u SSE je důležitější backpressure a DB/event-loop chování než počet komponent.

## Zjištění

| Pri | Zjištění | Současný dopad | Budoucí dopad | Evidence / změna |
|---:|---|---|---|---|
| P1 | Project stats dělají `1 + 2N` dotazů a agregují v JS | malé při několika projektech | latence roste s projekty a historií | [src/repositories/trackerProject.repository.ts:37](../../../src/repositories/trackerProject.repository.ts#L37); nahradit SQL agregací/CTE |
| P1 | Copy previous day načte všechny tasky a všechny metrics | zbytečná RAM/latence | lineárně s celou historií | [src/services/tasksServer.ts:237](../../../src/services/tasksServer.ts#L237), [src/services/tasksServer.ts:251](../../../src/services/tasksServer.ts#L251); dotaz na poslední datum + cílový metric |
| P1 | Historický overview může načíst kompletní historii | dnes snesitelné | pomalý mobil a velký response | [src/hooks/useHistoryOverview.ts:9](../../../src/hooks/useHistoryOverview.ts#L9); povinný range/cursor a serverové agregace |
| P1 | Worklog range/recent sloupce nemají indexy | table scan | roste s worklog historií | [src/db/schema.ts:31](../../../src/db/schema.ts#L31); indexy na `started_at`, `created_at`, případně `(user_id, started_at)` |
| P1 | Každá instance `useTasks` spouští 1s React state interval | Sidebar + stránka mohou renderovat paralelně | baterie/CPU na mobilu | [src/hooks/useTasks.ts:63](../../../src/hooks/useTasks.ts#L63), [src/routes/__root.tsx:95](../../../src/routes/__root.tsx#L95); jeden sdílený clock store, tick jen při běžícím timeru |
| P1 | Klientský entry chunk má 514,66 kB minified | první load | horší mobilní TTI | výsledek `npm run build`; lazy-load agent/dev UI a oddělit provider SDK ze server/client grafu |
| P2 | `better-sqlite3` je synchronní | výhoda pro malé transakce | dlouhý dotaz blokuje SSE heartbeat stejného procesu | [src/db/index.ts:35](../../../src/db/index.ts#L35); měřit query latency, zkrátit transakce, neprovádět agregace v request loopu |
| P2 | settings používají vlastní modulový cache/event vedle Query | malé | redundantní fetch/invalidation logika | [src/store/settingsStore.ts:42](../../../src/store/settingsStore.ts#L42); sjednotit s Query key mapou |

## Pozitivní body

- Dashboard načítá historii po dni přes `from/to` ([src/hooks/useTasks.ts:78](../../../src/hooks/useTasks.ts#L78)).
- `history_tasks.date` je indexované a `day_metrics.date` unikátní ([src/db/schema.ts:66](../../../src/db/schema.ts#L66), [src/db/schema.ts:72](../../../src/db/schema.ts#L72)).
- React Query už poskytuje přirozené místo pro targeted invalidation po SSE.
- Produkční build kód rozděluje po routách; největší problém zůstává společný entry chunk.

## Performance pravidla pro SSE

- Jeden SSE stream na přihlášený klient, ne stream pro každou Query.
- Event payload je malá invalidace/cursor, ne celý snapshot.
- Heartbeat 15–25 s; proxy buffering vypnout.
- Pomalému klientovi neomezeně nebufferovat: při překročení limitu spojení ukončit a nechat ho replaynout změny.
- Reconnect jitter/backoff a serverové `retry:`; zabránit reconnect storm po restartu.
- Retence `sync_events` podle času i velikosti; starý cursor vyvolá snapshot, ne neomezený scan.
- Targeted mapování: task event invaliduje jen `['history', date]`, projekt `['projects']`, template `['taskTemplates']`.
- Měřit active connections, reconnect rate, event lag (`latest_seq - client_seq`), response/query latency a počet `resync-required`.

## Doporučený performance budget

Pro první single-user VPS:

- snapshot do 500 ms p95;
- command do 250 ms p95 bez externí Jira/Tempo části;
- event commit → SSE enqueue do 250 ms p95;
- maximálně jeden stream na zařízení/tab;
- žádný DB dotaz bez limitu v sync changes cestě;
- klientský initial JS gzip pod 150 kB jako orientační cíl (současný entry gzip je 157,38 kB, další route chunks jsou zvlášť).

Nejdřív přidat měření; uvedené hodnoty jsou cíle, ne změřený produkční baseline.
