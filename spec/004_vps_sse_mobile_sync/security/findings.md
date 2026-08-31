# Security audit

## Verdikt

Veřejné vystavení aplikace na VPS je v aktuálním stavu P0 riziko. Největší problém není kryptografie ani SSE, ale chybějící autentizace/autorizace na aplikačních serverových funkcích a API routes.

## Potvrzená zjištění

| Pri | Zjištění | Dopad | Evidence | Náprava |
|---:|---|---|---|---|
| P0 | Server functions nemají session ani ownership check | libovolný návštěvník může číst/měnit/mazat tasky, projekty, settings a volat Jira/Tempo | [src/services/tasksServer.ts:116](../../../src/services/tasksServer.ts#L116), [src/services/projectsServer.ts:12](../../../src/services/projectsServer.ts#L12), [src/services/settingsServer.ts:29](../../../src/services/settingsServer.ts#L29), [src/services/jiraServer.ts:90](../../../src/services/jiraServer.ts#L90) | centrální auth guard + povinný `user_id` v každém repository dotazu |
| P0 | `/api/agent/chat` je bez auth, limitu body a rate limitu | náklady na LLM, exfiltrace lokálních dat a mutační agent tools | [src/routes/api.agent.chat.ts:4](../../../src/routes/api.agent.chat.ts#L4), [src/routes/api.agent.chat.ts:7](../../../src/routes/api.agent.chat.ts#L7) | auth, Zod request schema, body/time/tool limity, rate limit, audit log bez citlivého obsahu |
| P0 | Extension token vydává unauthenticated server function | token přestává být tajemstvím po zveřejnění serveru | [src/services/extensionTokenServer.ts:4](../../../src/services/extensionTokenServer.ts#L4) | endpoint odstranit; pairing/rotace jen po přihlášení, hash tokenu v DB |
| P0 | Všechny tabulky jsou globální | žádná izolace účtu ani event streamu | [src/db/schema.ts:3](../../../src/db/schema.ts#L3), [src/db/schema.ts:52](../../../src/db/schema.ts#L52) | seeded single-user účet nyní, `user_id` + compound constraints od první sync migrace |
| P0 | API klíče jsou plaintext ve singleton settings řádku | únik DB/backup znamená únik Jira, Tempo a LLM credentials | [src/db/schema.ts:14](../../../src/db/schema.ts#L14) | na VPS preferovat env/secret store; případná DB secrets šifrovat odděleným master key |
| P0 | Verzované runtime exporty a agent log | task data, chat/prompty a tool výsledky mohou skončit v Git historii | [.gitignore:14](../../../.gitignore#L14), [src/utils/agentLogger.ts:45](../../../src/utils/agentLogger.ts#L45) | `git rm --cached` až po schválení, revize historie, rotace všech potenciálně zachycených credentials |
| P1 | CORS dovolí libovolné `chrome-extension://` origin | cizí extension může z browseru volat API, pokud získá token | [src/routes/api.extension.ts:16](../../../src/routes/api.extension.ts#L16) | přesný extension ID allowlist + HTTPS origin konfigurace |
| P0 | Útočník může změnit `jiraUrl`, ponechat uložený klíč a vyvolat Jira request | Basic hlavička s e-mailem a API tokenem může odejít na útočníkův HTTP/HTTPS host | [src/services/settingsServer.ts:29](../../../src/services/settingsServer.ts#L29), [src/services/settingsServer.ts:46](../../../src/services/settingsServer.ts#L46), [src/services/jira.ts:55](../../../src/services/jira.ts#L55), [src/services/jira.ts:71](../../../src/services/jira.ts#L71) | auth/authorization a exact Jira hostname allowlist; zakázat private/link-local IP a vyžadovat HTTPS |
| P1 | localStorage migrace posílá libovolný starý payload do shared DB bez input validatoru | po VPS nasazení může každý nový browser vložit data/settings | [src/routes/__root.tsx:60](../../../src/routes/__root.tsx#L60), [src/services/migration.ts:68](../../../src/services/migration.ts#L68) | odstranit po jednorázové migraci nebo chránit admin-only tokenem a striktním schématem |
| P1 | DB loguje celé Turso URL | hostname/identifikátor DB uniká do log aggregation | [src/db/index.ts:25](../../../src/db/index.ts#L25) | logovat jen adapter a redigovaný host |
| P1 | Testy načetly reálně vypadající Turso konfiguraci | test může omylem číst/zapsat produkční DB | [src/db/index.ts:24](../../../src/db/index.ts#L24), [vite.config.ts:17](../../../vite.config.ts#L17) | v test setup povinně vnutit temp SQLite a fail-fast při cloud URL |

## Minimální security baseline pro VPS

1. TLS přes Caddy/nginx a zavřený origin port v firewallu.
2. Jediný lokální účet bez registrace; heslo hashované Argon2id a server-side sessions.
3. `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookie; CSRF ochrana přes same-origin check a token u citlivých POST.
4. Jeden auth/authorization guard sdílený server functions, REST sync routes, SSE, agentem a extension pairingem.
5. Rate limits zvlášť pro login, agent, Jira search/worklog a sync commands.
6. Secret fields mimo mobile sync payload; žádné DB/token hodnoty v klientském bundle/logu.
7. Přesné CORS originy. Pro same-origin web CORS vůbec není potřeba.
8. Security headers: CSP bez obecného `unsafe-inline`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame policy.

## SSE autentizace

Browserový `EventSource` neumí spolehlivě přidat vlastní `Authorization` header. Pro web proto použít same-origin HttpOnly session cookie. Mobil má použít fetch-based SSE klienta s Bearer/access tokenem; dlouhodobý access token se nesmí dávat do query stringu, protože URL se logují.

Každý replay dotaz i živý event musí být filtrován podle `user_id`. Cursor nesmí fungovat jako oprávnění.

## Fallow security kandidáti

Fallow označil 11 skládání cest (`path.join/resolve`) jako možné path traversal. Ruční kontrola ukázala pevné názvy pod `process.cwd()` nebo serverem řízenou env cestu; žádná z označených cest nepoužívá request parametr. Jde o neprokázané kandidáty, ne P0 zranitelnosti. Po doplnění validace `DATABASE_URL` lze findings vědomě suppressnout.

## Dependency audit

`npm audit --omit=dev --json` dne 2026-08-31 vrátil 8 zranitelností: 6 high a 2 low. Dotčené balíky jsou `vite` (direct) a tranzitivní `@babel/core`, `brace-expansion`, `esbuild`, `js-yaml`, `nanoid`, `postcss`, `protobufjs`; npm u všech uvádí dostupnou opravu. Část advisories se týká Windows/dev nebo specifického zpracování nedůvěryhodných vstupů, proto samotný počet neprokazuje exploit na Linux VPS.

Postup: aktualizovat lockfile v samostatné změně, znovu spustit test/build/typecheck/audit a u každého zbývajícího advisory ověřit dosažitelnou cestu. Nepoužívat automatický force upgrade bez kontroly TanStack/Nitro kompatibility.

## Co audit nepokrývá

- hardening konkrétního VPS, SSH a firewallu;
- obsah Git historie a reálných logů (kvůli minimalizaci práce s citlivými daty nebyl kopírován do reportu);
- penetrační test běžící instance.
