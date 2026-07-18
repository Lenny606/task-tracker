# Specifikace: 001 - Migrace na cloudovou databázi Turso

Tento dokument specifikuje plán a technické kroky pro migraci lokální databáze **SQLite** na cloudovou platformu **Turso (libSQL)** v projektu **Task Tracker**.

---

## 1. Analýza současného stavu

Projekt aktuálně využívá lokální databázi **SQLite** běžící v souboru `./.db/task-tracker.sqlite`.
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Ovladač**: `better-sqlite3`
- **Schéma**: Definováno v [schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts) s tabulkami `tracker_projects`, `settings`, `worklogs`, `projects`, `history_tasks` a `day_metrics`.

---

## 2. Proč Turso (libSQL)?

Turso je plně spravovaná cloudová databáze postavená na libSQL (forku SQLite), která je pro tento projekt ideálním cílem:

- **Zachování schématu**: Vzhledem k tomu, že Turso je kompatibilní se SQLite, nemusíme měnit žádný kód schémat v [schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts) (zůstává `sqlite-core` a `sqliteTable`).
- **Nízká latence na Edge**: Turso replikuje databázi blíže k uživatelům/serverless funkcím.
- **Drizzle integrace**: Drizzle ORM a Drizzle Kit mají prvotřídní podporu pro Turso/libSQL.

---

## 3. Technické změny při přechodu na Turso

### Změny v závislostech (`package.json`)
Odebereme lokální `better-sqlite3` a nahradíme jej oficiálním klientem `@libsql/client`.

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
npm install @libsql/client
```

### Změna inicializace databáze v kódu
Místo `better-sqlite3` připojení inicializujeme `@libsql/client`:

```typescript
// PŮVODNÍ (better-sqlite3):
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('./.db/task-tracker.sqlite');
export const db = drizzle(sqlite);

// NOVÉ (Turso / libSQL):
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);
```

### Změna konfigurace (`drizzle.config.ts`)
Aktualizace konfigurace Drizzle Kit pro dialekt `turso`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

---

## 4. Postup migrace dat (Lokální SQLite -> Turso)

Vzhledem k tomu, že formát souborů SQLite a libSQL je kompatibilní, lze migraci provést velmi jednoduše pomocí CLI nástroje Turso:

1. **Vytvoření databáze na Turso**:
   ```bash
   turso db create task-tracker-db
   ```
2. **Nahrání existující databáze**:
   Lokální SQLite soubor můžeme přímo nahrát jako výchozí bod nové Turso databáze:
   ```bash
   turso db create task-tracker-db --from-file ./.db/task-tracker.sqlite
   ```
   Tímto se automaticky přenesou všechna stávající data i struktura tabulek bez nutnosti psát migrační skripty.

3. **Získání přihlašovacích údajů**:
   Získání připojovací URL a autorizačního tokenu:
   ```bash
   turso db show task-tracker-db --url
   turso db tokens create task-tracker-db
   ```

---

## 5. Akční plán krok za krokem

1. **Nainstalovat Turso CLI** (pokud ještě není nainstalováno) a přihlásit se (`turso auth login`).
2. **Vytvořit databázi** z lokálního souboru pomocí `--from-file`.
3. **Konfigurace prostředí**: Přidat `TURSO_DATABASE_URL` a `TURSO_AUTH_TOKEN` do `.env`.
4. **Instalace závislostí**: Nahradit `better-sqlite3` za `@libsql/client`.
5. **Aktualizace inicializace DB**: Upravit klientský kód v projektu na použití `@libsql/client`.
6. **Aktualizace drizzle.config.ts** na dialekt `turso`.
7. **Verifikace a testování**: Spustit projekt lokálně a spustit testy (`npm run test`).
