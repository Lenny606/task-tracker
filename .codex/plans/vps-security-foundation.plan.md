---
name: VPS security foundation
overview: Připravit single-user TanStack Start aplikaci na bezpečný provoz jedné Nitro instance na VPS, zavést společnou autentizační a autorizační hranici, oddělit secrets a vytvořit opakovatelný provozní kontrakt před jakýmkoli mobile/SSE rozšířením.
todos:
  - id: isolate-test-database
    content: Upravit DB factory a Vitest setup tak, aby všechny testy povinně používaly izolovanou temp SQLite DB a fail-fast odmítly remote URL.
    status: pending
  - id: establish-typecheck-baseline
    content: Přidat typecheck script a opravit současné TypeScript chyby v produkčních souborech tak, aby nový auth a sync kontrakt měl čistý gate.
    status: pending
  - id: add-single-user-auth
    content: Přidat users a server-side sessions, seed/CLI pro jediný účet a login/logout s bezpečnými cookie parametry.
    status: pending
  - id: enforce-authorization
    content: Zavést centrální auth/ownership guard pro server functions, API routes, agent chat, extension pairing a budoucí SSE endpointy.
    status: pending
  - id: harden-secrets-and-boundaries
    content: Oddělit synchronizovatelné preference od server secrets, odstranit veřejné vydávání extension tokenu, zpřesnit CORS/SSRF a přidat body/rate limity.
    status: pending
  - id: create-vps-runtime
    content: Přidat pinovaný production start/deployment, TLS reverse-proxy konfiguraci, liveness/readiness a explicitní env kontrakt.
    status: pending
  - id: add-migrate-backup-restore
    content: Sjednotit produkční migrace pro zvolený DB adapter, zapnout referenční integritu a dodat automatický backup i ověřený restore drill.
    status: pending
  - id: remove-sensitive-runtime-artifacts
    content: Po review odstranit runtime exports a agent log z Git indexu, zavést redakci/retenci logů a zdokumentovat rotaci potenciálně dotčených credentials.
    status: pending
isProject: false
---

# VPS security foundation

## Execution Notes

Výchozí scope je jeden účet bez registrace a jedna Nitro instance. Auth guard musí být sdílená doménová hranice, ne sada kontrol roztroušených v komponentách. Začni hermetickými testy, protože současný Vitest proces načítá lokální Turso env. Podrobný audit je ve `spec/004_vps_sse_mobile_sync/`.

## Constraints

- Neměnit LLM model.
- Mobil ani extension nesmí získat Turso/DB token ani Jira/Tempo/LLM secret.
- Zachovat lokální dev SQLite fallback.
- Odstranění již tracked dat/logů a rotaci secrets provést až po explicitním review dopadu na Git historii.
- První release nemá veřejnou registraci ani multi-instance orchestration.

## Operator Guidance

Tento plán je upstream dependency pro `sync-domain-contract` a `sse-clients-rollout`. Testuj anonymní i přihlášené requesty na každé serverové hranici. VPS release není hotový bez reálně provedeného restore testu a bez ověření, že aplikační port není veřejně dostupný mimo reverse proxy.
