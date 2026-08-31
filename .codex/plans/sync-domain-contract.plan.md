---
name: Sync domain contract
overview: Přestavět současné full-snapshot a file-based mutace na user-scoped, verzované a idempotentní domain commandy s transakčním change-logem, aby web, extension a budoucí mobil mohly bezpečně sdílet data.
todos:
  - id: define-sync-contract-v1
    content: Definovat Zod a OpenAPI kontrakt pro entity, explicitní commandy, receipts, conflicts, snapshot, changes a cursor semantics včetně timezone pravidel.
    status: pending
  - id: add-sync-schema
    content: Přidat user_id, version, dynamické timestamps a tombstones k syncovatelným entitám plus tabulky sync_events, mutation_receipts a potřebné compound indexy.
    status: pending
  - id: backfill-sync-schema
    content: Vytvořit additive migraci a backfill existujících dat na seeded usera, ověřit constraints na kopii databáze a připravit rollback.
    status: pending
  - id: implement-command-transactions
    content: Implementovat transakční command service, která atomicky ověří receipt/baseVersion, změní entity, zvýší version a vloží sync event.
    status: pending
  - id: make-timers-server-authoritative
    content: Nahradit toggle/full snapshot explicitními start, stop a adjust commandy a serverově vynutit nejvýše jeden aktivní timer na uživatele.
    status: pending
  - id: harden-worklog-idempotency
    content: Opravit worklog primary key a zavést idempotency/state machine pro Tempo tak, aby retry po částečném selhání nevytvářel duplicity.
    status: pending
  - id: migrate-all-writers
    content: Přesměrovat web, agent tools a extension na stejnou command service a odstranit dvojí JSON/DB timer persistence po ověření parity.
    status: pending
  - id: add-sync-integration-tests
    content: Přidat izolované DB testy pro concurrency, duplicate retry, tombstones, ownership, midnight/DST a local SQLite/Turso contract parity.
    status: pending
isProject: false
---

# Sync domain contract

## Execution Notes

SSE se v této fázi ještě neimplementuje. Nejdřív musí existovat durable, replayovatelný zdroj pravdy. `sync_events` je append-only pořadí změn; `mutation_receipts` zajišťují bezpečné retry. Timer commandy používají serverový čas a explicitní user timezone.

## Constraints

- Každá business změna a event musí být v jedné DB transakci.
- Stale `baseVersion` vrací konflikt; žádné tiché last-write-wins pro čas.
- Delete vytváří tombstone.
- Secrets settings nejsou syncovatelné entity.
- Nepřipojovat mobil přímo k Turso.
- Zachovat API versioning pod `/api/v1`.

## Operator Guidance

Spustit až po dokončení `VPS security foundation`. Migrační kroky dělat additive a testovat nad anonymizovanou kopií aktuální DB. Před odstraněním JSON persistence vyžadovat parity test web + extension. Hotový plán je upstream pro `SSE clients rollout`.
