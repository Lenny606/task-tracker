import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: process.env.TURSO_DATABASE_URL ? 'turso' : 'sqlite',
  dbCredentials: process.env.TURSO_DATABASE_URL ? {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  } : {
    url: './.db/task-tracker.sqlite',
  },
});
