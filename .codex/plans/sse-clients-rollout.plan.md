---
name: SSE clients rollout
overview: Nad hotovým auth a sync domain kontraktem dodat snapshot/changes/commands API, durable authenticated SSE s replayem a napojení webu, extension a mobile contract harness včetně VPS proxy a observability.
todos:
  - id: implement-sync-read-api
    content: Implementovat user-scoped snapshot a stránkované changes endpointy s konzistentním cursorem, tombstones, retencí a cursor_expired odpovědí.
    status: pending
  - id: expose-command-api
    content: Vystavit autorizovaný batch commands endpoint nad domain service a vracet receipts, validation chyby a 409 current-entity konflikty.
    status: pending
  - id: implement-durable-sse
    content: Přidat authenticated SSE route s id/event/data/retry framingem, Last-Event-ID replayem, heartbeatem, AbortSignal cleanupem a slow-consumer limitem.
    status: pending
  - id: configure-sse-proxy
    content: Nastavit reverse proxy bez bufferingu/transformace, s vhodným timeoutem a ověřit reconnect při graceful restartu Nitro procesu.
    status: pending
  - id: integrate-web-query-cache
    content: Přidat jeden root SSE klient, cursor catch-up a cílené mapování sync eventů na React Query keys s foreground/reconnect fallbackem.
    status: pending
  - id: migrate-extension-client
    content: Přidat HTTPS base URL a device pairing extension, přejít na explicitní commandy a odstranit starý shared-token/file sync po rollout ověření.
    status: pending
  - id: build-mobile-contract-harness
    content: Vytvořit referenční headless klient simulující local store, offline command queue, pull, cursor a foreground SSE bez volby konkrétního mobilního UI stacku.
    status: pending
  - id: test-replay-and-failures
    content: Automatizovat E2E scénáře reconnect/replay, restart, retention gap, concurrent devices, duplicate POST, tenant isolation a slow consumer.
    status: pending
  - id: add-sync-observability
    content: Přidat metriky active streams, reconnect rate, event lag, command latency/conflicts, resync count a alarmy pro backup age a disk.
    status: pending
  - id: stage-production-rollout
    content: Nasadit nejprve pull-only fallback, potom web SSE, extension a mobile harness; zdokumentovat feature-flag rollback, který vypne SSE bez ztráty sync correctness.
    status: pending
isProject: false
---

# SSE clients rollout

## Execution Notes

SSE event je pouze malá invalidace s `sync_events.seq`; klient vždy umí obnovit správný stav přes `changes`. Web používá same-origin HttpOnly cookie, mobil a extension revokovatelný device token přes fetch-based stream. Jedna VPS instance může používat in-process fanout po commitu, ale replay čte durable event log.

## Constraints

- Neimplementovat SSE jako jediný sync mechanismus.
- Žádný full snapshot ani secret v event payloadu.
- Právě jeden stream na klient/tab; targeted Query invalidation.
- Background mobile correctness nesmí záviset na dlouhém SSE spojení.
- Multi-instance broker a push notifikace jsou deferred.
- SSE musí jít feature flagem vypnout při zachování pull syncu.

## Operator Guidance

Spustit až po dokončení `Sync domain contract`. Validovat přes explicitní plan-graph dependency `vps-security-foundation -> sync-domain-contract -> sse-clients-rollout`. Před produkcí ověřit proxy na skutečném VPS, graceful restart, cursor replay a restore databáze; lokální unit test samotného stream framingu nestačí.
