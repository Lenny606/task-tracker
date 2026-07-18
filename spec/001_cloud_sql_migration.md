# Specifikace: 001 - Migrace na cloudovou SQL databázi

Tento dokument specifikuje plán a technické kroky pro migraci lokální databáze **SQLite** na cloudovou relační databázi (**SQL Cloud Database**) v projektu **Task Tracker**.

---

## 1. Analýza současného stavu

Projekt aktuálně využívá lokální databázi **SQLite** běžící v souboru `./.db/task-tracker.sqlite`.
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Ovladač**: `better-sqlite3`
- **Schéma**: Definováno v [schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts) s následujícími tabulkami:
  - `tracker_projects` (projekty sledovače)
  - `settings` (nastavení AI a integrací)
  - `worklogs` (výkazy práce)
  - `projects` (Jira projekty)
  - `history_tasks` (historie úkolů za den)
  - `day_metrics` (denní metriky a AI shrnutí)

---

## 2. Návrhy cloudových SQL databází

Pro migraci navrhujeme tři hlavní cloudové SQL databáze plně podporované Drizzle ORM:

### Volba A: Neon (Serverless PostgreSQL) — *Doporučeno*
Neon je serverless PostgreSQL postavený pro moderní webové frameworky.
- **Výhody**:
  - **Scale-to-zero**: V neaktivitě se databáze uspí (vysoká úspora nákladů u free tieru).
  - **Database Branching**: Možnost vytvářet izolované kopie databáze pro testování / vývojové větve (stejně jako v Gitu).
  - **Skvělá integrace**: Drizzle ORM má pro Neon nativní ovladač (`@neondatabase/serverless`).
  - **Rychlost**: Optimalizováno pro serverless prostředí (rychlé studené starty).

### Volba B: Supabase (Managed PostgreSQL)
Komplexní platforma postavená nad PostgreSQL.
- **Výhody**:
  - Obsahuje vestavěné služby jako Authentication, Storage a Real-time subskripce.
  - Vynikající webové uživatelské rozhraní pro správu a prohlížení tabulek.
- **Nevýhody**:
  - Vyšší režie, pokud potřebujeme pouze čistou databázi bez dalších služeb (Auth, Storage).

### Volba C: Turso (Cloud SQLite / libSQL)
Pokud bychom chtěli zachovat dialekt SQLite, ale přesunout data do cloudu s nízkou latencí.
- **Výhody**:
  - Není nutné přepisovat definice schémat v Drizzle ORM (zůstává `sqlite-core`).
  - Extrémně rychlé čtení díky replikaci na edge serverech.
- **Nevýhody**:
  - SQLite nepodporuje pokročilé databázové funkce, jako jsou plnohodnotné konkurentní indexy, bohaté datové typy (JSONB, ENUM) atd.

---

## 3. Technické změny při přechodu na PostgreSQL (Neon/Supabase)

Při přechodu z SQLite na PostgreSQL bude nutné upravit definice schématu a nahradit SQLite-specifické datové typy typy pro PostgreSQL v [src/db/schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts).

### Změna schématu (Příklad)

```typescript
// PŮVODNÍ (SQLite):
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const trackerProjects = sqliteTable('tracker_projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  timeBudgetSeconds: integer('time_budget_seconds').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

// NOVÉ (PostgreSQL):
import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const trackerProjects = pgTable('tracker_projects', {
  id: text('id').primaryKey(), // Lze zachovat text pro uuid/string, nebo přejít na uuid()
  name: text('name').notNull(),
  timeBudgetSeconds: integer('time_budget_seconds').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Změny v závislostech (`package.json`)
1. Odebrat `better-sqlite3` a `@types/better-sqlite3`.
2. Přidat klientskou knihovnu pro PostgreSQL, např.:
   - Pro Neon: `npm install @neondatabase/serverless`
   - Pro obecný Postgres: `npm install pg` a `@types/pg` (jako devDependency)

### Změna konfigurace (`drizzle.config.ts`)
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 4. Postup migrace dat (Local SQLite -> Cloud PG)

Pro bezpečný přechod a zachování stávajících dat navrhujeme vytvořit jednorázový migrační skript (např. v `.agent/scripts/migrate_sqlite_to_pg.ts`):

1. **Inicializace cílové DB**: Spustit `npx drizzle-kit push` (nebo spustit vygenerované migrace) na cloudové databázi pro vytvoření prázdných tabulek se správnou strukturou.
2. **Extrakt dat**: Načíst všechna data z lokálního souboru `task-tracker.sqlite` pomocí `better-sqlite3`.
3. **Transformace dat**: Upravit datové typy (např. převod timestampů uložených jako UNIX epoch / milisekundy na ISO formát pro Postgres).
4. **Load (Import)**: Dávkově (batch insert) zapsat data do cloudové PostgreSQL databáze s vypnutými cizími klíči po dobu importu pro zamezení chyb s pořadím vkládání.
5. **Verifikace**: Porovnat počty záznamů v lokální a cloudové databázi pro všechny tabulky.

---

## 6. Akční plán krok za krokem

1. **Výběr DB**: Rozhodnout se pro **Neon (PostgreSQL)**.
2. **Vytvoření instance**: Založit projekt na Neon.tech a získat připojovací řetězec `DATABASE_URL`.
3. **Konfigurace prostředí**: Přidat `DATABASE_URL` do souboru `.env` (a zajistit, aby nebyly citlivé klíče uvolněny do repozitáře).
4. **Refaktor schématu**: Přepsat [src/db/schema.ts](file:///home/tomas/my-projects/task-tracker/src/db/schema.ts) na `pg-core`.
5. **Migrace schématu**: Vygenerovat nové migrace pomocí `npx drizzle-kit generate` a aplikovat je pomocí `npx drizzle-kit migrate`.
6. **Migrace dat**: Spustit migrační skript pro přenos existujících dat z SQLite.
7. **Testování**: Spustit lokální aplikaci (`npm run dev`) a ověřit, že vše funguje správně.
8. **Odstranění SQLite**: Smazat lokální `.db` složku a odebrat staré sqlite balíčky.
