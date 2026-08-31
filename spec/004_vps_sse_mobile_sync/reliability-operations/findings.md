# Reliability a provoz na VPS

## Verdikt

Build lze vytvořit, ale repozitář zatím nemá opakovatelný produkční provozní kontrakt. Největší datová rizika jsou dvojí persistence timeru, netransakční read-modify-write a neexistující backup/restore drill.

## Datová konzistence

| Pri | Zjištění | Dopad | Evidence |
|---:|---|---|---|
| P0 | Task update je full-row last-write-wins bez `version` | dva klienti mohou ztratit čas/změnu | [src/services/tasksServer.ts:134](../../../src/services/tasksServer.ts#L134), [src/repositories/base.repository.ts:58](../../../src/repositories/base.repository.ts#L58) |
| P0 | Start nového tasku zastavuje ostatní sekvenčně na klientu | dva současné running tasky, částečně provedená operace | [src/hooks/useTasks.ts:91](../../../src/hooks/useTasks.ts#L91) |
| P0 | Globální timer zapisuje JSON a DB ve dvou krocích | split brain po selhání druhého kroku | [src/hooks/useTasks.ts:501](../../../src/hooks/useTasks.ts#L501) |
| P0 | Extension JSON používá read-modify-write bez locku/atomic rename | souběžné requesty přepíší clips/timer | [src/routes/api.extension.ts:65](../../../src/routes/api.extension.ts#L65), [src/routes/api.extension.ts:126](../../../src/routes/api.extension.ts#L126) |
| P0 | Tempo je zapsáno před lokálním worklogem, bez idempotence | retry po lokální chybě může duplikovat externí worklog | [src/services/jiraServer.ts:122](../../../src/services/jiraServer.ts#L122) |
| P0 | `worklogs.id` je povinný PK, create ho neposílá | lokální persistence po úspěšném Tempo zápisu pravděpodobně selže | [src/db/schema.ts:31](../../../src/db/schema.ts#L31), [src/services/jiraServer.ts:126](../../../src/services/jiraServer.ts#L126) |
| P1 | Day metric save je read-then-insert/update | race na prvním zápisu dne | [src/repositories/dayMetrics.repository.ts:41](../../../src/repositories/dayMetrics.repository.ts#L41) |
| P1 | Hard delete task/day nemá tombstone | offline klient nepozná smazání | [src/services/tasksServer.ts:167](../../../src/services/tasksServer.ts#L167), [src/services/tasksServer.ts:211](../../../src/services/tasksServer.ts#L211) |
| P1 | UTC `toISOString()` vytváří day key navzdory dokumentovanému local day | chyba dne kolem půlnoci/časových pásem | [src/hooks/useTasks.ts:61](../../../src/hooks/useTasks.ts#L61), [src/services/tasksServer.ts:20](../../../src/services/tasksServer.ts#L20) |
| P1 | Drizzle `default(new Date())` zapeče čas generování do migrace | nepřesné `created_at` u implicitních insertů | [src/db/schema.ts:9](../../../src/db/schema.ts#L9), [drizzle/0000_demonic_scarlet_spider.sql:8](../../../drizzle/0000_demonic_scarlet_spider.sql#L8) |

## Provozní mezery

- `package.json` nemá produkční `start`, typecheck, lint ani migration script ([package.json:11](../../../package.json#L11)).
- Repo nemá deployment manifest, reverse proxy config, health/readiness route ani CI deploy.
- Migrační runner je pouze local SQLite a explicitně vypíná foreign keys ([src/db/migrate.ts:18](../../../src/db/migrate.ts#L18), [src/db/migrate.ts:24](../../../src/db/migrate.ts#L24)).
- `nitro` je nightly alias a několik TanStack balíků je `latest`; lockfile pomáhá, ale čistý reinstall/update je rizikový ([package.json:20](../../../package.json#L20), [package.json:56](../../../package.json#L56)).
- `.env.example` nepokrývá celý runtime kontrakt; OpenAI env názvy jsou nekonzistentní mezi službami.
- Build upozornil na native závislosti pro Linux x64; VPS image musí odpovídat build architektuře.
- Agent log rotuje přepisem po 10 MB, ale neřeší retention, permissions ani redakci citlivých zpráv ([src/utils/agentLogger.ts:27](../../../src/utils/agentLogger.ts#L27)).

## Referenční single-VPS provoz

1. Build v pinovaném Linux image; spouštět `.output/server/index.mjs` jako neprivilegovaný uživatel.
2. Caddy/nginx terminující TLS; aplikace dostupná jen na loopback/private interface.
3. Jedna instance procesu, persistentní adresář DB mimo release adresář.
4. SQLite: WAL, `foreign_keys=ON`, `busy_timeout`, pravidelné `PRAGMA integrity_check` a konzistentní online backup.
5. Denní encrypted off-site backup + retenční politika; pravidelný restore drill do oddělené temp DB.
6. Explicitní migrace před startem s kopií DB, verzí schématu a fail-fast rollback postupem.
7. `/health/live` bez DB a `/health/ready` s krátkým DB checkem; monitoring restartů, disk space, backup age a SSE lag.
8. Structured logs s request ID, user/device ID a event seq, bez promptů, tokenů a payloadů secrets.

## Reverse proxy pro SSE

Minimální požadavky:

- HTTP/1.1 nebo HTTP/2 bez response bufferingu;
- `proxy_buffering off` / ekvivalent a respektovat `X-Accel-Buffering: no`;
- read timeout delší než heartbeat interval;
- gzip/transformace pro `text/event-stream` vypnout;
- žádná CDN cache;
- graceful shutdown: přestat přijímat nové streamy, klientům ukončit spojení a nechat je reconnectnout z cursoru.

## Recovery invarianty

- Commit entity a odpovídající `sync_events` je jedna transakce.
- Úspěšný command lze bezpečně zopakovat se stejným `clientMutationId`.
- Restart procesu neztratí změnu; může ztratit pouze okamžité upozornění, které napraví replay.
- Cursor mimo retenční okno vede na `resync-required` + nový snapshot.
- Snapshot a jeho cursor nesmí mít mezeru: vytvořit je v read transaction, nebo nejprve zachytit high-water mark a tolerovat pouze bezpečné duplicity.
- Mobil ani extension nikdy nezapisují přímo do DB/Turso.
